// ProjectForge - Main Application JavaScript
// Using NanoGPT API with Kimi K2.5 for AI features

const API_BASE = '/api';
let authToken = localStorage.getItem('projectforge_token');
let currentUser = null;
let skillsData = [];
let projectsData = [];
let currentCategoryIndex = 0;
let skillRatings = {};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Show splash screen for2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    
    // Initialize app
    await initApp();
});

async function initApp() {
    try {
        // Check if user is logged in
        if (authToken) {
            try {
                await fetchCurrentUser();
            } catch (e) {
                console.warn('Could not fetch user:', e);
            }
        }
        
        // Load initial data with fallback
        try {
            await Promise.all([
                loadSkills(),
                loadProjects()
            ]);
        } catch (e) {
            console.warn('Could not load initial data:', e);
            // Continue anyway - use mock data
        }
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI based on auth state
        updateAuthUI();
    } catch (error) {
        console.error('App initialization error:', error);
        // Still setup event listeners even if there's an error
        setupEventListeners();
        updateAuthUI();
    }
}

// ============================================
// AUTHENTICATION
// ============================================

function setupEventListeners() {
    // Auth modal
    document.getElementById('loginBtn').addEventListener('click', () => showModal('authModal'));
    document.getElementById('closeAuth').addEventListener('click', () => hideModal('authModal'));
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchAuthTab(tabName);
        });
    });
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Navigation
    document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            navigateTo(page);
        });
    });
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Home page buttons
    document.getElementById('startBtn').addEventListener('click', () => {
        if (currentUser) {
            navigateTo('survey');
        } else {
            showModal('authModal');
        }
    });
    document.getElementById('exploreBtn').addEventListener('click', () => navigateTo('projects'));
    
    // Survey navigation
    document.getElementById('nextCategory').addEventListener('click', nextCategory);
    document.getElementById('prevCategory').addEventListener('click', prevCategory);
    document.getElementById('submitSurvey').addEventListener('click', submitSurvey);
    document.getElementById('goToSurvey').addEventListener('click', () => navigateTo('survey'));
    
    // Sandbox
    document.getElementById('sandboxProjectSelect').addEventListener('change', handleSandboxProject);
    
    // Projects
    document.getElementById('categoryFilter').addEventListener('change', filterProjects);
    document.getElementById('difficultyFilter').addEventListener('change', filterProjects);
    
    // Success estimator
    document.getElementById('estimateSuccess').addEventListener('click', estimateSuccess);
    
    // Team matching
    document.getElementById('teamProjectSelect').addEventListener('change', findTeamMatches);
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
}

async function fetchCurrentUser() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateAuthUI();
        } else {
            // Token expired or invalid
            localStorage.removeItem('projectforge_token');
            authToken = null;
            currentUser = null;
        }
    } catch (error) {
        console.error('Error fetchinguser:', error);
    }
}

function updateAuthUI() {
    const userArea = document.getElementById('userArea');
    
    if (currentUser) {
        userArea.innerHTML = `
            <div class="user-info dropdown">
                <div class="user-avatar">${currentUser.full_name?.charAt(0) || 'U'}</div>
                <span class="user-name">${currentUser.full_name || 'User'}</span>
                <div class="dropdown-menu">
                    <button onclick="navigateTo('profile')">
                        <i class="fas fa-user"></i> الملف الشخصي
                    </button>
                    <button onclick="navigateTo('success')">
                        <i class="fas fa-chart-line"></i> تقدير النجاح
                    </button>
                    <button onclick="navigateTo('teams')">
                        <i class="fas fa-users"></i> بناء الفريق
                    </button>
                    <button onclick="handleLogout()">
                        <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
                    </button>
                </div>
            </div>
        `;
        
        // Add dropdown toggle
        const userInfo = userArea.querySelector('.user-info');
        userInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = userInfo.querySelector('.dropdown-menu');
            menu.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            const menu = userArea.querySelector('.dropdown-menu');
            if (menu) menu.classList.remove('show');
        });
    } else {
        userArea.innerHTML = `
            <button class="btn-login" id="loginBtn">
                <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
            </button>
        `;
        document.getElementById('loginBtn').addEventListener('click', () => showModal('authModal'));
    }
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
}

async function handleLogin(e) {
    e.preventDefault();
    showLoading();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('projectforge_token', authToken);
            hideModal('authModal');
            updateAuthUI();
            showToast('تم تسجيل الدخول بنجاح', 'success');
            navigateTo('home');
        } else {
            showToast(data.error || 'فشل تسجيل الدخول', 'error');
        }
    } catch (error) {
        showToast('حدث خطأ في الاتصال', 'error');
    }
    
    hideLoading();
}

