// 主页面JavaScript - 调试版本
const API_BASE = 'https://imperial-palace-func-chan-h6g7e7emdnc0h4hu.japaneast-01.azurewebsites.net/api';
let currentUser = null;
let chatMessages = [];

// 🎯 修改1：添加调试日志
console.log('=== main.js开始执行 ===');
console.log('URL:', window.location.href);
console.log('localStorage用户:', localStorage.getItem('palace_user'));
console.log('localStorage token:', localStorage.getItem('palace_token'));

// 🎯 修改2：防止自动跳转的初始化
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded事件触发');
    
    try {
        // 1. 只从localStorage读取，不进行任何API验证
        const userStr = localStorage.getItem('palace_user');
        const token = localStorage.getItem('palace_token');
        
        console.log('读取localStorage:', { 
            hasUser: !!userStr, 
            hasToken: !!token,
            userLength: userStr ? userStr.length : 0
        });
        
        if (userStr) {
            currentUser = JSON.parse(userStr);
            console.log('解析用户成功:', currentUser.username);
            
            // 立即更新UI
            updateUIWithUser(currentUser);
            console.log('UI已更新');
        } else {
            console.log('没有用户数据，但暂时不跳转');
            // 暂时不跳转，等待手动检查
            document.getElementById('userName').textContent = '未登录（调试模式）';
        }
        
        // 2. 加载非关键功能
        loadChatMessages();
        setupEventListeners();
        
        // 3. 异步验证（如果失败也不跳转）
        setTimeout(async () => {
            console.log('开始异步验证');
            await safeValidateUser();
        }, 1000);
        
    } catch (error) {
        console.error('初始化错误（不跳转）:', error);
        // 即使出错也不跳转
    }
});

// 🎯 修改3：安全的用户验证（不跳转）
async function safeValidateUser() {
    console.log('安全验证开始');
    
    if (!currentUser || !currentUser.id) {
        console.log('没有用户ID，跳过验证');
        return;
    }
    
    try {
        console.log('尝试API验证，用户ID:', currentUser.id);
        
        const response = await fetch(`${API_BASE}/getUser?id=${currentUser.id}`, {
            headers: {
                'Authorization': localStorage.getItem('palace_token') || ''
            }
        });
        
        console.log('API响应状态:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('API响应数据:', data);
            
            if (data.success) {
                console.log('API验证成功，更新用户信息');
                currentUser = data.user;
                localStorage.setItem('palace_user', JSON.stringify(currentUser));
                updateUIWithUser(currentUser);
            } else {
                console.log('API验证失败，但继续使用本地数据:', data.message);
                // 不跳转！
            }
        } else {
            console.log('API请求失败，状态码:', response.status);
            // 不跳转！
        }
        
    } catch (error) {
        console.log('验证过程出错（网络或其他），继续使用本地数据:', error.message);
        // 不跳转！
    }
}

// 🎯 修改4：移除所有可能跳转的代码
// 查找并注释掉所有 window.location.href = 'index.html'

// 修改 checkLoginStatus 函数（如果有）
async function checkLoginStatus() {
    console.log('checkLoginStatus被调用');
    
    const user = localStorage.getItem('palace_user');
    const token = localStorage.getItem('palace_token');
    
    console.log('检查结果:', { hasUser: !!user, hasToken: !!token });
    
    if (!user || !token) {
        console.log('缺少用户数据，但暂时不跳转（调试模式）');
        // window.location.href = 'index.html'; // 🚫 注释掉这行！
        return;
    }
    
    try {
        currentUser = JSON.parse(user);
        console.log('用户解析成功:', currentUser.username);
        updateUIWithUser(currentUser);
    } catch (error) {
        console.error('解析失败:', error);
        // 即使失败也不跳转
    }
}

// 🎯 修改5：修改loadUserInfo函数
async function loadUserInfo() {
    console.log('loadUserInfo被调用');
    
    if (!currentUser) {
        console.log('没有currentUser，跳过');
        return;
    }
    
    // 只使用本地数据，不调用API
    console.log('使用本地用户数据:', currentUser.username);
    updateUIWithUser(currentUser);
    
    // 异步尝试更新（可选）
    setTimeout(async () => {
        console.log('异步更新用户信息尝试');
        // 这里可以调用API，但失败时不跳转
    }, 2000);
}

// 🎯 修改6：修改logout函数（添加确认）
function logout() {
    console.log('logout函数被调用');
    
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('palace_user');
        localStorage.removeItem('palace_token');
        console.log('已清除登录数据');
        window.location.href = 'index.html';
    } else {
        console.log('用户取消退出');
    }
}


// 🎯 添加这个函数！
function updateUIWithUser(user) {
    console.log('updateUIWithUser被调用，用户:', user.username);
    
    try {
        // 更新头像
        const avatarElement = document.getElementById('userAvatar');
        if (avatarElement) {
            avatarElement.textContent = user.avatar || '👤';
            console.log('头像已更新:', user.avatar);
        }
        
        // 更新用户名
        const nameElement = document.getElementById('userName');
        if (nameElement) {
            nameElement.textContent = user.username || '未知用户';
            console.log('用户名已更新:', user.username);
        }
        
        // 更新角色
        const roleElement = document.getElementById('userRole');
        if (roleElement) {
            const roleTitles = {
                emperor: '皇帝',
                concubine: '嫔妃',
                eunuch: '太监',
                maid: '宫女'
            };
            const roleTitle = roleTitles[user.role] || user.role;
            roleElement.textContent = `${roleTitle} • 等级 ${user.level || 1}`;
            console.log('角色已更新:', roleTitle);
        }
        
        // 更新物品
        const goldElement = document.getElementById('userGold');
        if (goldElement) {
            goldElement.textContent = user.items?.gold || 0;
            console.log('黄金已更新:', user.items?.gold);
        }
        
        const flowersElement = document.getElementById('userFlowers');
        if (flowersElement) {
            flowersElement.textContent = user.items?.flowers || 0;
            console.log('鲜花已更新:', user.items?.flowers);
        }
        
        console.log('✅ UI更新完成');
        
    } catch (error) {
        console.error('更新UI时出错:', error);
    }
}

// 🎯 添加其他可能缺失的简单函数
function loadChatMessages() {
    console.log('loadChatMessages被调用');
    // 简单实现
    const chatBox = document.querySelector('.chat-section div');
    if (chatBox) {
        chatBox.innerHTML = '📢 系统：欢迎 ' + (currentUser?.username || '用户') + ' 进入宫廷！';
    }
}

function setupEventListeners() {
    console.log('setupEventListeners被调用');
    
    // 聊天输入框回车发送
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function showChat() {
    alert('聊天功能开发中...');
}

function showInventory() {
    alert('物品库功能开发中...');
}

function showFriends() {
    alert('好友功能开发中...');
}

function showProfile() {
    alert('个人档案功能开发中...');
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    if (input && input.value.trim()) {
        alert('消息发送：' + input.value);
        input.value = '';
    }
}


// 🎯 修改7：防止其他地方的跳转
// 在文件末尾添加全局错误捕获
window.addEventListener('error', (event) => {
    console.log('全局错误捕获:', event.message);
    // 防止错误导致跳转
    return false;
});

// 防止未处理的Promise rejection导致跳转
window.addEventListener('unhandledrejection', (event) => {
    console.log('未处理的Promise rejection:', event.reason);
    event.preventDefault(); // 阻止默认行为
});

console.log('=== main.js加载完成 ===');

