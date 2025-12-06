// 主页面JavaScript - SignalR实时聊天系统
const API_BASE = 'https://imperial-palace-func-chan-h6g7e7emdnc0h4hu.japaneast-01.azurewebsites.net/api';
let currentUser = null;
let signalRConnection = null;
let isSignalRConnected = false;

console.log('=== main.js开始执行（SignalR版） ===');

// 🎯 修改2：防止自动跳转的初始化
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded事件触发');
    
    try {
        // 1. 只从localStorage读取，不进行任何API验证
        const userStr = localStorage.getItem('palace_user');
        const token = localStorage.getItem('palace_token');
        
        console.log('读取localStorage:', { 
            hasUser: !!userStr, 
            hasToken: !!token
        });
        
        if (userStr) {
            currentUser = JSON.parse(userStr);
            console.log('解析用户成功:', currentUser.username);
            
            // 立即更新UI
            updateUIWithUser(currentUser);
            console.log('UI已更新');
            
            // 🆕 启动SignalR聊天系统！
            startChatSystem();
        } else {
            console.log('没有用户数据，但暂时不跳转');
            document.getElementById('userName').textContent = '未登录（调试模式）';
        }
        
        // 2. 设置事件监听器
        setupEventListeners();
        
        // 3. 异步验证（如果失败也不跳转）
        setTimeout(async () => {
            console.log('开始异步验证');
            await safeValidateUser();
        }, 1000);
        
    } catch (error) {
        console.error('初始化错误（不跳转）:', error);
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
            }
        } else {
            console.log('API请求失败，状态码:', response.status);
        }
        
    } catch (error) {
        console.log('验证过程出错，继续使用本地数据:', error.message);
    }
}

// 🎯 修改5：修改loadUserInfo函数
async function loadUserInfo() {
    console.log('loadUserInfo被调用');
    
    if (!currentUser) {
        console.log('没有currentUser，跳过');
        return;
    }
    
    console.log('使用本地用户数据:', currentUser.username);
    updateUIWithUser(currentUser);
}

// 🎯 修改6：修改logout函数（添加确认）
function logout() {
    console.log('logout函数被调用');
    
    if (confirm('确定要退出登录吗？')) {
        // 🆕 停止SignalR连接
        if (signalRConnection) {
            signalRConnection.stop();
            signalRConnection = null;
        }
        
        localStorage.removeItem('palace_user');
        localStorage.removeItem('palace_token');
        console.log('已清除登录数据');
        window.location.href = 'index.html';
    } else {
        console.log('用户取消退出');
    }
}

// 🎯 更新UI函数
function updateUIWithUser(user) {
    console.log('updateUIWithUser被调用，用户:', user.username);
    
    try {
        const avatarElement = document.getElementById('userAvatar');
        if (avatarElement) {
            avatarElement.textContent = user.avatar || '👤';
        }
        
        const nameElement = document.getElementById('userName');
        if (nameElement) {
            nameElement.textContent = user.username || '未知用户';
        }
        
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
        }
        
        const goldElement = document.getElementById('userGold');
        if (goldElement) {
            goldElement.textContent = user.items?.gold || 0;
        }
        
        const flowersElement = document.getElementById('userFlowers');
        if (flowersElement) {
            flowersElement.textContent = user.items?.flowers || 0;
        }
        
        console.log('✅ UI更新完成');
        
    } catch (error) {
        console.error('更新UI时出错:', error);
    }
}

// ==================== SignalR实时聊天系统 ====================

// 🆕 启动聊天系统（SignalR版）
async function startChatSystem() {
    console.log('启动SignalR聊天系统...');
    
    // 1. 先加载历史消息（只加载一次）
    await loadChatMessages();
    
    // 2. 启动SignalR实时连接
    await initializeSignalR();
}