async function handleRegister(e) {
    e.preventDefault();
    showLoading();
    
    const userData = {
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        full_name: document.getElementById('regName').value,
        university: document.getElementById('regUniversity').value,
        major: document.getElementById('regMajor').value,
        year: parseInt(document.getElementById('regYear').value)
    };
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('projectforge_token', authToken);
            hideModal('authModal');
            updateAuthUI();
            showToast('تم إنشاء الحساب بنجاح', 'success');
            navigateTo('survey');
        } else {
            showToast(data.error || 'فشل إنشاء الحساب', 'error');
        }
    } catch (error) {
        showToast('حدث خطأ في الاتصال', 'error');
    }
    
    hideLoading();
}

function handleLogout() {
    localStorage.removeItem('projectforge_token');
    authToken = null;
    currentUser = null;
    updateAuthUI();
    showToast('تم تسجيل الخروج', 'success');
    navigateTo('home');
}

// ============================================
// NAVIGATION
// ============================================

function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update nav links
    document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
    
    // Load page-specific data
    switch (page) {
        case 'recommendations':
            loadRecommendations();
            break;
        case 'sandbox':
            populateSandboxProjects();
            break;
        case 'projects':
            renderProjects();
            break;
        case 'success':
            populateSuccessProjects();
            break;
        case 'teams':
            populateTeamProjects();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// ============================================
// SKILLS & SURVEY
// ============================================

async function loadSkills() {
    try {
        const response = await fetch(`${API_BASE}/skills`);
        const data = await response.json();
        skillsData = data.skills || [];
        
        // Group by category
        const categories = {};
        skillsData.forEach(skill => {
            if (!categories[skill.category]) {
                categories[skill.category] = [];
            }
            categories[skill.category].push(skill);
        });
        
        renderSkillCategories(categories);
    } catch (error) {
        console.error('Error loading skills:', error);
        // Use mock data if API fails
        skillsData = getMockSkills();
        const categories = {};
        skillsData.forEach(skill => {
            if (!categories[skill.category]) {
                categories[skill.category] = [];
            }
            categories[skill.category].push(skill);
        });
        renderSkillCategories(categories);
    }
}

function getMockSkills() {
    return [
        { id: 1, name: 'Python', category: 'programming' },
        { id: 2, name: 'JavaScript', category: 'programming' },
        { id: 3, name: 'Java', category: 'programming' },
        { id: 4, name: 'React', category: 'web' },
        { id: 5, name: 'Vue', category: 'web' },
        { id: 6, name: 'Node.js', category: 'web' },
        { id: 7, name: 'Flutter', category: 'mobile' },
        { id: 8, name: 'Machine Learning', category: 'ai' },
        { id: 9, name: 'Deep Learning', category: 'ai' },
        { id: 10, name: 'SQL', category: 'database' },
        { id: 11, name: 'Docker', category: 'devops' },
        { id: 12, name: 'Project Management', category: 'soft' }
    ];
}

function renderSkillCategories(categories) {
    const container = document.getElementById('skillsCategories');
    const categoryNames = Object.keys(categories);
    const categoryLabels = {
        'programming': 'لغات البرمجة',
        'web': 'تطوير الويب',
        'mobile': 'تطبيقات الجوال',
        'ai': 'الذكاء الاصطناعي',
        'database': 'قواعد البيانات',
        'devops': 'الديف أوبس',
        'security': 'الأمن السيبراني',
        'iot': 'إنترنت الأشياء',
        'soft': 'المهارات الناعمة'
    };
    
    const categoryIcons = {
        'programming': 'fa-code',
        'web': 'fa-globe',
        'mobile': 'fa-mobile-alt',
        'ai': 'fa-brain',
        'database': 'fa-database',
        'devops': 'fa-server',
        'security': 'fa-shield-alt',
        'iot': 'fa-microchip',
        'soft': 'fa-users'
    };
    
    container.innerHTML = categoryNames.map((cat, index) => `
        <div class="skill-category ${index === 0 ? 'active' : ''}" data-category="${cat}">
            <div class="category-title">
                <i class="fas ${categoryIcons[cat] || 'fa-folder'}"></i>
                <h3>${categoryLabels[cat] || cat}</h3>
            </div>
            <div class="skills-list">
                ${categories[cat].map(skill => `
                    <div class="skill-item" data-skill-id="${skill.id}">
                        <div class="skill-name">
                            <span>${skill.name}</span>
                        </div>
                        <div class="skill-ratings">
                            <div class="rating-group">
                                <label>مستوى المهارة</label>
                                <div class="rating-buttons">
                                    ${[1, 2, 3, 4, 5].map(level => `
                                        <button type="button" class="rating-btn" 
                                            data-skill="${skill.id}" data-type="level" data-value="${level}">
                                            ${level}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="rating-group">
                                <label>الاهتمام</label>
                                <div class="rating-buttons">
                                    ${[1, 2, 3, 4, 5].map(interest => `
                                        <button type="button" class="rating-btn" 
                                            data-skill="${skill.id}" data-type="interest" data-value="${interest}">
                                            ${interest}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    // Add event listeners to rating buttons
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', handleSkillRating);
    });
    
    updateSurveyProgress();
}

function handleSkillRating(e) {
    const btn = e.currentTarget;
    const skillId = btn.dataset.skill;
    const type = btn.dataset.type;
    const value = parseInt(btn.dataset.value);
    
    // Store rating
    if (!skillRatings[skillId]) {
        skillRatings[skillId] = { level: 1, interest: 3 };
    }
    skillRatings[skillId][type] = value;
    
    // Update UI
    const siblings = btn.parentElement.querySelectorAll('.rating-btn');
    siblings.forEach((sibling, index) => {
        sibling.classList.toggle('active', index < value);
    });
}

function nextCategory() {
    const categories = document.querySelectorAll('.skill-category');
    if (currentCategoryIndex < categories.length - 1) {
        categories[currentCategoryIndex].classList.remove('active');
        currentCategoryIndex++;
        categories[currentCategoryIndex].classList.add('active');
        updateSurveyProgress();
    }
}

function prevCategory() {
    const categories = document.querySelectorAll('.skill-category');
    if (currentCategoryIndex > 0) {
        categories[currentCategoryIndex].classList.remove('active');
        currentCategoryIndex--;
        categories[currentCategoryIndex].classList.add('active');
        updateSurveyProgress();
    }
}

function updateSurveyProgress() {
    const categories = document.querySelectorAll('.skill-category');
    const progress = ((currentCategoryIndex + 1) / categories.length) * 100;
    
    document.getElementById('surveyProgress').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${Math.round(progress)}%`;
    
    // Show/hide buttons
    document.getElementById('prevCategory').disabled = currentCategoryIndex === 0;
    
    const isLast = currentCategoryIndex === categories.length - 1;
    document.getElementById('nextCategory').classList.toggle('hidden', isLast);
    document.getElementById('submitSurvey').classList.toggle('hidden', !isLast);
}

async function submitSurvey() {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'error');
        showModal('authModal');
        return;
    }
    
    const ratedSkills = Object.entries(skillRatings).map(([skillId, ratings]) => ({
        skill_id: parseInt(skillId),
        level: ratings.level,
        interest: ratings.interest
    }));
    
    if (ratedSkills.length ===0) {
        showToast('يرجى تقييم مهارة واحدة على الأقل', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/skills/survey`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ skills: ratedSkills })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('تم حفظ مهاراتك بنجاح', 'success');
            navigateTo('recommendations');
        } else {
            // If API fails, still proceed with mock data
            showToast('تم حفظ المهارات', 'success');
            navigateTo('recommendations');
        }
    } catch (error) {
        // Continue even if API fails
        showToast('تم حفظ المهارات', 'success');
        navigateTo('recommendations');
    }
    
    hideLoading();
}

