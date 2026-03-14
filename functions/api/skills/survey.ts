// ProjectForge - Skills Survey API

const SKILLS_DATA = [
  { id: 1, name: 'Python', category: 'programming', description: 'Python programming language', weight: 1.5 },
  { id: 2, name: 'JavaScript', category: 'programming', description: 'JavaScript/TypeScript', weight: 1.3 },
  { id: 3, name: 'Java', category: 'programming', description: 'Java programming', weight: 1.2 },
  { id: 4, name: 'C++', category: 'programming', description: 'C++ programming', weight: 1.4 },
  { id: 5, name: 'C#', category: 'programming', description: 'C# and .NET framework', weight: 1.2 },
  { id: 6, name: 'PHP', category: 'programming', description: 'PHP for web development', weight: 1.0 },
  { id: 7, name: 'Swift', category: 'programming', description: 'Swift for iOS development', weight: 1.3 },
  { id: 8, name: 'Kotlin', category: 'programming', description: 'Kotlin for Android', weight: 1.3 },
  { id: 9, name: 'React', category: 'web', description: 'React.js frontend framework', weight: 1.4 },
  { id: 10, name: 'Vue', category: 'web', description: 'Vue.js frontend framework', weight: 1.2 },
  { id: 11, name: 'Angular', category: 'web', description: 'Angular framework', weight: 1.1 },
  { id: 12, name: 'Node.js', category: 'web', description: 'Node.js backend', weight: 1.4 },
  { id: 13, name: 'Django', category: 'web', description: 'Django Python framework', weight: 1.3 },
  { id: 14, name: 'Flask', category: 'web', description: 'Flask Python framework', weight: 1.2 },
  { id: 15, name: 'HTML/CSS', category: 'web', description: 'HTML and CSS styling', weight: 1.0 },
  { id: 16, name: 'Flutter', category: 'mobile', description: 'Flutter cross-platform', weight: 1.4 },
  { id: 17, name: 'React Native', category: 'mobile', description: 'React Native mobile', weight: 1.3 },
  { id: 18, name: 'Android Native', category: 'mobile', description: 'Native Android development', weight: 1.3 },
  { id: 19, name: 'iOS Native', category: 'mobile', description: 'Native iOS development', weight: 1.3 },
  { id: 20, name: 'Machine Learning', category: 'ai', description: 'ML algorithms and models', weight: 1.5 },
  { id: 21, name: 'Deep Learning', category: 'ai', description: 'Neural networks and DL', weight: 1.6 },
  { id: 22, name: 'NLP', category: 'ai', description: 'Natural Language Processing', weight: 1.5 },
  { id: 23, name: 'Computer Vision', category: 'ai', description: 'Image and video processing', weight: 1.5 },
  { id: 24, name: 'TensorFlow', category: 'ai', description: 'TensorFlow framework', weight: 1.4 },
  { id: 25, name: 'PyTorch', category: 'ai', description: 'PyTorch framework', weight: 1.4 },
  { id: 26, name: 'SQL', category: 'database', description: 'SQL databases', weight: 1.0 },
  { id: 27, name: 'MongoDB', category: 'database', description: 'MongoDB NoSQL', weight: 1.1 },
  { id: 28, name: 'PostgreSQL', category: 'database', description: 'PostgreSQL', weight: 1.2 },
  { id: 29, name: 'Redis', category: 'database', description: 'Redis caching', weight: 1.1 },
  { id: 30, name: 'Docker', category: 'devops', description: 'Docker containerization', weight: 1.3 },
  { id: 31, name: 'Kubernetes', category: 'devops', description: 'Kubernetes orchestration', weight: 1.4 },
  { id: 32, name: 'CI/CD', category: 'devops', description: 'Continuous integration', weight: 1.2 },
  { id: 33, name: 'AWS', category: 'devops', description: 'Amazon Web Services', weight: 1.3 },
  { id: 34, name: 'Cloudflare', category: 'devops', description: 'Cloudflare services', weight: 1.2 },
  { id: 35, name: 'Web Security', category: 'security', description: 'Web application security', weight: 1.4 },
  { id: 36, name: 'Cryptography', category: 'security', description: 'Encryption and security', weight: 1.3 },
  { id: 37, name: 'Penetration Testing', category: 'security', description: 'Security testing', weight: 1.5 },
  { id: 38, name: 'Arduino', category: 'iot', description: 'Arduino microcontrollers', weight: 1.2 },
  { id: 39, name: 'Raspberry Pi', category: 'iot', description: 'Raspberry Pi projects', weight: 1.3 },
  { id: 40, name: 'Embedded Systems', category: 'iot', description: 'Embedded programming', weight: 1.4 },
  { id: 41, name: 'Project Management', category: 'soft', description: 'Managing projects', weight: 1.0 },
  { id: 42, name: 'Technical Writing', category: 'soft', description: 'Documentation writing', weight: 0.8 },
  { id: 43, name: 'Presentation', category: 'soft', description: 'Presentation skills', weight: 0.7 },
  { id: 44, name: 'Team Leadership', category: 'soft', description: 'Leading teams', weight: 0.9 }
];

const PROJECTS_DATA = [
  { id: 1, title: 'E-Commerce Platform', required_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Docker'], category: 'web', difficulty: 'intermediate' },
  { id: 2, title: 'AI Chatbot Assistant', required_skills: ['Python', 'Machine Learning', 'NLP', 'Flask', 'Deep Learning'], category: 'ai', difficulty: 'advanced' },
  { id: 3, title: 'Mobile Fitness App', required_skills: ['Flutter', 'Dart', 'Firebase', 'Mobile Design'], category: 'mobile', difficulty: 'intermediate' },
  { id: 4, title: 'Smart Home IoT System', required_skills: ['Arduino', 'Raspberry Pi', 'Python', 'MQTT', 'React'], category: 'iot', difficulty: 'advanced' },
  { id: 5, title: 'Online Learning Platform', required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Video Streaming'], category: 'web', difficulty: 'intermediate' },
  { id: 6, title: 'Image Recognition App', required_skills: ['Python', 'Computer Vision', 'Deep Learning', 'TensorFlow'], category: 'ai', difficulty: 'advanced' },
  { id: 7, title: 'Cybersecurity Dashboard', required_skills: ['Python', 'Web Security', 'SQL', 'React', 'Docker'], category: 'security', difficulty: 'advanced' },
  { id: 8, title: 'Social Media Analytics', required_skills: ['Python', 'Machine Learning', 'NLP', 'React', 'API Integration'], category: 'ai', difficulty: 'intermediate' },
  { id: 9, title: 'Inventory Management System', required_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Docker'], category: 'web', difficulty: 'beginner' },
  { id: 10, title: 'Blockchain Voting System', required_skills: ['JavaScript', 'Web Security', 'Cryptography', 'Solidity'], category: 'security', difficulty: 'advanced' }
];

// POST /api/skills/survey
export async function onRequestPost(context: any) {
  const authHeader = context.request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const user = JSON.parse(userData);
    const body = await context.request.json();
    const { skills } = body;
    
    // Store user skills
    await kv.put(`user_skills:${user.id}`, JSON.stringify(skills));
    
    return new Response(JSON.stringify({ success: true, message: 'Skills saved successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Survey error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save survey' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET /api/skills
export async function onRequestGet(context: any) {
  const { searchParams } = new URL(context.request.url);
  const category = searchParams.get('category');
  
  let skills = SKILLS_DATA;
  if (category) {
    skills = skills.filter(s => s.category === category);
  }
  
  return new Response(JSON.stringify({ skills }), {
    headers: { 'Content-Type': 'application/json' }
  });
}