// 🆕 初始化SignalR连接
async function initializeSignalR() {
    if (!currentUser || !currentUser.id) {
        console.log('用户未登录，跳过SignalR初始化');
        return false;
    }
    
    try {
        console.log('正在连接SignalR...');
        
        // 1. 获取协商信息
        const negotiateResponse = await fetch(`${API_BASE}/negotiate`, {
    method: 'POST',  // 🎯 添加这行
    headers: {
        'Content-Type': 'application/json'
    }
});
        if (!negotiateResponse.ok) {
            throw new Error(`协商失败: ${negotiateResponse.status}`);
        }
        
        const connectionInfo = await negotiateResponse.json();
        console.log('SignalR连接信息获取成功');
        
        // 2. 建立SignalR连接
        signalRConnection = new signalR.HubConnectionBuilder()
            .withUrl(connectionInfo.url, {
                accessTokenFactory: () => connectionInfo.accessToken
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: retryContext => {
                    if (retryContext.previousRetryCount < 3) return 2000;
                    if (retryContext.previousRetryCount < 10) return 5000;
                    return 10000;
                }
            })
            .configureLogging(signalR.LogLevel.Warning)
            .build();
        
        // 3. 监听新消息
        signalRConnection.on("ReceiveMessage", (message) => {
            console.log('📨 收到实时消息:', message.username, ':', message.content);
            addSingleMessage(message);
        });
        
        // 4. 监听连接状态
        signalRConnection.onclose(() => {
            console.log('SignalR连接关闭');
            isSignalRConnected = false;
        });
        
        signalRConnection.onreconnecting(() => {
            console.log('SignalR重连中...');
        });
        
        signalRConnection.onreconnected(() => {
            console.log('✅ SignalR重新连接成功');
            isSignalRConnected = true;
        });
        
        // 5. 启动连接
        await signalRConnection.start();
        isSignalRConnected = true;
        console.log('✅ SignalR连接成功！');
        
        // 显示连接成功提示
        showChatNotice('已连接到实时聊天服务器', 'success');
        
        return true;
        
    } catch (error) {
        console.error('❌ SignalR连接失败:', error);
        isSignalRConnected = false;
        
        // 显示连接失败提示
        showChatNotice('实时连接失败，使用普通模式', 'error');
        
        return false;
    }
}

// 🆕 发送消息函数（优化版）
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) {
        console.error('找不到聊天输入框');
        return;
    }
    
    const content = input.value.trim();
    
    if (!content) {
        showChatNotice('消息不能为空', 'system');
        return;
    }
    
    if (!currentUser || !currentUser.id) {
        showChatNotice('请先登录', 'error');
        return;
    }
    
    // 禁用输入框防止重复发送
    input.disabled = true;
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) sendBtn.disabled = true;
    
    try {
        console.log('正在发送消息:', content);
        
        // 🆕 本地立即显示（优化体验）
        const tempMessage = {
            id: `temp_${Date.now()}`,
            userId: currentUser.id,
            username: currentUser.username,
            userRole: currentUser.role,
            content: content,
            timestamp: new Date().toISOString()
        };
        addSingleMessage(tempMessage);
        
        // 发送到服务器
        const response = await fetch(`${API_BASE}/sendMessage`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id,
                username: currentUser.username,
                userRole: currentUser.role,
                content: content
            })
        });
        
        const responseText = await response.text();
        console.log('发送响应:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON解析失败:', parseError);
            showChatNotice('服务器响应异常', 'error');
            return;
        }
        
        if (result.success) {
            input.value = ''; // 清空输入框
            // 🆕 注意：不需要调用 loadChatMessages() 
            // 因为消息会通过SignalR推送回来
        } else {
            showChatNotice(`发送失败: ${result.message || '未知错误'}`, 'error');
            // 🆕 如果发送失败，移除临时消息
            removeTempMessage(tempMessage.id);
        }
        
    } catch (error) {
        console.error('网络请求失败:', error);
        showChatNotice('网络错误，请检查连接', 'error');
        removeTempMessage(`temp_${Date.now()}`);
    } finally {
        input.disabled = false;
        input.focus();
        const sendBtn = document.querySelector('.send-btn');
        if (sendBtn) sendBtn.disabled = false;
    }
}

// 🆕 移除临时消息（如果发送失败）
function removeTempMessage(messageId) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    const tempMsg = container.querySelector(`[data-temp-id="${messageId}"]`);
    if (tempMsg) {
        tempMsg.remove();
    }
}

// 🆕 添加单条消息到聊天框（用于SignalR推送）
function addSingleMessage(message) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    // 移除加载动画
    const loadingEl = container.querySelector('.loading');
    if (loadingEl) loadingEl.remove();
    
    // 判断是否是自己发的消息
    const isMine = currentUser && message.userId === currentUser.id;
    const badgeClass = getBadgeClass(message.userRole);
    const timeStr = formatMessageTime(message.timestamp);
    const roleTitle = getRoleTitle(message.userRole);
    
    const messageHTML = `
        <div class="message ${isMine ? 'mine' : ''}" ${message.id.startsWith('temp_') ? `data-temp-id="${message.id}"` : ''}>
            <div class="message-header">
                <span class="message-avatar">${getAvatarByRole(message.userRole)}</span>
                <span class="message-sender ${badgeClass}">${message.username}</span>
                <span class="message-role">${roleTitle}</span>
                <span class="message-time">${timeStr}</span>
            </div>
            <div class="message-content">${escapeHtml(message.content)}</div>
        </div>
    `;
    
    // 添加到聊天框底部
    container.insertAdjacentHTML('beforeend', messageHTML);
    
    // 自动滚动到底部
    container.scrollTop = container.scrollHeight;
}