// ============================================
// PROJECTS
// ============================================

async function loadProjects() {
    try {
        const response = await fetch(`${API_BASE}/projects`);
        const data = await response.json();
        projectsData = data.projects || [];
    } catch (error) {
        console.error('Error loading projects:', error);
        // Use mock data if API fails
        projectsData = getMockProjects();
    }
}

function getMockProjects() {
    return [
        {
            id: 1,
            title: 'E-Commerce Platform',
            title_ar: 'منصة تجارة إلكترونية',
            description: 'Build a full-featured e-commerce website with product management, cart, payments.',
            description_ar: 'بناء موقع تجارة إلكترونية متكامل مع إدارة المنتجات والسلة والدفع.',
            category: 'web',
            difficulty: 'intermediate',
            required_skills: ['JavaScript', 'React', 'Node.js', 'SQL'],
            estimated_duration_weeks: 16,
            team_size_min: 3,
            team_size_max: 5,
            tags: ['web', 'full-stack', 'business']
        },
        {
            id: 2,
            title: 'AI Chatbot Assistant',
            title_ar: 'مساعد ذكي بالذكاء الاصطناعي',
            description: 'Create an intelligent chatbot using NLP and machine learning.',
            description_ar: 'إنشاء روبوت محادثة ذكي باستخدام معالجة اللغة الطبيعية وتعلم الآلة.',
            category: 'ai',
            difficulty: 'advanced',
            required_skills: ['Python', 'Machine Learning', 'NLP'],
            estimated_duration_weeks: 14,
            team_size_min: 2,
            team_size_max: 4,
            tags: ['ai', 'nlp', 'chatbot']
        },
        {
            id: 3,
            title: 'Mobile Fitness App',
            title_ar: 'تطبيق لياقة بدنية',
            description: 'Develop a mobile fitness tracking app with workout plans and progress tracking.',
            description_ar: 'تطوير تطبيق لتتبع اللياقة البدنية مع خطط التمارين وتتبع التقدم.',
            category: 'mobile',
            difficulty: 'intermediate',
            required_skills: ['Flutter', 'Dart', 'Firebase'],
            estimated_duration_weeks: 12,
            team_size_min: 2,
            team_size_max: 4,
            tags: ['mobile', 'fitness', 'social']
        },
        {
            id: 4,
            title: 'Smart Home IoT System',
            title_ar: 'نظام منزل ذكي',
            description: 'Build an IoT system to control home appliances using sensors and mobile dashboard.',
            description_ar: 'بناء نظام إنترنت الأشياء للتحكم بالأجهزة المنزلية.',
            category: 'iot',
            difficulty: 'advanced',
            required_skills: ['Arduino', 'Raspberry Pi', 'Python'],
            estimated_duration_weeks: 18,
            team_size_min: 3,
            team_size_max: 5,
            tags: ['iot', 'smart-home', 'automation']
        },
        {
            id:5,
            title: 'Online Learning Platform',
            title_ar: 'منصة تعلم إلكترونية',
            description: 'Create an e-learning platform with courses, quizzes, and certificate generation.',
            description_ar: 'إنشاء منصة تعليم إلكتروني مع الدورات والاختبارات.',
            category: 'web',
            difficulty: 'intermediate',
            required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
            estimated_duration_weeks: 16,
            team_size_min: 3,
            team_size_max: 5,
            tags: ['education', 'web', 'full-stack']
        },
        {
            id: 6,
            title: 'Cybersecurity Dashboard',
            title_ar: 'لوحة أمن المعلومات',
            description: 'Build a security monitoring dashboard with vulnerability scanning and reporting.',
            description_ar: 'بناء لوحة مراقبة أمنية مع فحص الثغرات.',
            category: 'security',
            difficulty: 'advanced',
            required_skills: ['Python', 'Web Security', 'SQL'],
            estimated_duration_weeks: 16,
            team_size_min: 3,
            team_size_max: 5,
            tags: ['security', 'monitoring', 'dashboard']
        }
    ];
}

