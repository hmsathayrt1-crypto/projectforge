// ProjectForge - Success Estimator API

const PROJECTS_DATA = [
  { id: 1, title: 'E-Commerce Platform', required_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Docker'], team_size_min: 3, team_size_max: 5, estimated_duration_weeks: 16 },
  { id: 2, title: 'AI Chatbot Assistant', required_skills: ['Python', 'Machine Learning', 'NLP', 'Flask', 'Deep Learning'], team_size_min: 2, team_size_max: 4, estimated_duration_weeks: 14 },
  { id: 3, title: 'Mobile Fitness App', required_skills: ['Flutter', 'Dart', 'Firebase', 'Mobile Design'], team_size_min: 2, team_size_max: 4, estimated_duration_weeks: 12 },
  { id: 4, title: 'Smart Home IoT System', required_skills: ['Arduino', 'Raspberry Pi', 'Python', 'MQTT', 'React'], team_size_min: 3, team_size_max: 5, estimated_duration_weeks: 18 },
  { id: 5, title: 'Online Learning Platform', required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Video Streaming'], team_size_min: 3, team_size_max: 5, estimated_duration_weeks: 16 },
  { id: 6, title: 'Image Recognition App', required_skills: ['Python', 'Computer Vision', 'Deep Learning', 'TensorFlow'], team_size_min: 2, team_size_max: 4, estimated_duration_weeks: 14 },
  { id: 7, title: 'Cybersecurity Dashboard', required_skills: ['Python', 'Web Security', 'SQL', 'React', 'Docker'], team_size_min: 3, team_size_max: 5, estimated_duration_weeks: 16 },
  { id: 8, title: 'Social Media Analytics', required_skills: ['Python', 'Machine Learning', 'NLP', 'React', 'API Integration'], team_size_min: 2, team_size_max: 4, estimated_duration_weeks: 12 },
  { id: 9, title: 'Inventory Management System', required_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Docker'], team_size_min: 2, team_size_max: 3, estimated_duration_weeks: 10 },
  { id: 10, title: 'Blockchain Voting System', required_skills: ['JavaScript', 'Web Security', 'Cryptography', 'Solidity'], team_size_min: 3, team_size_max: 5, estimated_duration_weeks: 18 }
];

// POST /api/success/estimate
export async function onRequestPost(context: any) {
  const authHeader = context.request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await context.request.json();
    const { projectId, teamSize, weeklyHours } = body;
    
    const project = PROJECTS_DATA.find(p => p.id === projectId);
    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user skills from KV
    const token = authHeader.substring(7);
    const kv = context.env.KV;
    let userSkills = [];
    
    try {
      const userData = await kv.get(`token:${token}`);
      if (userData) {
        const user = JSON.parse(userData);
        const skillsData = await kv.get(`user_skills:${user.id}`);
        if (skillsData) {
          userSkills = JSON.parse(skillsData);
        }
      }
    } catch (e) {
      // Continue without user skills
    }

    // Calculate scores
    const requiredSkills = project.required_skills;
    const userSkillNames = userSkills.map((s: any) => {
      const skillNames = ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Swift', 'Kotlin', 'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'HTML/CSS', 'Flutter', 'React Native', 'Android Native', 'iOS Native', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Cloudflare', 'Web Security', 'Cryptography', 'Penetration Testing', 'Arduino', 'Raspberry Pi', 'Embedded Systems', 'Project Management', 'Technical Writing', 'Presentation', 'Team Leadership'];
      return skillNames[s.skill_id - 1];
    });

    // Skill match factor (0-40 points)
    const matchedSkills = requiredSkills.filter((skill: string) => userSkillNames.includes(skill));
    const skillMatchScore = (matchedSkills.length / Math.max(requiredSkills.length, 1)) * 40;

    // Skill level factor (0-30 points)
    const avgLevel = userSkills.length > 0 
      ? userSkills.reduce((sum: number, s: any) => sum + (s.level || 1), 0) / userSkills.length 
      : 1;
    const levelScore = (avgLevel / 5) * 30;

    // Team factor (0-15 points)
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
    let confidence = 'متوسط';
    let recommendations = [];
    
    if (totalScore >= 70) {
      confidence = 'عالي';
      recommendations = [
        'لديك أساس قوي لهذا المشروع!',
        'فكر في إضافة ميزات إبداعية للتميز',
        'حافظ على التواصل المنتظم مع الفريق'
      ];
    } else if (totalScore >= 50) {
      confidence = 'متوسط';
      recommendations = [
        'ركز على سد فجوات المهارات قبل البدء',
        'ابحث عن أعضاء فريق بمهارات مكملة',
        'خصص وقتاً كافياً للتعلم والتطوير'
      ];
    } else {
      confidence = 'منخفض';
      recommendations = [
        'تحتاج تطوير مهارات كبير قبل البدء',
        'فكر في مشروع أبسط أو استعد extensively',
        'ابحث عن مرشدين ذوي خبرة',
        'ضع خطة واقعية للتعلم'
      ];
    }

    return new Response(JSON.stringify({
      successProbability: totalScore,
      confidence,
      breakdown: {
        skillMatch: Math.round(skillMatchScore),
        skillLevel: Math.round(levelScore),
        teamFit: teamScore,
        timeCommitment: Math.round(timeScore)
      },
      recommendations
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Success estimate error:', error);
    return new Response(JSON.stringify({ error: 'Failed to estimate success' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}