// 全局变量
let currentLanguage = 'zh-CN';
let translations = {};
let isRegistering = false;

// 加载语言文件
async function loadLanguage(lang) {
    try {
        const response = await fetch(`languages/${lang}.json`);
        translations = await response.json();
        applyTranslations();
        updateUIForLanguage();
    } catch (error) {
        console.error('加载语言文件失败:', error);
    }
}

// 应用翻译
function applyTranslations() {
    // 更新所有带data-i18n属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[key]) {
            element.textContent = translations[key];
        }
    });

    // 特殊元素
    const elements = {
        'pageTitle': 'appTitle',
        'appTitle': 'appTitle',
        'welcomeText': 'welcome',
        'usernameLabel': 'username',
        'passwordLabel': 'password',
        'loginBtn span': 'login',
        'registerBtn span': 'register',
        'roleHint': 'roles.hint',
        'registerTitle': 'register.title',
        'registerText': 'register.welcome',
        'regUsernameLabel': 'username',
        'regPasswordLabel': 'password',
        'regConfirmPasswordLabel': 'confirmPassword',
        'submitRegisterBtn span': 'register'
    };

    for (const [selector, key] of Object.entries(elements)) {
        const element = document.querySelector(selector);
        if (element && getTranslation(key)) {
            if (selector.includes('span')) {
                element.textContent = getTranslation(key);
            } else if (element.tagName === 'LABEL') {
                element.textContent = getTranslation(key);
            } else {
                element.textContent = getTranslation(key);
            }
        }
    }

    // 更新占位符
    const inputs = {
        'username': 'username',
        'password': 'password',
        'regUsername': 'username',
        'regPassword': 'password',
        'regConfirmPassword': 'confirmPassword'
    };

    for (const [id, key] of Object.entries(inputs)) {
        const input = document.getElementById(id);
        if (input) {
            input.placeholder = getTranslation(key);
        }
    }

    // 更新角色选项
    updateRoleOptions();
}

// 获取嵌套翻译
function getTranslation(key) {
    return key.split('.').reduce((obj, k) => obj && obj[k], translations);
}

// 更新角色选项
function updateRoleOptions() {
    const roleSelect = document.getElementById('regRole');
    if (roleSelect && translations.roles) {
        const options = roleSelect.querySelectorAll('option:not(:first-child)');
        options[0].text = `👑 ${translations.roles.emperor || '皇帝'}`;
        options[1].text = `👸 ${translations.roles.concubine || '嫔妃'}`;
        options[2].text = `👨‍💼 ${translations.roles.eunuch || '太监'}`;
        options[3].text = `💁‍♀️ ${translations.roles.maid || '宫女'}`;
    }
}

// 语言切换
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    loadLanguage(lang);
}

// 更新UI以适配语言
function updateUIForLanguage() {
    // 调整字体
    document.body.style.fontFamily = currentLanguage === 'zh-CN' 
        ? "'Noto Sans SC', sans-serif"
        : currentLanguage === 'th-TH'
        ? "'Noto Sans Thai', sans-serif"
        : "Arial, sans-serif";
    
    // 调整标题字体
    const title = document.querySelector('.palace-header h1');
    if (title) {
        title.style.fontFamily = currentLanguage === 'zh-CN'
            ? "'Ma Shan Zheng', cursive"
            : currentLanguage === 'th-TH'
            ? "'Noto Sans Thai', sans-serif"
            : "'Times New Roman', serif";
    }
}

// 显示消息
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box show ${type}`;
    
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 3000);
}

// 显示注册表单
function showRegister() {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('registerBox').style.display = 'block';
    isRegistering = true;
}

// 显示登录表单
function showLogin() {
    document.getElementById('registerBox').style.display = 'none';
    document.getElementById('loginBox').style.display = 'block';
    isRegistering = false;
}

// 处理登录
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username) {
        showMessage(getTranslation('error.usernameRequired') || '请输入用户名', 'error');
        return;
    }
    
    if (!password) {
        showMessage(getTranslation('error.passwordRequired') || '请输入密码', 'error');
        return;
    }
    
    // 这里应该调用后端API
    showMessage(getTranslation('loginSuccess') || '登录成功', 'success');
    
    // 模拟登录成功，跳转到主页面
    setTimeout(() => {
        window.location.href = 'main.html';
    }, 1000);
});

// 处理注册
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const role = document.getElementById('regRole').value;
    
    if (!username) {
        showMessage(getTranslation('error.usernameRequired') || '请输入用户名', 'error');
        return;
    }
    
    if (!password) {
        showMessage(getTranslation('error.passwordRequired') || '请输入密码', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage(getTranslation('error.passwordMismatch') || '密码不一致', 'error');
        return;
    }
    
    if (!role) {
        showMessage('请选择角色', 'error');
        return;
    }
    
    // 这里应该调用后端API
    showMessage(getTranslation('registerSuccess') || '注册成功', 'success');
    
    // 模拟注册成功，自动登录并跳转
    setTimeout(() => {
        showLogin();
        document.getElementById('username').value = username;
        document.getElementById('password').value = password;
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }, 1500);
});

// 角色图标点击事件
document.querySelectorAll('.role-icon').forEach(icon => {
    icon.addEventListener('click', function() {
        const role = this.getAttribute('data-role');
        document.querySelectorAll('.role-icon').forEach(i => {
            i.style.borderColor = 'transparent';
            i.style.boxShadow = 'none';
        });
        this.style.borderColor = '#d4a017';
        this.style.boxShadow = '0 5px 15px rgba(212, 160, 23, 0.3)';
        
        if (isRegistering) {
            document.getElementById('regRole').value = role;
        }
    });
});

// 页面加载时初始化
window.addEventListener('DOMContentLoaded', () => {
    // 设置首选语言
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'zh-CN';
    document.getElementById('languageSelect').value = savedLanguage;
    
    // 加载语言
    loadLanguage(savedLanguage);
    
    // 设置角色选项的data-i18n属性
    document.querySelectorAll('.role-icon').forEach(icon => {
        const role = icon.getAttribute('data-role');
        icon.setAttribute('data-i18n', `roles.${role}`);
    });
});