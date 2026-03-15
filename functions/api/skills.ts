// ProjectForge - Skills API
import { corsResponse, withCors } from './_cors';

// Skills data (embedded for demo)
const SKILLS_DATA = [
  // Programming Languages
  { id: 1, name: 'Python', category: 'programming', description: 'Python programming language', weight: 1.5 },
  { id: 2, name: 'JavaScript', category: 'programming', description: 'JavaScript/TypeScript', weight: 1.3 },
  { id: 3, name: 'Java', category: 'programming', description: 'Java programming', weight: 1.2 },
  { id: 4, name: 'C++', category: 'programming', description: 'C++ programming', weight: 1.4 },
  { id: 5, name: 'C#', category: 'programming', description: 'C# and .NET framework', weight: 1.2 },
  { id: 6, name: 'PHP', category: 'programming', description: 'PHP for web development', weight: 1.0 },
  { id: 7, name: 'Swift', category: 'programming', description: 'Swift for iOS development', weight: 1.3 },
  { id: 8, name: 'Kotlin', category: 'programming', description: 'Kotlin for Android', weight: 1.3 },
  // Web Development
  { id: 9, name: 'React', category: 'web', description: 'React.js frontend framework', weight: 1.4 },
  { id: 10, name: 'Vue', category: 'web', description: 'Vue.js frontend framework', weight: 1.2 },
  { id: 11, name: 'Angular', category: 'web', description: 'Angular framework', weight: 1.1 },
  { id: 12, name: 'Node.js', category: 'web', description: 'Node.js backend', weight: 1.4 },
  { id: 13, name: 'Django', category: 'web', description: 'Django Python framework', weight: 1.3 },
  { id: 14, name: 'Flask', category: 'web', description: 'Flask Python framework', weight: 1.2 },
  { id: 15, name: 'HTML/CSS', category: 'web', description: 'HTML and CSS styling', weight: 1.0 },
  // Mobile Development
  { id: 16, name: 'Flutter', category: 'mobile', description: 'Flutter cross-platform', weight: 1.4 },
  { id: 17, name: 'React Native', category: 'mobile', description: 'React Native mobile', weight: 1.3 },
  { id: 18, name: 'Android Native', category: 'mobile', description: 'Native Android development', weight: 1.3 },
  { id: 19, name: 'iOS Native', category: 'mobile', description: 'Native iOSdevelopment', weight: 1.3 },
  // AI/ML
  { id: 20, name: 'Machine Learning', category: 'ai', description: 'ML algorithms and models', weight: 1.5 },
  { id: 21, name: 'Deep Learning', category: 'ai', description: 'Neural networks and DL', weight: 1.6 },
  { id: 22, name: 'NLP', category: 'ai', description: 'Natural LanguageProcessing', weight: 1.5 },
  { id: 23, name: 'Computer Vision', category: 'ai', description: 'Image and video processing', weight: 1.5 },
  { id: 24, name: 'TensorFlow', category: 'ai', description: 'TensorFlow framework', weight: 1.4 },
  { id: 25, name: 'PyTorch', category: 'ai', description: 'PyTorch framework', weight: 1.4 },
  // Databases
  { id: 26, name: 'SQL', category: 'database', description: 'SQL databases', weight: 1.0 },
  { id: 27, name: 'MongoDB', category: 'database', description: 'MongoDB NoSQL', weight: 1.1 },
  { id: 28, name: 'PostgreSQL', category: 'database', description: 'PostgreSQL', weight: 1.2 },
  { id: 29, name: 'Redis', category: 'database', description: 'Redis caching', weight: 1.1 },
  // DevOps
  { id: 30, name: 'Docker', category: 'devops', description: 'Docker containerization', weight: 1.3 },
  { id: 31, name: 'Kubernetes', category: 'devops', description: 'Kubernetes orchestration', weight: 1.4 },
  { id: 32, name: 'CI/CD', category: 'devops', description: 'Continuous integration', weight: 1.2 },
  { id: 33, name: 'AWS', category: 'devops', description: 'Amazon Web Services', weight: 1.3 },
  { id: 34, name: 'Cloudflare', category: 'devops', description: 'Cloudflare services', weight: 1.2 },
  // Security
  { id: 35, name: 'Web Security', category: 'security', description: 'Web application security', weight: 1.4 },
  { id: 36, name: 'Cryptography', category: 'security', description: 'Encryption and security', weight: 1.3 },
  { id: 37, name: 'Penetration Testing', category: 'security', description: 'Security testing', weight: 1.5 },
  // IoT
  { id: 38, name: 'Arduino', category: 'iot', description: 'Arduino microcontrollers', weight: 1.2 },
  { id: 39, name: 'Raspberry Pi', category: 'iot', description: 'Raspberry Pi projects', weight: 1.3 },
  { id: 40, name: 'Embedded Systems', category: 'iot', description: 'Embedded programming', weight: 1.4 },
  // Soft Skills
  { id: 41, name: 'Project Management', category: 'soft', description: 'Managing projects', weight: 1.0 },
  { id: 42, name: 'Technical Writing', category: 'soft', description: 'Documentation writing', weight: 0.8 },
  { id: 43, name: 'Presentation', category: 'soft', description: 'Presentation skills', weight: 0.7 },
  { id: 44, name: 'Team Leadership', category: 'soft', description: 'Leading teams', weight: 0.9 }
];

