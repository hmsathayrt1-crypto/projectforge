// ProjectForge - Sandbox Plan Generator

const PROJECTS_DATA = [
  { id: 1, title: 'E-Commerce Platform', title_ar: 'منصة تجارة إلكترونية', category: 'web', difficulty: 'intermediate', required_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Docker'], estimated_duration_weeks: 16, team_size_min: 3, team_size_max: 5 },
  { id: 2, title: 'AI Chatbot Assistant', title_ar: 'مساعد ذكي بالذكاء الاصطناعي', category: 'ai', difficulty: 'advanced', required_skills: ['Python', 'Machine Learning', 'NLP', 'Flask', 'Deep Learning'], estimated_duration_weeks: 14, team_size_min: 2, team_size_max: 4 },
  { id: 3, title: 'Mobile Fitness App', title_ar: 'تطبيق لياقة بدنية للهاتف', category: 'mobile', difficulty: 'intermediate', required_skills: ['Flutter', 'Dart', 'Firebase', 'Mobile Design'], estimated_duration_weeks: 12, team_size_min: 2, team_size_max: 4 },
  { id: 4, title: 'Smart Home IoT System', title_ar: 'نظام منزل ذكي', category: 'iot', difficulty: 'advanced', required_skills: ['Arduino', 'Raspberry Pi', 'Python', 'MQTT', 'React'], estimated_duration_weeks: 18, team_size_min: 3, team_size_max: 5 },
  { id: 5, title: 'Online Learning Platform', title_ar: 'منصة تعلم إلكترونية', category: 'web', difficulty: 'intermediate', required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Video Streaming'], estimated_duration_weeks: 16, team_size_min: 3, team_size_max: 5 },
  { id: 6, title: 'Image Recognition App', title_ar: 'تطبيق التعرف على الصور', category: 'ai', difficulty: 'advanced', required_skills: ['Python', 'Computer Vision', 'Deep Learning', 'TensorFlow'], estimated_duration_weeks: 14, team_size_min: 2, team_size_max: 4 },
  { id: 7, title: 'Cybersecurity Dashboard', title_ar: 'لوحة أمن المعلومات', category: 'security', difficulty: 'advanced', required_skills: ['Python', 'Web Security', 'SQL', 'React', 'Docker'], estimated_duration_weeks: 16, team_size_min: 3, team_size_max: 5 },
  { id: 8, title: 'Social Media Analytics', title_ar: 'تحليلات وسائل التواصل', category: 'ai', difficulty: 'intermediate', required_skills: ['Python', 'Machine Learning', 'NLP', 'React', 'API Integration'], estimated_duration_weeks: 12, team_size_min: 2, team_size_max: 4 },
  { id: 9, title: 'Inventory Management System', title_ar: 'نظام إدارة المخزون', category: 'web', difficulty: 'beginner', required_skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Docker'], estimated_duration_weeks: 10, team_size_min: 2, team_size_max: 3 },
  { id: 10, title: 'Blockchain Voting System', title_ar: 'نظام تصويت بلوك تشين', category: 'security', difficulty: 'advanced', required_skills: ['JavaScript', 'Web Security', 'Cryptography', 'Solidity'], estimated_duration_weeks: 18, team_size_min: 3, team_size_max: 5 }
];

function generateMilestones(project, duration, skillGap) {
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
    
    const tasks = {
      'Research & Planning': [
        'مراجعة الأعمال السابقة والأبحاث ذات الصلة',
        'تحديد نطاق المشروع والمتطلبات',
        'وضع الجدول الزمني والمراحل',
        'اختيار مكدس التقنيات المناسب',
        ...skillGap.slice(0, 2).map(s => `تعلم أساسيات ${s}`)
      ],
      'Design & Architecture': [
        'تصميم هيكل النظام',
        'تصميم قاعدة البيانات',
        'توثيق API',
        'تصميم واجهات المستخدم',
        'إعداد بيئة التطوير'
      ],
      'Core Development': [
        'إعداد البنية التحتية',
        'بناء طبقة قاعدة البيانات',
        'تطوير واجهات برمجة التطبيقات',
        'بناء واجهة المستخدم',
        'ربط المكونات واختبار التكامل'
      ],
      'Testing & Refinement': [
        'اختبارات الوحدات',
        'اختبارات التكامل',
        'اختبارات المستخدم',
        'تحسين الأداء',
        'إصلاح الأخطاء'
      ],
      'Documentation & Presentation': [
        'كتابة دليل المستخدم',
        'إعداد التوثيق التقني',
        'إعداد العرض التقديمي',
        'تسجيل فيديو تجريبي',
        'النشر النهائي'
      ]
    };

    const deliverables = {
      'Research & Planning': ['وثيقة المتطلبات', 'مقترح المشروع', 'الجدول الزمني'],
      'Design & Architecture': ['مخطط الهيكلة', 'مخطط قاعدة البيانات', 'توثيق API'],
      'Core Development': ['التطبيق الأساسي', 'مصدر الكود', 'تنفيذ API'],
      'Testing & Refinement': ['تقارير الاختبار', 'مقاييس الأداء'],
      'Documentation & Presentation': ['دليل المستخدم', 'التقرير النهائي', 'عرض تقديمي']
    };

    return {
      name: phase.name,
      nameAr: phase.nameAr,
      startWeek,
      endWeek: currentWeek - 1,
      tasks: tasks[phase.name] || [],
      deliverables: deliverables[phase.name] || []
    };
  });
}

function generateRisks(project, skillGap) {
  const risks = [
    { category: 'تقني', description: 'تعقيد التنفيذ قد يتجاوز التقديرات الأولية', probability: 'متوسط', mitigation: 'البدء بالنسخة الأولية، إضافة الميزات تدريجياً' },
    { category: 'الجدول الزمني', description: 'قد يستغرق المشروع وقتاً أطول من المتوقع', probability: 'متوسط', mitigation: 'إضافة وقت احتياطي، تحديد أولويات الميزات' },
    { category: 'الفريق', description: 'تحديات في التنسيق والتوفر', probability: 'منخفض', mitigation: 'اجتماعات دورية، توزيع واضح للمهام' }
  ];

  if (skillGap.length > 0) {
    risks.push({
      category: 'المهارات',
      description: `منحنى التعلم لـ: ${skillGap.join('، ')}`,
      probability: 'عالي',
      mitigation: 'تخصيص وقت للتعلم، استخدام الدروس التعليمية، طلب التوجيه'
    });
  }

  return risks;
}

function getProjectTools(category) {
  const toolsByCategory = {
    'web': ['VS Code', 'Git', 'Chrome DevTools', 'Postman', 'Figma'],
    'mobile': ['Android Studio', 'Xcode', 'VS Code', 'Git', 'Figma'],
    'ai': ['Jupyter Notebook', 'VS Code', 'Google Colab', 'TensorFlow', 'PyTorch'],
    'iot': ['Arduino IDE', 'PlatformIO', 'VS Code', 'Fritzing', 'MQTT Explorer'],
    'security': ['Kali Linux', 'Burp Suite', 'OWASP ZAP', 'Metasploit', 'Nmap'],
    'database': ['DBeaver', 'pgAdmin', 'MongoDB Compass', 'Redis Insight'],
    'devops': ['Docker', 'Kubernetes', 'Terraform', 'AWS Console', 'GitHub Actions']
  };
  
  return toolsByCategory[category] || ['VS Code', 'Git', 'التوثيق'];
}

// POST /api/sandbox/generate
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
    const { projectId } = body;
    
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

    // Calculate skill gap
    const skillGap = project.required_skills.filter(skill => 
      !userSkills.some(us => {
        const skillNames = ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Swift', 'Kotlin', 'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'HTML/CSS', 'Flutter', 'React Native', 'Android Native', 'iOS Native', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Cloudflare', 'Web Security', 'Cryptography', 'Penetration Testing', 'Arduino', 'Raspberry Pi', 'Embedded Systems', 'Project Management', 'Technical Writing', 'Presentation', 'Team Leadership'];
        return skillNames[us.skill_id - 1] === skill;
      })
    );

    const adjustedDuration = Math.round(project.estimated_duration_weeks * (1 + skillGap.length * 0.1));
    let milestones = generateMilestones(project, adjustedDuration, skillGap);
    let risks = generateRisks(project, skillGap);
    let ai_analysis = "";

    // If NanoGPT API key is available, enhance with AI
    if (context.env.NANOGPT_API_KEY) {
      try {
        const prompt = `أنت خبير هندسة برمجيات وتخطيط مشاريع. قم بإنشاء خطة مشروع تخرج بعنوان "${project.title_ar}".
المتطلبات:
1. ارسم مخطط UML أو Architecture Diagram باستخدام Mermaid.js (داخل كود بلوك markdown).
2. قدم نصائح إضافية لتنفيذ المشروع في ${adjustedDuration} أسبوع.
الفجوة المهارية لدى الطالب: ${skillGap.length > 0 ? skillGap.join(', ') : 'لا يوجد'}.
اكتب الرد باللغة العربية.`;

        const aiResponse = await fetch('https://nano-gpt.com/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.env.NANOGPT_API_KEY}`
          },
          body: JSON.stringify({
            model: 'moonshotai/kimi-k2.5',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          ai_analysis = aiData.choices?.[0]?.message?.content || "";
        } else {
          const errText = await aiResponse.text();
          console.warn('AI API Error:', errText);
          ai_analysis = "خطأ في الاتصال بنموذج الذكاء الاصطناعي: " + errText;
        }
      } catch (err: any) {
        console.error('AI call failed:', err);
        ai_analysis = "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: " + err.message;
      }
    } else {
      ai_analysis = "لم يتم تكوين مفتاح الذكاء الاصطناعي في الخادم.";
    }

    const plan = {
      projectId: project.id,
      projectTitle: project.title,
      projectTitleAr: project.title_ar,
      duration: {
        estimated: project.estimated_duration_weeks,
        adjusted: adjustedDuration,
        unit: 'weeks'
      },
      ai_analysis,
      milestones,
      risks,
      teamRecommendation: {
        minSize: project.team_size_min,
        maxSize: project.team_size_max,
        ideal: Math.ceil((project.team_size_min + project.team_size_max) / 2),
        neededSkills: skillGap.slice(0, 3)
      },
      resources: [
        { type: 'skills', items: project.required_skills.map(s => ({ name: s, status: skillGap.includes(s) ? 'needs_learning' : 'available' })) },
        { type: 'tools', items: getProjectTools(project.category) }
      ]
    };

    // Save plan to KV
    try {
      const userData = await kv.get(`token:${token}`);
      if (userData) {
        const user = JSON.parse(userData);
        await kv.put(`plan:${user.id}:${projectId}`, JSON.stringify(plan));
      }
    } catch (e) {
      // Continue even if saving fails
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Sandbox error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate plan' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}