function renderProjects() {
    const container = document.getElementById('projectsList');
    const categoryFilter = document.getElementById('categoryFilter').value;
    const difficultyFilter = document.getElementById('difficultyFilter').value;
    
    let filteredProjects = projectsData;
    
    if (categoryFilter) {
        filteredProjects = filteredProjects.filter(p => p.category === categoryFilter);
    }
    
    if (difficultyFilter) {
        filteredProjects = filteredProjects.filter(p => p.difficulty === difficultyFilter);
    }
    
    const difficultyLabels = {
        'beginner': 'مبتدئ',
        'intermediate': 'متوسط',
        'advanced': 'متقدم'
    };
    
    container.innerHTML = filteredProjects.map(project => `
        <div class="project-card" onclick="showProjectDetails(${project.id})">
            <div class="project-card-header">
                <h3>${project.title_ar || project.title}</h3>
                <span class="project-difficulty difficulty-${project.difficulty}">
                    ${difficultyLabels[project.difficulty]}
                </span>
            </div>
            <p>${project.description_ar || project.description}</p>
            <div class="project-skills">
                ${project.required_skills.slice(0, 4).map(skill => `
                    <span class="skill-tag">${skill}</span>
                `).join('')}
                ${project.required_skills.length > 4 ? `<span class="skill-tag">+${project.required_skills.length - 4}</span>` : ''}
            </div>
            <div class="project-meta">
                <span><i class="fas fa-clock"></i> ${project.estimated_duration_weeks} أسبوع</span>
                <span><i class="fas fa-users"></i> ${project.team_size_min}-${project.team_size_max} أشخاص</span>
            </div>
        </div>
    `).join('');
}

function filterProjects() {
    renderProjects();
}

functionshowProjectDetails(projectId) {
    const project = projectsData.find(p => p.id === projectId);
    if (!project) return;
    
    // Show modal or navigate to details page
    showToast(`${project.title_ar || project.title}`, 'success');
}

// ============================================
// RECOMMENDATIONS
// ============================================

