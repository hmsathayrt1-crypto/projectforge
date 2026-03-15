// ProjectForge - Team Matching API
import { corsResponse, withCors } from '../_cors';

// Projects data for reference
const PROJECTS_DATA = [
  { id: 1, title: 'E-Commerce Platform', required_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Docker'], team_size_min: 3, team_size_max: 5 },
  { id: 2, title: 'AI Chatbot Assistant', required_skills: ['Python', 'Machine Learning', 'NLP', 'Flask', 'Deep Learning'], team_size_min: 2, team_size_max: 4 },
  { id: 3, title: 'Mobile Fitness App', required_skills: ['Flutter', 'Dart', 'Firebase', 'Mobile Design'], team_size_min: 2, team_size_max: 4 },
  { id: 4, title: 'Smart Home IoT System', required_skills: ['Arduino', 'Raspberry Pi', 'Python', 'MQTT', 'React'], team_size_min: 3, team_size_max: 5 },
  { id: 5, title: 'Online Learning Platform', required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Video Streaming'], team_size_min: 3, team_size_max: 5 },
  { id: 6, title: 'Image Recognition App', required_skills: ['Python', 'Computer Vision', 'Deep Learning', 'TensorFlow'], team_size_min: 2, team_size_max: 4 },
  { id: 7, title: 'Cybersecurity Dashboard', required_skills: ['Python', 'Web Security', 'SQL', 'React', 'Docker'], team_size_min: 3, team_size_max: 5 },
  { id: 8, title: 'Social Media Analytics', required_skills: ['Python', 'Machine Learning', 'NLP', 'React', 'API Integration'], team_size_min: 2, team_size_max: 4 },
  { id: 9, title: 'Inventory Management System', required_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Docker'], team_size_min: 2, team_size_max: 3 },
  { id: 10, title: 'Blockchain Voting System', required_skills: ['JavaScript', 'Web Security', 'Cryptography', 'Solidity'], team_size_min: 3, team_size_max: 5 }
];

const SKILL_NAMES = ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Swift', 'Kotlin', 'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'HTML/CSS', 'Flutter', 'React Native', 'Android Native', 'iOS Native', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Cloudflare', 'Web Security', 'Cryptography', 'Penetration Testing', 'Arduino', 'Raspberry Pi', 'Embedded Systems', 'Project Management', 'Technical Writing', 'Presentation', 'Team Leadership'];

// OPTIONS for CORS
export async function onRequestOptions() {
  return corsResponse();
}

// GET /api/teams/match
export async function onRequestGet(context: any) {
  const authHeader = context.request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  }

  const token = authHeader.substring(7);
  const { searchParams } = new URL(context.request.url);
  const projectId = parseInt(searchParams.get('projectId') || '0');
  
  const kv = context.env.KV;
  const project = PROJECTS_DATA.find(p => p.id === projectId);
  
  try {
    // Get current user
    const userData = await kv.get(`token:${token}`);
    if (!userData) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: withCors({ 'Content-Type': 'application/json' })
      });
    }
    
    const user = JSON.parse(userData);
    
    // Get user skills
    const skillsData = await kv.get(`user_skills:${user.id}`);
    const userSkills = skillsData ? JSON.parse(skillsData) : [];
    const userSkillNames = userSkills.map((s: any) => SKILL_NAMES[s.skill_id - 1]).filter(Boolean);
    
    // Get all users (simplified - in production would use proper query)
    const allUsersData = await kv.get('all_users') || '[]';
    const allUsers = JSON.parse(allUsersData);
    
    // Calculate compatibility with other users
    const matches = allUsers
      .filter((u: any) => u.id !== user.id)
      .map((potentialUser: any) => {
        const potentialSkills = potentialUser.skills || [];
        const potentialSkillNames = potentialSkills.map((s: any) => SKILL_NAMES[s.skill_id - 1]).filter(Boolean);
        
        const complementarySkills = project?.required_skills.filter((s: string) => 
          !userSkillNames.includes(s) && potentialSkillNames.includes(s)
        ) || [];
        
        const sharedSkills = project?.required_skills.filter((s: string) => 
          userSkillNames.includes(s) && potentialSkillNames.includes(s)
        ) || [];
        
        const compatibilityScore = (complementarySkills.length * 2) + (sharedSkills.length * 0.5);
        
        return {
          userId: potentialUser.id,
          name: potentialUser.full_name,
          university: potentialUser.university,
          major: potentialUser.major,
          complementarySkills,
          sharedSkills,
          compatibilityScore: Math.round(compatibilityScore * 10) / 10
        };
      })
      .sort((a: any, b: any) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 10);
    
    return new Response(JSON.stringify({
      projectId,
      requiredSkills: project?.required_skills || [],
      currentUserSkills: userSkillNames,
      matches
    }), {
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  } catch (error) {
    console.error('Team match error:', error);
    
    // Return mock data if KV fails
    const mockMatches = [
      {
        name: 'أحمد محمد',
        university: 'جامعة دمشق',
        major: 'هندسة برمجيات',
        complementarySkills: ['Python', 'SQL'],
        sharedSkills: ['JavaScript'],
        compatibilityScore: 8.5
      },
      {
        name: 'سارة أحمد',
        university: 'جامعة حلب',
        major: 'علم حاسوب',
        complementarySkills: ['Docker'],
        sharedSkills: ['React', 'Node.js'],
        compatibilityScore: 7.2
      }
    ];
    
    let userSkillNames: string[] = [];
    try {
      const userData = await kv.get(`token:${token}`);
      if (userData) {
        const user = JSON.parse(userData);
        const skillsData = await kv.get(`user_skills:${user.id}`);
        const userSkills = skillsData ? JSON.parse(skillsData) : [];
        userSkillNames = userSkills.map((s: any) => SKILL_NAMES[s.skill_id - 1]).filter(Boolean);
      }
    } catch (e) {}
    
    return new Response(JSON.stringify({
      projectId,
      requiredSkills: project?.required_skills || [],
      currentUserSkills: userSkillNames,
      matches: mockMatches
    }), {
      headers: withCors({ 'Content-Type': 'application/json' })
    });
  }
}