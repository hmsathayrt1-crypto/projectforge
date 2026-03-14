import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/serve-static';

// Type definitions
interface Env {
  DB: D1Database;
  KV: KVNamespace;
  AI: any;
  NANOGPT_API_KEY: string;
}

interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  university?: string;
  major?: string;
  year: number;
  created_at: string;
  token?: string;
  token_expires?: string;
}

interface Skill {
  id: number;
  name: string;
  category: string;
  description: string;
  weight: number;
}

interface UserSkill {
  skill_id: number;
  level: number;
  interest: number;
}

interface Project {
  id: number;
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  category: string;
  difficulty: string;
  required_skills: string;
  estimated_duration_weeks: number;
  team_size_min: number;
  team_size_max: number;
  tags: string;
}

// Utility functions
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateUserId(): string {
  return 'user_' + generateToken().substring(0, 16);
}

// Create the app
const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Serve static files
app.use('/*', serveStatic({ root: './public' }));

// ============================================
// AUTH ENDPOINTS
// ============================================

// Register
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, full_name, university, major, year } = await c.req.json();
    
    if (!email || !password || !full_name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const db = c.env.DB;
    
    // Check if user exists
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return c.json({ error: 'Email already registered' }, 409);
    }

    // Create user
    const userId = generateUserId();
    const passwordHash = await hashPassword(password);
    const token = generateToken();
    const tokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    await db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, university, major, year, token, token_expires)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, email, passwordHash, full_name, university || null, major || null, year || 4, token, tokenExpires).run();

    return c.json({
      success: true,
      user: { id: userId, email, full_name, university, major, year: year || 4 },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Login
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    const db = c.env.DB;
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() as User | null;

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const passwordHash = await hashPassword(password);
    if (user.password_hash !== passwordHash) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate new token
    const token = generateToken();
    const tokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await db.prepare('UPDATE users SET token = ?, token_expires = ? WHERE id = ?')
      .bind(token, tokenExpires, user.id).run();

    return c.json({
      success: true,
      user: { id: user.id, email: user.email, full_name: user.full_name, university: user.university, major: user.major, year: user.year },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Logout
app.post('/api/auth/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    await c.env.DB.prepare('UPDATE users SET token = NULL, token_expires = NULL WHERE token = ?')
      .bind(token).run();
  }
  return c.json({ success: true });
});

// Get current user
app.get('/api/auth/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const user = await c.env.DB.prepare(`
      SELECT id, email, full_name, university, major, year, created_at 
      FROM users WHERE token = ? AND token_expires > datetime('now')
    `).bind(token).first();

    if (!user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Get user skills
    const skills = await c.env.DB.prepare(`
      SELECT us.skill_id, us.level, us.interest, s.name, s.category 
      FROM user_skills us 
      JOIN skills s ON us.skill_id = s.id 
      WHERE us.user_id = ?
    `).bind((user as any).id).all();

    return c.json({ user, skills: skills.results });
  } catch (error) {
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// ============================================
// SKILLS ENDPOINTS
// ============================================

// Get all skills
app.get('/api/skills', async (c) => {
  try {
    const { category } = c.req.query();
    let query = 'SELECT * FROM skills';
    if (category) {
      query += ' WHERE category = ?';
    }
    query += ' ORDER BY category, name';
    
    const stmt = category 
      ? c.env.DB.prepare(query).bind(category)
      : c.env.DB.prepare(query);
    
    const result = await stmt.all();
    return c.json({ skills: result.results });
  } catch (error) {
    return c.json({ error: 'Failed to get skills' }, 500);
  }
});

// Update user skills (survey)
app.post('/api/skills/survey', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE token = ?').bind(token).first();
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const { skills } = await c.req.json() as { skills: UserSkill[] };
    const userId = (user as any).id;

    // Clear existing skills
    await c.env.DB.prepare('DELETE FROM user_skills WHERE user_id = ?').bind(userId).run();

    // Insert new skills
    for (const skill of skills) {
      await c.env.DB.prepare(`
        INSERT INTO user_skills (user_id, skill_id, level, interest)
        VALUES (?, ?, ?, ?)
      `).bind(userId, skill.skill_id, skill.level || 1, skill.interest || 3).run();
    }

    return c.json({ success: true, message: 'Skills updated successfully' });
  } catch (error) {
    console.error('Survey error:', error);
    return c.json({ error: 'Failed to save survey' }, 500);
  }
});

// ============================================
// PROJECTS ENDPOINTS
// ============================================

// Get all projects
app.get('/api/projects', async (c) => {
  try {
    const { category, difficulty, limit = 50, offset = 0 } = c.req.query();
    
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params: any[] = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }
    
    query += ' ORDER BY id LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    // Parse JSON fields
    const projects = result.results.map((p: any) => ({
      ...p,
      required_skills: JSON.parse(p.required_skills || '[]'),
      tags: JSON.parse(p.tags || '[]')
    }));
    
    return c.json({ projects });
  } catch (error) {
    return c.json({ error: 'Failed to get projects' }, 500);
  }
});

// Get single project
app.get('/api/projects/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    const parsed = {
      ...project,
      required_skills: JSON.parse((project as any).required_skills || '[]'),
      tags: JSON.parse((project as any).tags || '[]')
    };
    
    return c.json({ project: parsed });
  } catch (error) {
    return c.json({ error: 'Failed to get project' }, 500);
  }
});

// ============================================
// RECOMMENDATIONS ENDPOINT
// ============================================

app.get('/api/recommendations', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE token = ?').bind(token).first();
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const userId = (user as any).id;

    // Get user skills
    const userSkills = await c.env.DB.prepare(`
      SELECT us.skill_id, us.level, us.interest, s.name, s.weight, s.category
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
    `).bind(userId).all();

    if (!userSkills.results.length) {
      return c.json({ error: 'Please complete the skills surveyfirst', needSurvey: true }, 400);
    }

    // Get all projects
    const projects = await c.env.DB.prepare('SELECT * FROM projects').all();

    // Calculate compatibility scores
    const recommendations = projects.results.map((project: any) => {
      const requiredSkills = JSON.parse(project.required_skills || '[]');
      const userSkillsList = userSkills.results.map((s: any) => s.name);
      
      // Calculate skill match
      const matchedSkills = requiredSkills.filter((skill: string) => 
        userSkillsList.includes(skill)
      );
      
      // Calculate weighted score
      let totalWeight = 0;
      let matchedWeight = 0;
      
      for (const skillName of requiredSkills) {
        const userSkill = userSkills.results.find((s: any) => s.name === skillName) as any;
        if (userSkill) {
          const skillWeight = userSkill.weight || 1;
          const levelMultiplier = userSkill.level / 5;
          const interestMultiplier = userSkill.interest / 3; // 1-5 normalized
          matchedWeight += skillWeight * levelMultiplier * interestMultiplier;
        }
        totalWeight += 1;
      }
      
      const score = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;
      const matchPercent = requiredSkills.length > 0 
        ? (matchedSkills.length / requiredSkills.length) * 100 
        : 0;
      
      return {
        project: {
          ...project,
          required_skills: requiredSkills,
          tags: JSON.parse(project.tags || '[]')
        },
        score: Math.round(score),
        matchPercent: Math.round(matchPercent),
        matchedSkills,
        missingSkills: requiredSkills.filter((s: string) => !userSkillsList.includes(s)),
        reasons: generateRecommendationReasons(score, matchPercent, matchedSkills)
      };
    });

    // Sort by score
    recommendations.sort((a: any, b: any) => b.score - a.score);

    // Top 10 recommendations
    const topRecommendations = recommendations.slice(0, 10);

    return c.json({ 
      recommendations: topRecommendations,
      userSkills: userSkills.results
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return c.json({ error: 'Failed to generate recommendations' }, 500);
  }
});

function generateRecommendationReasons(score: number, matchPercent: number, matchedSkills: string[]): string[] {
  const reasons: string[] = [];
  
  if (matchPercent >= 80) {
    reasons.push('🏆 Excellent skill match! You have most of the required skills.');
  } else if (matchPercent >= 50) {
    reasons.push('✅ Good skill match. You have solid foundations for this project.');
  } else {
    reasons.push('📚 This project will help you learn new skills.');
  }
  
  if (matchedSkills.length > 0) {
    reasons.push(`💼 You already know: ${matchedSkills.slice(0, 3).join(', ')}${matchedSkills.length > 3 ? '...' : ''}`);
  }
  
  if (score >= 70) {
    reasons.push('🎯 High compatibility score based on your skill levels.');
  }
  
  return reasons;
}

// ============================================
// SANDBOX - PROJECT PLAN GENERATOR
// ============================================

app.post('/api/sandbox/generate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE token = ?').bind(token).first();
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const { projectId } = await c.req.json();
    const userId = (user as any).id;

    // Get project
    const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first() as Project | null;
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Get user skills
    const userSkills = await c.env.DB.prepare(`
      SELECT s.name, us.level, us.interest
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
    `).bind(userId).all();

    // Generate plan using AI
    const plan = await generateProjectPlan(c.env, project, userSkills.results);

    // Save plan
    await c.env.DB.prepare(`
      INSERT INTO project_plans (user_id, project_id, plan_data)
      VALUES (?, ?, ?)
    `).bind(userId, projectId, JSON.stringify(plan)).run();

    return c.json({ plan });
  } catch (error) {
    console.error('Sandbox error:', error);
    return c.json({ error: 'Failed to generate plan' }, 500);
  }
});

async function generateProjectPlan(env: Env, project: Project, userSkills: any[]): Promise<any> {
  const requiredSkills = JSON.parse(project.required_skills || '[]');
  const skillGap = requiredSkills.filter((s: string) => 
    !userSkills.some((us: any) => us.name === s)
  );

  // Calculate estimated duration based on skill gaps
  const skillGapFactor = skillGap.length / Math.max(requiredSkills.length, 1);
  const adjustedDuration = Math.round(project.estimated_duration_weeks * (1 + skillGapFactor * 0.5));

  // Generate milestones
  const milestones = generateMilestones(project, adjustedDuration, skillGap);
  
  // Generate risks
  const risks = generateRisks(project, skillGap);
  
  // Generate resources
  const resources = generateResources(project, requiredSkills, skillGap);

  return {
    projectId: project.id,
    projectTitle: project.title,
    projectTitleAr: project.title_ar,
    duration: {
      estimated: project.estimated_duration_weeks,
      adjusted: adjustedDuration,
      unit: 'weeks'
    },
    milestones,
    risks,
    resources,
    teamRecommendation: {
      minSize: project.team_size_min,
      maxSize: project.team_size_max,
      ideal: Math.ceil((project.team_size_min + project.team_size_max) / 2),
      neededSkills: skillGap
    }
  };
}

function generateMilestones(project: Project, duration: number, skillGap: string[]): any[] {
  const phases = [
    { name: 'Research & Planning', nameAr: 'البحث والتخطيط', percent: 15 },
    { name: 'Design & Architecture', nameAr: 'التصميم والهيكلة', percent: 20 },
    { name: 'Core Development', nameAr: 'التطوير الأساسي', percent: 35 },
    { name: 'Testing & Refinement', nameAr: 'الاختبار والتحسين', percent: 20 },
    { name: 'Documentation & Presentation', nameAr: 'التوثيق والعرض', percent: 10 }
  ];

  let currentWeek = 1;
  
  return phases.map(phase => {
    const weeks = Math.round(duration * (phase.percent / 100));
    const startWeek = currentWeek;
    currentWeek += weeks;
    
    return {
      name: phase.name,
      nameAr: phase.nameAr,
      startWeek,
      endWeek: currentWeek - 1,
      tasks: generatePhaseTasks(phase.name, skillGap),
      deliverables: generateDeliverables(phase.name)
    };
  });
}

function generatePhaseTasks(phase: string, skillGap: string[]): string[] {
  const tasks: { [key: string]: string[] } = {
    'Research & Planning': [
      'Literature review and related work analysis',
      'Define project scope and requirements',
      'Create project timeline and milestones',
      'Technology stack selection',
      ...skillGap.map(s => `Learn basics of ${s}`)
    ],
    'Design & Architecture': [
      'System architecture design',
      'Database schema design',
      'API specification',
      'UI/UX wireframes',
      'Technical documentation'
    ],
    'Core Development': [
      'Setup development environment',
      'Implement database layer',
      'Build API endpoints',
      'Develop frontend components',
      'Integration with external services'
    ],
    'Testing & Refinement': [
      'Unit testing',
      'Integration testing',
      'User acceptance testing',
      'Performance optimization',
      'Bug fixes and polish'
    ],
    'Documentation & Presentation': [
      'Write user documentation',
      'Create technical documentation',
      'Prepare presentation slides',
      'Record demo video',
      'Final deployment'
    ]
  };
  
  return tasks[phase] || [];
}

function generateDeliverables(phase: string): string[] {
  const deliverables: { [key: string]: string[] } = {
    'Research & Planning': ['Requirements Document', 'Project Proposal', 'Literature Review'],
    'Design & Architecture': ['Architecture Diagram', 'Database Schema', 'API Documentation'],
    'Core Development': ['Working Application', 'Source Code Repository', 'API Implementation'],
    'Testing & Refinement': ['Test Reports', 'Performance Metrics', 'Bug Fix Log'],
    'Documentation & Presentation': ['User Manual', 'Technical Report', 'Presentation Slides']
  };
  
  return deliverables[phase] || [];
}

function generateRisks(project: Project, skillGap: string[]): any[] {
  const risks = [
    {
      category: 'Technical',
      description: 'Complexity of implementation may exceed initial estimates',
      probability: 'Medium',
      mitigation: 'Start with MVP, add features incrementally'
    },
    {
      category: 'Timeline',
      description: 'Project may take longer than estimated',
      probability: 'Medium',
      mitigation: 'Buffer time in schedule, prioritize features'
    },
    {
      category: 'Team',
      description: 'Team coordination and availability issues',
      probability: 'Low',
      mitigation: 'Regular meetings, clear task assignments'
    }
  ];
  
  if (skillGap.length > 0) {
    risks.push({
      category: 'Skills',
      description: `Learning curve for: ${skillGap.join(', ')}`,
      probability: 'High',
      mitigation: 'Allocate learning time, use tutorials, seek mentorship'
    });
  }
  
  return risks;
}

function generateResources(project: Project, requiredSkills: string[], skillGap: string[]): any[] {
  const resources: any[] = [];
  
  // Skill resources
  for (const skill of requiredSkills) {
    const isGap = skillGap.includes(skill);
    resources.push({
      type: 'skill',
      name: skill,
      status: isGap ? 'needs_learning' : 'available',
      recommendations: isGap ? [
        `Take an online course on ${skill}`,
        `Practice with small projects`,
        `Find tutorials and documentation`
      ] : []
    });
  }
  
  // Tools
  const tools = getProjectTools(project.category);
  resources.push({
    type: 'tools',
    items: tools
  });
  
  return resources;
}

function getProjectTools(category: string): string[] {
  const toolsByCategory: { [key: string]: string[] } = {
    'web': ['VS Code', 'Git', 'Chrome DevTools', 'Postman', 'Figma'],
    'mobile': ['Android Studio', 'Xcode', 'VS Code', 'Git', 'Figma'],
    'ai': ['Jupyter Notebook', 'VS Code', 'Google Colab', 'TensorFlow', 'PyTorch'],
    'iot': ['Arduino IDE', 'PlatformIO', 'VS Code', 'Fritzing', 'MQTT Explorer'],
    'security': ['Kali Linux', 'Burp Suite', 'OWASP ZAP', 'Metasploit', 'Nmap'],
    'database': ['DBeaver', 'pgAdmin', 'MongoDB Compass', 'Redis Insight'],
    'devops': ['Docker', 'Kubernetes', 'Terraform', 'AWS Console', 'GitHub Actions']
  };
  
  return toolsByCategory[category] || ['VS Code', 'Git', 'Documentation'];
}

// ============================================
// SUCCESS ESTIMATOR
// ============================================

app.post('/api/success/estimate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE token = ?').bind(token).first();
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const { projectId, teamSize, weeklyHours } = await c.req.json();
    const userId = (user as any).id;

    // Get user skills
    const userSkills = await c.env.DB.prepare(`
      SELECT us.level, us.interest, s.weight
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
    `).bind(userId).all();

    // Get project
    const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first() as Project | null;
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Calculate success probability
    const requiredSkills = JSON.parse(project.required_skills || '[]');
    const userSkillNames = userSkills.results.map((s: any) => s.name);
    
    // Skill match factor (0-40 points)
    const skillMatch = userSkillNames.filter((s: string) => requiredSkills.includes(s)).length;
    const skillMatchScore = (skillMatch / Math.max(requiredSkills.length, 1)) * 40;
    
    // Skill level factor (0-30 points)
    const avgLevel = userSkills.results.length > 0 
      ? (userSkills.results as any[]).reduce((sum, s) => sum + s.level, 0) / userSkills.results.length 
      : 1;
    const levelScore = (avgLevel / 5) * 30;
    
    // Team factor (0-15 points)
    const idealTeam = (project.team_size_min + project.team_size_max) / 2;
    const teamScore = teamSize >= project.team_size_min && teamSize <= project.team_size_max
      ? 15
      : teamSize < project.team_size_min
        ? 5
        : 10;
    
    // Time commitment factor (0-15 points)
    const hoursPerWeek = weeklyHours || 10;
    const timeScore = Math.min(hoursPerWeek / (project.estimated_duration_weeks * 2), 1) * 15;

    const totalScore = Math.round(skillMatchScore + levelScore + teamScore + timeScore);
    
    // Determine confidence level
    let confidence = 'Low';
    let recommendations: string[] = [];
    
    if (totalScore >= 70) {
      confidence = 'High';
      recommendations.push('You have a strong foundation for this project.');
      recommendations.push('Consider adding innovative features to stand out.');
    } else if (totalScore >= 50) {
      confidence = 'Medium';
      recommendations.push('Focus on filling the skill gaps before starting.');
      recommendations.push('Consider finding team members with complementary skills.');
    } else {
      confidence = 'Low';
      recommendations.push('Significant skill development needed.');
      recommendations.push('Strongly consider a simpler project or extensive preparation.');
      recommendations.push('Find experienced team members to mentor you.');
    }

    // Save estimate
    await c.env.DB.prepare(`
      INSERT INTO recommendations (user_id, project_id, score, reasons)
      VALUES (?, ?, ?, ?)
    `).bind(userId, projectId, totalScore, JSON.stringify(recommendations)).run();

    return c.json({
      successProbability: totalScore,
      confidence,
      breakdown: {
        skillMatch: Math.round(skillMatchScore),
        skillLevel: Math.round(levelScore),
        teamFit: teamScore,
        timeCommitment: Math.round(timeScore)
      },
      recommendations
    });
  } catch (error) {
    console.error('Success estimate error:', error);
    return c.json({ error: 'Failed to estimate success' }, 500);
  }
});

// ============================================
// TEAM MATCHING
// ============================================

app.get('/api/teams/match', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE token = ?').bind(token).first();
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const { projectId } = c.req.query();
    const userId = (user as any).id;

    // Get project required skills
    const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first() as Project | null;
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const requiredSkills = JSON.parse(project.required_skills || '[]');

    // Get current user skills
    const currentUserSkills = await c.env.DB.prepare(`
      SELECT s.name, us.level
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
    `).bind(userId).all();

    const currentUserSkillNames = currentUserSkills.results.map((s: any) => s.name);

    // Find users with complementary skills
    const usersWithSkills = await c.env.DB.prepare(`
      SELECT u.id, u.full_name, u.university, u.major,
             GROUP_CONCAT(s.name) as skills
      FROM users u
      LEFT JOIN user_skills us ON u.id = us.user_id
      LEFT JOIN skills s ON us.skill_id = s.id
      WHERE u.id != ?
      GROUP BY u.id
    `).bind(userId).all();

    // Calculate compatibility scores
    const matches = usersWithSkills.results.map((potentialUser: any) => {
      const userSkillsList = potentialUser.skills ? potentialUser.skills.split(',') : [];
      
      // Skills they have that current user doesn't
      const complementarySkills = userSkillsList.filter((s: string) => 
        !currentUserSkillNames.includes(s) && requiredSkills.includes(s)
      );
      
      // Skills both have (overlap)
      const sharedSkills = userSkillsList.filter((s: string) => 
        currentUserSkillNames.includes(s)
      );
      
      // Skills neither has but project needs
      const missingSkills = requiredSkills.filter((s: string) => 
        !currentUserSkillNames.includes(s) && !userSkillsList.includes(s)
      );

      const compatibilityScore = (complementarySkills.length * 2) + (sharedSkills.length * 0.5);
      
      return {
        userId: potentialUser.id,
        name: potentialUser.full_name,
        university: potentialUser.university,
        major: potentialUser.major,
        complementarySkills,
        sharedSkills,
        missingSkills,
        compatibilityScore: Math.round(compatibilityScore * 10) / 10
      };
    });

    // Sort by compatibility
    matches.sort((a: any, b: any) => b.compatibilityScore - a.compatibilityScore);

    return c.json({
      projectId,
      requiredSkills,
      currentUserSkills: currentUserSkillNames,
      matches: matches.slice(0, 10)
    });
  } catch (error) {
    console.error('Team match error:', error);
    return c.json({ error: 'Failed to find matches' }, 500);
  }
});

// ============================================
// USER PROJECTS (Saved/Planned)
// ============================================

app.get('/api/user/projects', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE token = ?').bind(token).first();
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const userId = (user as any).id;

    const projects = await c.env.DB.prepare(`
      SELECT up.*, p.title, p.title_ar, p.description, p.category, p.difficulty
      FROM user_projects up
      JOIN projects p ON up.project_id = p.id
      WHERE up.user_id = ?
      ORDER BY up.created_at DESC
    `).bind(userId).all();

    return c.json({ projects: projects.results });
  } catch (error) {
    return c.json({ error: 'Failed to get user projects' }, 500);
  }
});

app.post('/api/user/projects', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE token = ?').bind(token).first();
    
    if (!user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const { projectId, status } = await c.req.json();
    const userId = (user as any).id;

    // Check if already saved
    const existing = await c.env.DB.prepare(`
      SELECT id FROM user_projects WHERE user_id = ? AND project_id = ?
    `).bind(userId, projectId).first();

    if (existing) {
      // Update status
      await c.env.DB.prepare(`
        UPDATE user_projects SET status = ? WHERE user_id = ? AND project_id = ?
      `).bind(status || 'interested', userId, projectId).run();
    } else {
      // Insert new
      await c.env.DB.prepare(`
        INSERT INTO user_projects (user_id, project_id, status)
        VALUES (?, ?, ?)
      `).bind(userId, projectId, status || 'interested').run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to save project' }, 500);
  }
});

// ============================================
// STATIC FILE ROUTES (for SPA)
// ============================================

// Fallback to index.html for SPA routing
app.get('*', serveStatic({ path: './public/index.html' }));

export default app;