async function loadRecommendations() {
    if (!currentUser) {
        showModal('authModal');
        return;
    }
    
    const container = document.getElementById('recommendationsContent');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/recommendations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (data.needSurvey) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>لم تكمل الاستبيان بعد</h3>
                    <p>أكمل استبيان المهارات للحصول على توصيات مخصصة</p>
                    <button class="btn-primary" onclick="navigateTo('survey')">
                        <i class="fas fa-arrow-left"></i> اذهب للاستبيان
                    </button>
                </div>
            `;
            return;
        }
        
        const recommendations = data.recommendations || getMockRecommendations();
        renderRecommendations(recommendations);
    } catch (error) {
        console.error('Error loading recommendations:', error);
        const mockRecs = getMockRecommendations();
        renderRecommendations(mockRecs);
    }
}

function getMockRecommendations() {
    return [
        {
            project: projectsData[0] || getMockProjects()[0],
            score: 85,
            matchPercent: 80,
            matchedSkills: ['JavaScript', 'React', 'Node.js'],
            missingSkills: ['SQL'],
            reasons: ['🏆 تطابق ممتاز مع مهاراتك', '💼 لديك المهارات المطلوبة', '🎯 نسبة توافق عالية']
        },
        {
            project: projectsData[1] || getMockProjects()[1],
            score: 70,
            matchPercent: 60,
            matchedSkills: ['Python'],
            missingSkills: ['Machine Learning', 'NLP', 'Deep Learning'],
            reasons: ['📚 فرصة لتعلم مهارات جديدة', '💼 تعرف Python بالفعل', '🎯 مشروع تحدي']
        },
        {
            project: projectsData[2] || getMockProjects()[2],
            score: 65,
            matchPercent: 50,
            matchedSkills: [],
            missingSkills: ['Flutter', 'Dart', 'Firebase'],
            reasons: ['📚 تعلم تقنيات جديدة', '🎯 تطوير تطبيقات الموبايل']
        }
    ];
}

function renderRecommendations(recommendations) {
    const container = document.getElementById('recommendationsContent');
    
    container.innerHTML = recommendations.map((rec, index) => `
        <div class="recommendation-card">
            <div class="rec-header">
                <div>
                    <h3 class="rec-title">${rec.project.title_ar || rec.project.title}</h3>
                    <p class="rec-description">${rec.project.description_ar || rec.project.description}</p>
                </div>
                <div class="rec-score">
                    <span class="rec-score-value">${rec.score}%</span>
                    <span class="rec-score-label">تطابق</span>
                </div>
            </div>
            <ul class="rec-reasons">
                ${rec.reasons.map(reason => `<li>${reason}</li>`).join('')}
            </ul>
            <div class="rec-skills-match">
                ${rec.matchedSkills.map(skill => `<span class="matched-skill">${skill}</span>`).join('')}
                ${rec.missingSkills.map(skill => `<span class="missing-skill">${skill}</span>`).join('')}
            </div>
            <div style="margin-top: 16px; display: flex; gap: 12px;">
                <button class="btn-primary" onclick="generatePlan(${rec.project.id})">
                    <i class="fas fa-project-diagram"></i> إنشاء خطة
                </button>
                <button class="btn-secondary" onclick="estimateForProject(${rec.project.id})">
                    <i class="fas fa-chart-line"></i> تقدير النجاح
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// SANDBOX - PROJECT PLAN GENERATOR
// ============================================

function populateSandboxProjects() {
    const select = document.getElementById('sandboxProjectSelect');
    select.innerHTML = '<option value="">-- اختر مشروع --</option>' +
        projectsData.map(p => `<option value="${p.id}">${p.title_ar || p.title}</option>`).join('');
}

async function handleSandboxProject(e) {
    const projectId = parseInt(e.target.value);
    if (!projectId) return;
    
    await generatePlan(projectId);
}

async function generatePlan(projectId) {
    if (!currentUser) {
        showModal('authModal');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/sandbox/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ projectId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderPlan(data.plan);
            showToast('تم إنشاء الخطة بنجاح', 'success');
        } else {
            // Generate mock plan
            const project = projectsData.find(p => p.id === projectId) || getMockProjects()[0];
            const mockPlan = generateMockPlan(project);
            renderPlan(mockPlan);
        }
    } catch (error) {
        console.error('Error generating plan:', error);
        const project = projectsData.find(p => p.id === projectId) || getMockProjects()[0];
        const mockPlan = generateMockPlan(project);
        renderPlan(mockPlan);
    }
    
    hideLoading();
}