// Projects data
const PROJECTS_DATA = [
  {
    id: 1,
    title: 'E-Commerce Platform',
    title_ar: 'منصة تجارة إلكترونية',
    description: 'Build a full-featured e-commerce website with product management, cart, payments, and admin panel.',
    description_ar: 'بناء موقع تجارة إلكترونية متكامل مع إدارة المنتجات والسلة والدفع ولوحة الإدارة.',
    category: 'web',
    difficulty: 'intermediate',
    required_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Docker'],
    estimated_duration_weeks: 16,
    team_size_min: 3,
    team_size_max: 5,
    tags: ['web', 'full-stack', 'business']
  },
  {
    id: 2,
    title: 'AI Chatbot Assistant',
    title_ar: 'مساعد ذكي بالذكاء الاصطناعي',
    description: 'Create an intelligent chatbot using NLP and machine learning for customer support or educational purposes.',
    description_ar: 'إنشاء روبوت محادثة ذكي باستخدام معالجة اللغة الطبيعية وتعلم الآلة للدعم الفني أو التعليم.',
    category: 'ai',
    difficulty: 'advanced',
    required_skills: ['Python', 'Machine Learning', 'NLP', 'Flask', 'Deep Learning'],
    estimated_duration_weeks: 14,
    team_size_min: 2,
    team_size_max: 4,
    tags: ['ai', 'nlp', 'chatbot']
  },
  {
    id: 3,
    title: 'Mobile Fitness App',
    title_ar: 'تطبيق لياقة بدنية للهاتف',
    description: 'Develop a mobile fitness tracking app with workout plans, progress tracking, and social features.',
    description_ar: 'تطوير تطبيق لتتبع اللياقة البدنية مع خطط التمارين وتتبع التقدم والميزات الاجتماعية.',
    category: 'mobile',
    difficulty: 'intermediate',
    required_skills: ['Flutter', 'Dart', 'Firebase', 'Mobile Design'],
    estimated_duration_weeks: 12,
    team_size_min: 2,
    team_size_max: 4,
    tags: ['mobile', 'fitness', 'social']
  },
  {
    id: 4,
    title: 'Smart Home IoT System',
    title_ar: 'نظام منزل ذكي',
    description: 'Build an IoT system to control home appliances using sensors, actuators, and mobile/web dashboard.',
    description_ar: 'بناء نظام إنترنت الأشياء للتحكم بالأجهزة المنزلية باستخدام المستشعرات والمشغلات ولوحة تحكم.',
    category: 'iot',
    difficulty: 'advanced',
    required_skills: ['Arduino', 'Raspberry Pi', 'Python', 'MQTT', 'React'],
    estimated_duration_weeks: 18,
    team_size_min: 3,
    team_size_max: 5,
    tags: ['iot', 'smart-home', 'automation']
  },
  {
    id: 5,
    title: 'Online Learning Platform',
    title_ar: 'منصة تعلم إلكترونية',
    description: 'Create an e-learning platform with courses, quizzes, progress tracking, and certificate generation.',
    description_ar: 'إنشاء منصة تعليم إلكتروني مع الدورات والاختبارات وتتبع التقدم وإنشاء الشهادات.',
    category: 'web',
    difficulty: 'intermediate',
    required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Video Streaming'],
    estimated_duration_weeks: 16,
    team_size_min: 3,
    team_size_max: 5,
    tags: ['education', 'web', 'full-stack']
  },
  {
    id: 6,
    title: 'Image Recognition App',
    title_ar: 'تطبيق التعرف على الصور',
    description: 'Develop a computer vision application for object detection, image classification, or facial recognition.',
    description_ar: 'تطوير تطبيق رؤية حاسوبية للكشف عن الكائنات أو تصنيف الصور أو التعرف على الوجوه.',
    category: 'ai',
    difficulty: 'advanced',
    required_skills: ['Python', 'Computer Vision', 'Deep Learning', 'TensorFlow'],
    estimated_duration_weeks: 14,
    team_size_min: 2,
    team_size_max: 4,
    tags: ['ai', 'computer-vision', 'mobile']
  },
  {
    id: 7,
    title: 'Cybersecurity Dashboard',
    title_ar: 'لوحة أمن المعلومات',
    description: 'Build a security monitoring dashboard with vulnerability scanning, threat detection, and reporting.',
    description_ar: 'بناء لوحة مراقبة أمنية مع فحص الثغرات والكشف عن التهديدات وإعداد التقارير.',
    category: 'security',
    difficulty: 'advanced',
    required_skills: ['Python', 'Web Security', 'SQL', 'React', 'Docker'],
    estimated_duration_weeks: 16,
    team_size_min: 3,
    team_size_max: 5,
    tags: ['security', 'monitoring', 'dashboard']
  },
  {
    id: 8,
    title: 'Social Media Analytics',
    title_ar: 'تحليلات وسائل التواصل',
    description: 'Create a platform to analyze social media trends, sentiment analysis, and influencer metrics.',
    description_ar: 'إنشاء منصة لتحليل اتجاهات وسائل التواصل وتحليل المشاعر ومقاييس المؤثرين.',
    category: 'ai',
    difficulty: 'intermediate',
    required_skills: ['Python', 'Machine Learning', 'NLP', 'React', 'API Integration'],
    estimated_duration_weeks: 12,
    team_size_min: 2,
    team_size_max: 4,
    tags: ['ai', 'analytics', 'social']
  },
  {
    id: 9,
    title: 'Inventory Management System',
    title_ar: 'نظام إدارة المخزون',
    description: 'Build a comprehensive inventory system with barcode scanning, alerts, and reporting.',
    description_ar: 'بناء نظام مخزون شامل مع مسح الباركود والتنبيهات وإعداد التقارير.',
    category: 'web',
    difficulty: 'beginner',
    required_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Docker'],
    estimated_duration_weeks: 10,
    team_size_min: 2,
    team_size_max: 3,
    tags: ['business', 'management', 'web']
  },
  {
    id: 10,
    title: 'Blockchain Voting System',
    title_ar: 'نظام تصويت بلوك تشين',
    description: 'Create a secure voting system using blockchain technology for transparency and security.',
    description_ar: 'إنشاء نظام تصويت آمن باستخدام تقنية البلوك تشين للشفافية والأمان.',
    category: 'security',
    difficulty: 'advanced',
    required_skills: ['JavaScript', 'Web Security', 'Cryptography', 'Solidity'],
    estimated_duration_weeks: 18,
    team_size_min: 3,
    team_size_max: 5,
    tags: ['blockchain', 'security', 'voting']
  }
];

// GET /api/skills
export async function onRequestGet(context: any) {
  const { searchParams } = new URL(context.request.url);
  const category = searchParams.get('category');
  
  let skills = SKILLS_DATA;
  if (category) {
    skills = skills.filter(s => s.category === category);
  }
  
  return new Response(JSON.stringify({ skills }), {
    headers: withCors({ 'Content-Type': 'application/json' })
  });
}

// OPTIONS for CORS
export async function onRequestOptions() {
  return corsResponse();
}