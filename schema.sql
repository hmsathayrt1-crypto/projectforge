-- ProjectForge Database Schema
-- Cloudflare D1 (SQLite)

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    university TEXT,
    major TEXT,
    year INTEGER DEFAULT 4,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    token TEXT,
    token_expires DATETIME
);

-- Skills Table (Master list of skills)
CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    weight REAL DEFAULT 1.0
);

-- User Skills (Skills profiles)
CREATE TABLE IF NOT EXISTS user_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    skill_id INTEGER NOT NULL,
    level INTEGER DEFAULT 1 CHECK(level >= 1 AND level <= 5),
    interest INTEGER DEFAULT 3 CHECK(interest >= 1 AND interest <= 5),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id),
    UNIQUE(user_id, skill_id)
);

-- Projects Table (Available project ideas)
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT NOT NULL,
    description_ar TEXT,
    category TEXT NOT NULL,
    difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
    required_skills TEXT NOT NULL, -- JSON array of skill IDs
    estimated_duration_weeks INTEGER DEFAULT 12,
    team_size_min INTEGER DEFAULT 2,
    team_size_max INTEGER DEFAULT 5,
    tags TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Projects (Saved/planned projects)
CREATE TABLE IF NOT EXISTS user_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_id INTEGER NOT NULL,
    status TEXT DEFAULT 'interested' CHECK(status IN ('interested', 'planning', 'in_progress', 'completed')),
    custom_plan TEXT, -- JSON for milestones
    success_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    project_id INTEGER NOT NULL,
    leader_id TEXT NOT NULL,
    status TEXT DEFAULT 'forming' CHECK(status IN ('forming', 'active', 'completed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (leader_id) REFERENCES users(id)
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(team_id, user_id)
);

-- Project Plans (Sandbox outputs)
CREATE TABLE IF NOT EXISTS project_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_id INTEGER NOT NULL,
    plan_data TEXT NOT NULL, -- JSON: milestones, risks, resources
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Recommendations Log
CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_id INTEGER NOT NULL,
    score REAL NOT NULL,
    reasons TEXT, -- JSON array of reasons
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- Default Skills Data
INSERT OR IGNORE INTO skills (name, category, description, weight) VALUES
-- Programming Languages
('Python', 'programming', 'Python programming language', 1.5),
('JavaScript', 'programming', 'JavaScript/TypeScript', 1.3),
('Java', 'programming', 'Java programming', 1.2),
('C++', 'programming', 'C++ programming', 1.4),
('C#', 'programming', 'C# and .NET framework', 1.2),
('PHP', 'programming', 'PHP for web development', 1.0),
('Swift', 'programming', 'Swift for iOS development', 1.3),
('Kotlin', 'programming', 'Kotlin for Android', 1.3),
-- Web Development
('React', 'web', 'React.js frontend framework', 1.4),
('Vue', 'web', 'Vue.js frontend framework', 1.2),
('Angular', 'web', 'Angular framework', 1.1),
('Node.js', 'web', 'Node.js backend', 1.4),
('Django', 'web', 'Django Python framework', 1.3),
('Flask', 'web', 'Flask Python framework', 1.2),
('HTML/CSS', 'web', 'HTML and CSS styling', 1.0),
-- Mobile Development
('Flutter', 'mobile', 'Flutter cross-platform', 1.4),
('React Native', 'mobile', 'React Native mobile', 1.3),
('Android Native', 'mobile', 'Native Android development', 1.3),
('iOS Native', 'mobile', 'Native iOS development', 1.3),
-- AI/ML
('Machine Learning', 'ai', 'ML algorithms and models', 1.5),
('Deep Learning', 'ai', 'Neural networks and DL', 1.6),
('NLP', 'ai', 'Natural Language Processing', 1.5),
('Computer Vision', 'ai', 'Image and video processing', 1.5),
('TensorFlow', 'ai', 'TensorFlow framework', 1.4),
('PyTorch', 'ai', 'PyTorch framework', 1.4),
-- Databases
('SQL', 'database', 'SQL databases', 1.0),
('MongoDB', 'database', 'MongoDB NoSQL', 1.1),
('PostgreSQL', 'database', 'PostgreSQL', 1.2),
('Redis', 'database', 'Redis caching', 1.1),
-- DevOps
('Docker', 'devops', 'Docker containerization', 1.3),
('Kubernetes', 'devops', 'Kubernetes orchestration', 1.4),
('CI/CD', 'devops', 'Continuous integration', 1.2),
('AWS', 'devops', 'Amazon Web Services', 1.3),
('Cloudflare', 'devops', 'Cloudflare services', 1.2),
-- Security
('Web Security', 'security', 'Web application security', 1.4),
('Cryptography', 'security', 'Encryption and security', 1.3),
('Penetration Testing', 'security', 'Security testing', 1.5),
-- IoT & Embedded
('Arduino', 'iot', 'Arduino microcontrollers', 1.2),
('Raspberry Pi', 'iot', 'Raspberry Pi projects', 1.3),
('Embedded Systems', 'iot', 'Embedded programming', 1.4),
-- Soft Skills
('Project Management', 'soft', 'Managing projects', 1.0),
('Technical Writing', 'soft', 'Documentation writing', 0.8),
('Presentation', 'soft', 'Presentation skills', 0.7),
('Team Leadership', 'soft', 'Leading teams', 0.9);

-- Default Projects Data
INSERT OR IGNORE INTO projects (title, title_ar, description, description_ar, category, difficulty, required_skills, estimated_duration_weeks, team_size_min, team_size_max, tags) VALUES
('E-Commerce Platform', 'منصة تجارة إلكترونية', 'Build a full-featured e-commerce website with product management, cart, payments, and admin panel.', 'بناء موقع تجارة إلكترونية متكامل مع إدارة المنتجات والسلة والدفع ولوحة الإدارة.', 'web', 'intermediate', '["JavaScript", "React", "Node.js", "SQL", "Docker"]', 16, 3, 5, '["web", "full-stack", "business"]'),
('AI Chatbot Assistant', 'مساعد ذكي بالذكاء الاصطناعي', 'Create an intelligent chatbot using NLP and machine learning for customer support or educational purposes.', 'إنشاء روبوت محادثة ذكي باستخدام معالجة اللغة الطبيعية وتعلم الآلة للدعم الفني أو التعليم.', 'ai', 'advanced', '["Python", "Machine Learning", "NLP", "Flask", "Deep Learning"]', 14, 2, 4, '["ai", "nlp", "chatbot"]'),
('Mobile Fitness App', 'تطبيق لياقة بدنية للهاتف', 'Develop a mobile fitness tracking app with workout plans, progress tracking, and social features.', 'تطوير تطبيق لتتبع اللياقة البدنية مع خطط التمارين وتتبع التقدم والميزات الاجتماعية.', 'mobile', 'intermediate', '["Flutter", "Dart", "Firebase", "Mobile Design"]', 12, 2, 4, '["mobile", "fitness", "social"]'),
('Smart Home IoT System', 'نظام منزل ذكي', 'Build an IoT system to control home appliances using sensors, actuators, and mobile/web dashboard.', 'بناء نظام إنترنت الأشياء للتحكم بالأجهزة المنزلية باستخدام المستشعرات والمشغلات ولوحة تحكم.', 'iot', 'advanced', '["Arduino", "Raspberry Pi", "Python", "MQTT", "React"]', 18, 3, 5, '["iot", "smart-home", "automation"]'),
('Online Learning Platform', 'منصة تعلم إلكترونية', 'Create an e-learning platform with courses, quizzes, progress tracking, and certificate generation.', 'إنشاء منصة تعليم إلكتروني مع الدورات والاختبارات وتتبع التقدم وإنشاء الشهادات.', 'web', 'intermediate', '["JavaScript", "React", "Node.js", "MongoDB", "Video Streaming"]', 16, 3, 5, '["education", "web", "full-stack"]'),
('Image Recognition App', 'تطبيق التعرف على الصور', 'Develop a computer vision application for object detection, image classification, or facial recognition.', 'تطوير تطبيق رؤية حاسوبية للكشف عن الكائنات أو تصنيف الصور أو التعرف على الوجوه.', 'ai', 'advanced', '["Python", "Computer Vision", "Deep Learning", "TensorFlow"]', 14, 2, 4, '["ai", "computer-vision", "mobile"]'),
('Cybersecurity Dashboard', 'لوحة أمن المعلومات', 'Build a security monitoring dashboard with vulnerability scanning, threat detection, and reporting.', 'بناء لوحة مراقبة أمنية مع فحص الثغرات والكشف عن التهديدات وإعداد التقارير.', 'security', 'advanced', '["Python", "Web Security", "SQL", "React", "Docker"]', 16, 3, 5, '["security", "monitoring", "dashboard"]'),
('Social Media Analytics', 'تحليلات وسائل التواصل', 'Create a platform to analyze social media trends, sentiment analysis, and influencer metrics.', 'إنشاء منصة لتحليل اتجاهات وسائل التواصل وتحليل المشاعر ومقاييس المؤثرين.', 'ai', 'intermediate', '["Python", "Machine Learning", "NLP", "React", "API Integration"]', 12, 2, 4, '["ai", "analytics", "social"]'),
('Inventory Management System', 'نظام إدارة المخزون', 'Build a comprehensive inventory system with barcode scanning, alerts, and reporting.', 'بناء نظام مخزون شامل مع مسح الباركود والتنبيهات وإعداد التقارير.', 'web', 'beginner', '["JavaScript", "React", "Node.js", "SQL", "Docker"]', 10, 2, 3, '["business", "management", "web"]'),
('Blockchain Voting System', 'نظام تصويت بلوك تشين', 'Create a secure voting system using blockchain technology for transparency and security.', 'إنشاء نظام تصويت آمن باستخدام تقنية البلوك تشين للشفافية والأمان.', 'security', 'advanced', '["JavaScript", "Web Security", "Cryptography", "Solidity"]', 18, 3, 5, '["blockchain", "security", "voting"]');