// 🆕 加载历史消息（只加载一次）
async function loadChatMessages() {
    try {
        const timestamp = new Date().getTime(); // 防止缓存
        const response = await fetch(`${API_BASE}/getMessages?_=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // 更新在线人数
            const onlineCountEl = document.getElementById('onlineCount');
            if (onlineCountEl && result.onlineCount) {
                onlineCountEl.textContent = `${result.onlineCount}人在线`;
            }
            
            // 显示消息
            displayMessages(result.messages || []);
        } else {
            console.error('获取消息失败:', result.message);
        }
    } catch (error) {
        console.error('获取历史消息失败:', error);
    }
}

// 🆕 显示消息到聊天框（用于初始加载）
function displayMessages(messages) {
    const container = document.getElementById('chatMessages');
    if (!container) {
        console.error('找不到聊天消息容器');
        return;
    }
    
    // 移除加载动画
    const loadingEl = container.querySelector('.loading');
    if (loadingEl) loadingEl.remove();
    
    if (!messages || messages.length === 0) {
        if (!container.innerHTML.includes('欢迎')) {
            container.innerHTML = `
                <div class="message system">
                    <div class="message-content">
                        📢 宫廷实时聊天室已开启！
                    </div>
                </div>
            `;
        }
        return;
    }
    
    // 生成消息HTML
    let messagesHTML = '';
    
    messages.forEach(msg => {
        const isMine = currentUser && msg.userId === currentUser.id;
        const badgeClass = getBadgeClass(msg.userRole);
        const timeStr = formatMessageTime(msg.timestamp);
        const roleTitle = getRoleTitle(msg.userRole);
        
        messagesHTML += `
            <div class="message ${isMine ? 'mine' : ''}">
                <div class="message-header">
                    <span class="message-avatar">${getAvatarByRole(msg.userRole)}</span>
                    <span class="message-sender ${badgeClass}">${msg.username}</span>
                    <span class="message-role">${roleTitle}</span>
                    <span class="message-time">${timeStr}</span>
                </div>
                <div class="message-content">${escapeHtml(msg.content)}</div>
            </div>
        `;
    });
    
    container.innerHTML = messagesHTML;
    container.scrollTop = container.scrollHeight;
}

// 🆕 显示聊天提示
function showChatNotice(text, type = 'system') {
    console.log(`[${type}] ${text}`);
    
    const container = document.getElementById('chatMessages');
    if (container) {
        const noticeHTML = `
            <div class="message ${type}">
                <div class="message-content">📢 ${text}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', noticeHTML);
        container.scrollTop = container.scrollHeight;
    }
}

// ==================== 工具函数 ====================

function setupEventListeners() {
    console.log('setupEventListeners被调用');
    
    // 聊天输入框回车发送
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
    
    // 其他功能按钮的事件监听
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            const action = icon.className.split(' ')[1];
            btn.addEventListener('click', () => {
                showFeatureNotice(action);
            });
        }
    });
}

function showFeatureNotice(feature) {
    const featureNames = {
        'fa-archive': '物品库',
        'fa-users': '朝中同僚',
        'fa-tasks': '宫廷事务',
        'fa-gift': '赠送礼物',
        'fa-landmark': '宫殿巡视',
        'fa-trophy': '宫廷排行'
    };
    
    const name = featureNames[feature] || '该功能';
    showChatNotice(`${name}功能开发中...`, 'system');
}

function showInventory() { showFeatureNotice('fa-archive'); }
function showFriends() { showFeatureNotice('fa-users'); }
function showProfile() { showFeatureNotice('fa-user'); }
function sendMessage() { sendChatMessage(); } // 兼容原有调用

function isChatAtBottom(container) {
    const threshold = 50;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMessageTime(timestamp) {
    try {
        const date = new Date(timestamp);
        return date.getHours().toString().padStart(2, '0') + ':' + 
               date.getMinutes().toString().padStart(2, '0');
    } catch (e) {
        return '--:--';
    }
}

function getBadgeClass(role) {
    const badgeMap = {
        'emperor': 'emperor-badge',
        'concubine': 'concubine-badge', 
        'eunuch': 'eunuch-badge',
        'maid': 'maid-badge'
    };
    return badgeMap[role] || '';
}

function getAvatarByRole(role) {
    const avatarMap = {
        'emperor': '👑',
        'concubine': '👸',
        'eunuch': '👨‍💼', 
        'maid': '💁‍♀️'
    };
    return avatarMap[role] || '👤';
}

function getRoleTitle(role) {
    const titleMap = {
        'emperor': '皇帝',
        'concubine': '嫔妃',
        'eunuch': '太监',
        'maid': '宫女'
    };
    return titleMap[role] || '平民';
}

// 🎯 防止其他地方的跳转
window.addEventListener('error', (event) => {
    console.log('全局错误捕获:', event.message);
    return false;
});

window.addEventListener('unhandledrejection', (event) => {
    console.log('未处理的Promise rejection:', event.reason);
    event.preventDefault();
});

// 页面卸载时清理SignalR连接
window.addEventListener('beforeunload', () => {
    if (signalRConnection) {
        signalRConnection.stop();
    }
});

console.log('=== main.js加载完成 ===');