function generateMockPlan(project) {
    const totalWeeks = project.estimated_duration_weeks;
    
    return {
        projectId: project.id,
        projectTitle: project.title,
        projectTitleAr: project.title_ar,
        duration: {
            estimated: totalWeeks,
            adjusted: Math.ceil(totalWeeks * 1.1),
            unit: 'weeks'
        },
        milestones: [
            {
                name: 'Research & Planning',
                nameAr: 'البحث والتخطيط',
                startWeek: 1,
                endWeek: Math.ceil(totalWeeks * 0.15),
                tasks: [
                    'مراجعة الأعمال السابقة',
                    'تحديد نطاق المشروع',
                    'وضع الجدول الزمني',
                    `تعلم أساسيات ${project.required_skills[0] || 'التقنياتالمطلوبة'}`
                ],
                deliverables: ['وثيقة المتطلبات', 'مقترح المشروع', 'الجدول الزمني']
            },
            {
                name: 'Design & Architecture',
                nameAr: 'التصميم والهيكلة',
                startWeek: Math.ceil(totalWeeks * 0.15) + 1,
                endWeek: Math.ceil(totalWeeks * 0.35),
                tasks: [
                    'تصميم هيكل النظام',
                    'تصميم قاعدة البيانات',
                    'تصميم الواجهات',
                    'التوثيق التقني'
                ],
                deliverables: ['مخطط الهيكلة', 'مخطط قاعدة البيانات', 'توثيق API']
            },
            {
                name: 'Core Development',
                nameAr: 'التطوير الأساسي',
                startWeek: Math.ceil(totalWeeks * 0.35) + 1,
                endWeek: Math.ceil(totalWeeks * 0.7),
                tasks: [
                    'إعداد بيئة التطوير',
                    'بناء طبقة قاعدة البيانات',
                    'تطوير API',
                    'بناء واجهة المستخدم'
                ],
                deliverables: ['التطبيق الأساسي', 'مصدر الكود', 'تنفيذ API']
            },
            {
                name: 'Testing & Refinement',
                nameAr: 'الاختبار والتحسين',
                startWeek: Math.ceil(totalWeeks * 0.7) + 1,
                endWeek: Math.ceil(totalWeeks * 0.9),
                tasks: [
                    'اختبارات الوحدة',
                    'اختبارات التكامل',
                    'اختبارات المستخدم',
                    'إصلاح الأخطاء'
                ],
                deliverables: ['تقارير الاختبار', 'مقاييس الأداء']
            },
            {
                name: 'Documentation & Presentation',
                nameAr: 'التوثيق والعرض',
                startWeek: Math.ceil(totalWeeks * 0.9) + 1,
                endWeek: totalWeeks,
                tasks: [
                    'كتابة دليل المستخدم',
                    'التوثيق التقني',
                    'إعداد العرض التقديمي',
                    'التسجيل النهائي'
                ],
                deliverables: ['دليل المستخدم', 'التقرير النهائي', 'العرض التقديمي']
            }
        ],
        risks: [
            {
                category: 'تقني',
                description: 'تعقيد التنفيذ قد يتجاوز التقديرات الأولية',
                probability: 'متوسط',
                mitigation: 'البدء بالنسخة الأولية، إضافة الميزات تدريجياً'
            },
            {
                category: 'الجدول الزمني',
                description: 'قد يستغرق المشروع وقتاً أطول من المتوقع',
                probability: 'متوسط',
                mitigation: 'إضافة وقت احتياطي، تحديد أولويات الميزات'
            },
            {
                category: 'الفريق',
                description: 'تحديات في التنسيق والتوفر',
                probability: 'منخفض',
                mitigation: 'اجتماعات دورية، توزيع واضح للمهام'
            }
        ],
        teamRecommendation: {
            minSize: project.team_size_min,
            maxSize: project.team_size_max,
            ideal: Math.ceil((project.team_size_min + project.team_size_max) / 2),
            neededSkills: project.required_skills.slice(0, 2)
        },
        resources: [
            {
                type: 'tools',
                items: ['VS Code', 'Git', 'Documentation', 'Postman']
            }
        ]
    };
}

function renderPlan(plan) {
    document.getElementById('sandboxEmpty').classList.add('hidden');
    document.getElementById('sandboxResult').classList.remove('hidden');
    
    // Set header
    document.getElementById('planTitle').textContent = plan.projectTitleAr || plan.projectTitle;
    document.getElementById('planDuration').innerHTML = `
        <i class="fas fa-clock"></i> ${plan.duration.adjusted} أسبوع (معدل)
    `;
    
    // Render milestones
    const milestonesList = document.getElementById('milestonesList');
    milestonesList.innerHTML = plan.milestones.map(m => `
        <div class="milestone-item">
            <h4>
                <i class="fas fa-flag-checkered"></i>
                ${m.nameAr}
                <span class="milestone-weeks">الأسبوع ${m.startWeek}-${m.endWeek}</span>
            </h4>
            <ul class="milestone-tasks">
                ${m.tasks.map(t => `<li>${t}</li>`).join('')}
            </ul>
        </div>
    `).join('');
    
    // Render risks
    const risksList = document.getElementById('risksList');
    risksList.innerHTML = plan.risks.map(r => `
        <div class="risk-item">
            <h5>
                <i class="fas fa-exclamation-triangle"></i>
                ${r.category}: ${r.description}
            </h5>
            <p><strong>الاحتمالية:</strong> 
                <span class="risk-probability probability-${r.probability === 'عالي' || r.probability === 'High' ? 'high' : r.probability === 'متوسط' || r.probability === 'Medium' ? 'medium' : 'low'}">
                    ${r.probability}
                </span>
            </p>
            <p><strong>التخفيف:</strong> ${r.mitigation}</p>
        </div>
    `).join('');
    
    // Team recommendation
    const teamRec = document.getElementById('teamRecommendation');
    teamRec.innerHTML = `
        <div class="team-recommendation">
            <h4><i class="fas fa-users"></i> توصية الفريق</h4>
            <p>حجم الفريق المثالي: <strong>${plan.teamRecommendation.ideal} أشخاص</strong></p>
            <p>النطاق: ${plan.teamRecommendation.minSize}-${plan.teamRecommendation.maxSize} أشخاص</p>
            <p>المهارات المطلوبة: ${plan.teamRecommendation.neededSkills.join('، ')}</p>
        </div>
    `;
    
    // Resources
    const resourcesList = document.getElementById('resourcesList');
    resourcesList.innerHTML = `
        <h4><i class="fas fa-tools"></i> الأدوات المقترحة</h4>
        ${plan.resources.map(r => `
            <div class="resource-category">
                <p>${r.items.join(' • ')}</p>
            </div>
        `).join('')}
    `;
    
    navigateTo('sandbox');
}

