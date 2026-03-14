// ProjectForge - Recommendations API

const PROJECTS_DATA = [
  { id: 1, title: 'E-Commerce Platform', title_ar: 'منصة تجارة إلكترونية', description: 'Build a full-featured e-commerce website', description_ar: 'بناء موقع تجارة إلكترونية متكامل', category: 'web', difficulty: 'intermediate', required_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Docker'], estimated_duration_weeks: 16, team_size_min: 3, team_size_max: 5, tags: ['web', 'full-stack', 'business'] },
  { id: 2, title: 'AI Chatbot Assistant', title_ar: 'مساعد ذكي بالذكاء الاصطناعي', description: 'Create an intelligent chatbot using NLP', description_ar: 'إنشاء روبوت محادثة ذكي باستخدام معالجة اللغة الطبيعية', category: 'ai', difficulty: 'advanced', required_skills: ['Python', 'Machine Learning', 'NLP', 'Flask', 'Deep Learning'], estimated_duration_weeks: 14, team_size_min: 2, team_size_max: 4, tags: ['ai', 'nlp', 'chatbot'] },
  { id: 3, title: 'Mobile Fitness App', title_ar: 'تطبيق لياقة بدنية للهاتف', description: 'Develop a mobile fitness tracking app', description_ar: 'تطوير تطبيق لتتبع اللياقة البدنية', category: 'mobile', difficulty: 'intermediate', required_skills: ['Flutter', 'Dart', 'Firebase', 'Mobile Design'], estimated_duration_weeks: 12, team_size_min: 2, team_size_max: 4, tags: ['mobile', 'fitness', 'social'] },
  { id: 4, title: 'Smart Home IoT System', title_ar: 'نظام منزل ذكي', description: 'Build an IoT system to control home appliances', description_ar: 'بناء نظام إنترنت الأشياء للتحكم بالأجهزة المنزلية', category: 'iot', difficulty: 'advanced', required_skills: ['Arduino', 'Raspberry Pi', 'Python', 'MQTT', 'React'], estimated_duration_weeks: 18, team_size_min: 3, team_size_max: 5, tags: ['iot', 'smart-home', 'automation'] },
  { id: 5, title: 'Online Learning Platform', title_ar: 'منصة تعلم إلكترونية', description: 'Create an e-learning platform with courses', description_ar: 'إنشاء منصة تعليم إلكتروني مع الدورات', category: 'web', difficulty: 'intermediate', required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Video Streaming'], estimated_duration_weeks: 16, team_size_min: 3, team_size_max: 5, tags: ['education', 'web', 'full-stack'] },
  { id: 6, title: 'Image Recognition App', title_ar: 'تطبيق التعرف على الصور', description: 'Develop a computer vision application', description_ar: 'تطوير تطبيق رؤية حاسوبية', category: 'ai', difficulty: 'advanced', required_skills: ['Python', 'Computer Vision', 'Deep Learning', 'TensorFlow'], estimated_duration_weeks: 14, team_size_min: 2, team_size_max: 4, tags: ['ai', 'computer-vision', 'mobile'] },
  { id: 7, title: 'Cybersecurity Dashboard', title_ar: 'لوحة أمن المعلومات', description: 'Build a security monitoring dashboard', description_ar: 'بناء لوحة مراقبة أمنية', category: 'security', difficulty: 'advanced', required_skills: ['Python', 'Web Security', 'SQL', 'React', 'Docker'], estimated_duration_weeks: 16, team_size_min: 3, team_size_max: 5, tags: ['security', 'monitoring', 'dashboard'] },
  { id: 8, title: 'Social Media Analytics', title_ar: 'تحليلات وسائل التواصل', description: 'Create a platform to analyze social media trends', description_ar: 'إنشاء منصة لتحليل اتجاهات وسائل التواصل', category: 'ai', difficulty: 'intermediate', required_skills: ['Python', 'Machine Learning', 'NLP', 'React', 'API Integration'], estimated_duration_weeks: 12, team_size_min: 2, team_size_max: 4, tags: ['ai', 'analytics', 'social'] },
  { id: 9, title: 'Inventory Management System', title_ar: 'نظام إدارة المخزون', description: 'Build a comprehensive inventory system', description_ar: 'بناء نظام مخزون شامل', category: 'web', difficulty: 'beginner', required_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Docker'], estimated_duration_weeks: 10, team_size_min: 2, team_size_max: 3, tags: ['business', 'management', 'web'] },
  { id: 10, title: 'Blockchain Voting System', title_ar: 'نظام تصويت بلوك تشين', description: 'Create a secure voting system', description_ar: 'إنشاء نظام تصويت آمن باستخدام البلوك تشين', category: 'security', difficulty: 'advanced', required_skills: ['JavaScript', 'Web Security', 'Cryptography', 'Solidity'], estimated_duration_weeks: 18, team_size_min: 3, team_size_max: 5, tags: ['blockchain', 'security', 'voting'] }
];

function generateReasons(score, matchPercent, matchedSkills) {
  const reasons = [];
  
  if (matchPercent >= 80) {
    reasons.push('🏆 تطابق ممتاز مع مهاراتك! لديك معظم المهارات المطلوبة.');
  } else if (matchPercent >= 50) {
    reasons.push('✅ تطابق جيد مع مهاراتك. أساس قوي للبدء.');
  } else {
    reasons.push('📚 فرصة ممتازة لتعلم مهارات جديدة.');
  }
  
  if (matchedSkills && matchedSkills.length > 0) {
    reasons.push(`💼 لديك بالفعل: ${matchedSkills.slice(0, 3).join('، ')}${matchedSkills.length > 3 ? '...' : ''}`);
  }
  
  if (score >= 70) {
    reasons.push('🎯 نسبة توافق عالية بناءً على مستوى مهاراتك.');
  }
  
  return reasons;
}

// GET /api/recommendations
export async function onRequestGet(context: any) {
  const authHeader = context.request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized', needSurvey: true }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const token = authHeader.substring(7);
  const kv = context.env.KV;
  
  try {
    // Get user from token
    const userData = await kv.get(`token:${token}`);
    if (!userData) {
      return new Response(JSON.stringify({ error: 'Invalid token', needSurvey: true }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = JSON.parse(userData);
    
    // Get user skills
    const skillsData = await kv.get(`user_skills:${user.id}`);
    if (!skillsData) {
      return new Response(JSON.stringify({ error: 'Please complete the skills survey first', needSurvey: true }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const userSkills = JSON.parse(skillsData);
    const userSkillNames = userSkills.map((s: any) => {
      const skill = { id: 1, name: 'Python' }; // Simplified - in real app would lookup
      return s.skill_id;
    });
    
    // Calculate recommendations
    const recommendations = PROJECTS_DATA.map(project => {
      const requiredSkills = project.required_skills;
      const matchedSkills = requiredSkills.filter((skill: string) => 
        userSkills.some((us: any) => {
          // Match by skill name instead of ID for simplicity
          const skillNames = ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Swift', 'Kotlin', 'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'HTML/CSS', 'Flutter', 'React Native', 'Android Native', 'iOS Native', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Cloudflare', 'Web Security', 'Cryptography', 'Penetration Testing', 'Arduino', 'Raspberry Pi', 'Embedded Systems', 'Project Management', 'Technical Writing', 'Presentation', 'Team Leadership'];
          return skillNames[us.skill_id - 1] === skill || us.skill_id === requiredSkills.indexOf(skill) + 1;
        })
      );
      
      // Calculate scores
      const matchPercent = requiredSkills.length > 0 
        ? (matchedSkills.length / requiredSkills.length) * 100 
        : 0;
      
      const avgLevel = userSkills.length > 0 
        ? userSkills.reduce((sum: number, s: any) => sum + (s.level || 1), 0) / userSkills.length 
        : 1;
      
      const score = Math.round((matchPercent * 0.6) + (avgLevel / 5 * 100 * 0.4));
      
      const missingSkills = requiredSkills.filter((s: string) => !matchedSkills.includes(s));
      
      return {
        project: {
          ...project,
          required_skills: requiredSkills,
          tags: project.tags
        },
        score: Math.min(score, 100),
        matchPercent: Math.round(matchPercent),
        matchedSkills,
        missingSkills,
        reasons: generateReasons(score, matchPercent, matchedSkills)
      };
    });
    
    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);
    
    return new Response(JSON.stringify({
      recommendations: recommendations.slice(0, 10),
      userSkills: userSkills
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate recommendations' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}