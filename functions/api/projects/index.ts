// ProjectForge - Projects API
import { corsResponse, withCors } from '../_cors';

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

// GET /api/projects
export async function onRequestGet(context: any) {
  const { searchParams } = new URL(context.request.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  let projects = PROJECTS_DATA;
  
  if (category) {
    projects = projects.filter(p => p.category === category);
  }
  
  if (difficulty) {
    projects = projects.filter(p => p.difficulty === difficulty);
  }
  
  // Paginate
  const paginated = projects.slice(offset, offset + limit);
  
  return new Response(JSON.stringify({ projects: paginated }), {
    headers: withCors({ 'Content-Type': 'application/json' })
  });
}

// OPTIONS for CORS
export async function onRequestOptions() {
  return corsResponse();
}