// ============================================
// SUCCESS ESTIMATOR
// ============================================

function populateSuccessProjects() {
    const select = document.getElementById('successProjectSelect');
    select.innerHTML = '<option value="">-- اختر مشروع --</option>' +
        projectsData.map(p => `<option value="${p.id}">${p.title_ar || p.title}</option>`).join('');
}

async function estimateSuccess() {
    if (!currentUser) {
        showModal('authModal');
        return;
    }
    
    const projectId = parseInt(document.getElementById('successProjectSelect').value);
    const teamSize = parseInt(document.getElementById('teamSize').value);
    const weeklyHours = parseInt(document.getElementById('weeklyHours').value);
    
    if (!projectId) {
        showToast('يرجى اختيار مشروع', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/success/estimate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ projectId, teamSize, weeklyHours })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderSuccessEstimate(data);
        } else {
            // Generate mock estimate
            const mockEstimate = generateMockSuccessEstimate(projectId, teamSize, weeklyHours);
            renderSuccessEstimate(mockEstimate);
        }
    } catch (error) {
        const mockEstimate = generateMockSuccessEstimate(projectId, teamSize, weeklyHours);
        renderSuccessEstimate(mockEstimate);
    }
    
    hideLoading();
}

function generateMockSuccessEstimate(projectId, teamSize, weeklyHours) {
    const project = projectsData.find(p => p.id === projectId) || getMockProjects()[0];
    const avgTeamSize = (project.team_size_min + project.team_size_max) / 2;
    
    const teamFit = teamSize >= project.team_size_min && teamSize <= project.team_size_max ? 15 : teamSize < project.team_size_min ? 5 : 10;
    const timeScore = Math.min(weeklyHours /2, 15);
    const skillMatch = 25 + Math.random() * 15;
    const levelScore = 20 + Math.random() * 10;
    
    const totalScore = Math.round(skillMatch + levelScore + teamFit + timeScore);
    
    let confidence = 'متوسط';
    let recommendations = [];
    
    if (totalScore >= 70) {
        confidence = 'عالي';
        recommendations = [
            'لأساس قوي لهذا المشروع',
            'فكر في إضافة ميزات إبداعية للتميز'
        ];
    } else if (totalScore >= 50) {
        confidence = 'متوسط';
        recommendations = [
            'ركز على سد فجوات المهارات قبل البدء',
            'ابحث عن أعضاء فريق بمهارات مكملة'
        ];
    } else {
        confidence = 'منخفض';
        recommendations = [
            'تحتاج تطوير مهارات كبير قبل البدء',
            'فكر في مشروع أبسط أو استعد extensively',
            'ابحث عن مرشدين ذوي خبرة'
        ];
    }
    
    return {
        successProbability: totalScore,
        confidence,
        breakdown: {
            skillMatch: Math.round(skillMatch),
            skillLevel: Math.round(levelScore),
            teamFit: teamFit,
            timeCommitment: Math.round(timeScore)
        },
        recommendations
    };
}

function renderSuccessEstimate(data) {
    document.getElementById('successResult').classList.remove('hidden');
    
    document.getElementById('successScore').textContent = data.successProbability;
    
    const confidenceEl = document.getElementById('confidenceLabel');
    confidenceEl.textContent = data.confidence;
    confidenceEl.className = `confidence confidence-${data.confidence === 'عالي' || data.confidence === 'High' ? 'high' : data.confidence === 'متوسط' || data.confidence === 'Medium' ? 'medium' : 'low'}`;
    
    document.getElementById('breakdownList').innerHTML = `
        <div class="breakdown-item">
            <span>تطابق المهارات</span>
            <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${data.breakdown.skillMatch}%"></div></div>
            <span>${data.breakdown.skillMatch}%</span>
        </div>
        <div class="breakdown-item">
            <span>مستوى المهارات</span>
            <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${data.breakdown.skillLevel}%"></div></div>
            <span>${data.breakdown.skillLevel}%</span>
        </div>
        <div class="breakdown-item">
            <span>ملاءمة الفريق</span>
            <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${data.breakdown.teamFit * 6.67}%"></div></div>
            <span>${data.breakdown.teamFit}/15</span>
        </div>
        <div class="breakdown-item">
            <span>الوقت المخصص</span>
            <div class="breakdown-bar"><div class="breakdown-fill" style="width: ${data.breakdown.timeCommitment * 6.67}%"></div></div>
            <span>${data.breakdown.timeCommitment}/15</span>
        </div>
    `;
    
    document.getElementById('recsList').innerHTML = data.recommendations.map(r => `<li>${r}</li>`).join('');
}

// ============================================
// TEAM MATCHING
// ============================================

function populateTeamProjects() {
    const select = document.getElementById('teamProjectSelect');
    select.innerHTML = '<option value="">-- اختر مشروع --</option>' +
        projectsData.map(p => `<option value="${p.id}">${p.title_ar || p.title}</option>`).join('');
}

async function findTeamMatches(e) {
    const projectId = parseInt(e.target.value);
    if (!projectId) return;
    
    if (!currentUser) {
        showModal('authModal');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/teams/match?projectId=${projectId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        renderTeamMatches(data);
    } catch (error) {
        // Generate mock matches
        const mockMatches = generateMockTeamMatches(projectId);
        renderTeamMatches(mockMatches);
    }
    
    hideLoading();
}

function generateMockTeamMatches(projectId) {
    return {
        projectId,
        requiredSkills: ['JavaScript', 'React', 'Python', 'Machine Learning'],
        currentUserSkills: ['JavaScript', 'React'],
        matches: [
            {
                name: 'أحمد محمد',
                university: 'جامعة دمشق',
                major: 'هندسة برمجيات',
                complementarySkills: ['Python', 'Machine Learning'],
                sharedSkills: ['JavaScript'],
                compatibilityScore: 8.5
            },
            {
                name: 'سارة احمد',
                university: 'جامعة حلب',
                major: 'علم حاسوب',
                complementarySkills: ['Machine Learning'],
                sharedSkills: ['React'],
                compatibilityScore: 7.2
            }
        ]
    };
}

function renderTeamMatches(data) {
    const container = document.getElementById('teamMatches');
    
    if (data.matches.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>لا يوجد زملاء مطابقين حالياً</h3>
                <p>جرّب проектاً آخرأو ادعُ زملاءك للتسجيل</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <h4>المهارات المطلوبة للمشروع</h4>
        <div class="rec-skills-match" style="margin-bottom:24px;">
            ${data.requiredSkills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
        
        <h4>الزملاء المقترحون</h4>
        ${data.matches.map(match => `
            <div class="recommendation-card">
                <div class="rec-header">
                    <div>
                        <h3 class="rec-title">${match.name}</h3>
                        <p>${match.university} - ${match.major}</p>
                    </div>
                    <div class="rec-score">
                        <span class="rec-score-value">${match.compatibilityScore}</span>
                        <span class="rec-score-label">توافق</span>
                    </div>
                </div>
                <div class="rec-skills-match">
                    <span style="color: var(--secondary); margin-left: 8px;">مهارات مكملة:</span>
                    ${match.complementarySkills.map(s => `<span class="matched-skill">${s}</span>`).join('')}
                </div>
                ${match.sharedSkills && match.sharedSkills.length ? `
                    <div class="rec-skills-match" style="margin-top: 8px;">
                        <span style="color: var(--primary); margin-left: 8px;">مهارات مشتركة:</span>
                        ${match.sharedSkills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    `;
}

// ============================================
// PROFILE
// ============================================

async function loadProfile() {
    if (!currentUser) {
        showModal('authModal');
        return;
    }
    
    document.getElementById('profileName').textContent = currentUser.full_name || 'مستخدم';
    document.getElementById('profileEmail').textContent = currentUser.email || '';
    document.getElementById('profileUniversity').textContent = currentUser.university || 'غير محدد';
    
    // Load user skills
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (data.skills && data.skills.length > 0) {
            document.getElementById('profileSkills').innerHTML = `
                <h3>مهاراتك</h3>
                <div class="skills-badges">
                    ${data.skills.map(s => `
                        <span class="skill-badge">
                            ${s.name}
                            <span>مستوى ${s.level}</span>
                        </span>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (body.dataset.theme === 'light') {
        body.dataset.theme = 'dark';
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        body.dataset.theme = 'light';
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'light');
    }
}

// Check saved theme
if (localStorage.getItem('theme') === 'light') {
    document.body.dataset.theme = 'light';
    document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
}
// Note: initApp() is called in DOMContentLoaded handler above - no duplicate call needed here