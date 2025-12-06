// 主页面JavaScript
const API_BASE = 'https://imperial-palace-func-chan-h6g7e7emdnc0h4hu.japaneast-01.azurewebsites.net/api';
let currentUser = null;
let chatMessages = [];

// 页面加载初始化
window.addEventListener('DOMContentLoaded', async () => {


    console.log('checkLoginStatus');
    
    // 检查登录状态
    await checkLoginStatus();


    console.log('loadUserInfo');
    
    // 加载用户信息
    // await loadUserInfo();
    
    // 加载聊天记录
    await loadChatMessages();

 console.log('loadChatMessages');
    
    // 设置事件监听
    setupEventListeners();
    
    // 开始心跳（保持在线状态）
    startHeartbeat();

console.log('startHeartbeat');
    
});


// 修改检查登录状态函数
async function checkLoginStatus() {
    const user = localStorage.getItem('palace_user');
    const token = localStorage.getItem('palace_token');
    
    if (!user || !token) {
        console.log('未找到用户信息，跳转到登录页');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(user);
        console.log('从localStorage加载用户:', currentUser.username);
        updateUIWithUser(currentUser);
        
        // 尝试验证token（可选）
        // await validateToken(token);
        
    } catch (error) {
        console.error('解析用户信息失败:', error);
        logout();
    }
}

// 可选：添加token验证函数
async function validateToken(token) {
    try {
        // 简单的token验证（可以根据需要实现）
        if (!token || !token.startsWith('palace-token-')) {
            throw new Error('无效的token格式');
        }
        return true;
    } catch (error) {
        console.log('token验证失败:', error.message);
        logout();
    }
}


// // 检查登录状态
// async function checkLoginStatus() {
//     const user = localStorage.getItem('palace_user');
//     const token = localStorage.getItem('palace_token');
    
//     if (!user || !token) {
//         window.location.href = 'index.html';
//         return;
//     }
    
//     try {
//         currentUser = JSON.parse(user);
//         updateUIWithUser(currentUser);
//     } catch (error) {
//         console.error('解析用户信息失败:', error);
//         logout();
//     }
// }

// 加载用户信息
async function loadUserInfo() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE}/getUser?id=${currentUser.id}`, {
            headers: {
                'Authorization': localStorage.getItem('palace_token')
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentUser = data.user;
                localStorage.setItem('palace_user', JSON.stringify(currentUser));
                updateUIWithUser(currentUser);
            }
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
    }
}

// 更新UI显示用户信息
function updateUIWithUser(user) {
    document.getElementById('userAvatar').textContent = user.avatar || '👤';
    document.getElementById('userName').textContent = user.username || '未知用户';
    document.getElementById('userRole').textContent = `${getRoleTitle(user.role)} • 等级 ${user.level || 1}`;
    document.getElementById('userLevel').textContent = user.level || 1;
    document.getElementById('userGold').textContent = user.items?.gold || 0;
    document.getElementById('userFlowers').textContent = user.items?.flowers || 0;
}

// 获取角色标题
function getRoleTitle(role) {
    const titles = {
        emperor: '皇帝',
        concubine: '嫔妃',
        eunuch: '太监',
        maid: '宫女'
    };
    return titles[role] || role;
}

// 加载聊天记录
async function loadChatMessages() {
    const chatContainer = document.getElementById('chatMessages');
    chatContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 加载聊天记录...</div>';
    
    try {
        // 模拟聊天记录
        const mockMessages = [
            {
                id: '1',
                type: 'system',
                content: '欢迎来到宫廷聊天室！',
                timestamp: new Date().toISOString()
            },
            {
                id: '2',
                type: 'system',
                content: '在这里可以与其他宫廷成员交流',
                timestamp: new Date().toISOString()
            }
        ];
        
        chatMessages = mockMessages;
        renderChatMessages();
        
        // 设置在线人数
        document.getElementById('onlineCount').textContent = '3人在线';
        
    } catch (error) {
        console.error('加载聊天失败:', error);
        chatContainer.innerHTML = '<div class="loading">聊天加载失败</div>';
    }
}

// 渲染聊天消息
function renderChatMessages() {
    const chatContainer = document.getElementById('chatMessages');
    chatContainer.innerHTML = '';
    
    if (chatMessages.length === 0) {
        chatContainer.innerHTML = '<div class="loading">暂无聊天记录</div>';
        return;
    }
    
    chatMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.type}`;
        
        let headerHTML = '';
        let contentHTML = '';
        
        if (msg.type === 'system') {
            headerHTML = `
                <div class="message-header">
                    <div class="message-avatar">📢</div>
                    <div class="message-sender">系统公告</div>
                    <div class="message-time">${formatTime(msg.timestamp)}</div>
                </div>
            `;
            contentHTML = `<div class="message-content">${msg.content}</div>`;
        } else if (msg.type === 'decree') {
            headerHTML = `
                <div class="message-header">
                    <div class="message-avatar">👑</div>
                    <div class="message-sender">圣旨</div>
                    <div class="message-time">${formatTime(msg.timestamp)}</div>
                </div>
            `;
            contentHTML = `<div class="message-content" style="color: #8b4513;"><strong>${msg.content}</strong></div>`;
        } else {
            // 用户消息
            headerHTML = `
                <div class="message-header">
                    <div class="message-avatar">${msg.senderAvatar || '👤'}</div>
                    <div class="message-sender">${msg.senderName || '未知用户'}</div>
                    <div class="message-role ${msg.senderRole}-badge">${getRoleTitle(msg.senderRole)}</div>
                    <div class="message-time">${formatTime(msg.timestamp)}</div>
                </div>
            `;
            contentHTML = `<div class="message-content">${msg.content}</div>`;
        }
        
        messageDiv.innerHTML = headerHTML + contentHTML;
        chatContainer.appendChild(messageDiv);
    });
    
    // 滚动到底部
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 发送消息
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    
    if (!content) {
        showMessage('请输入消息内容', 'error');
        return;
    }
    
    if (!currentUser) {
        showMessage('请先登录', 'error');
        return;
    }
    
    try {
        // 创建消息对象
        const newMessage = {
            id: `msg_${Date.now()}`,
            type: 'user',
            senderId: currentUser.id,
            senderName: currentUser.username,
            senderAvatar: currentUser.avatar,
            senderRole: currentUser.role,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        // 添加到本地列表
        chatMessages.push(newMessage);
        renderChatMessages();
        
        // 清空输入框
        input.value = '';
        
        // 模拟发送到服务器
        setTimeout(() => {
            // 这里实际应该调用API保存到数据库
            console.log('消息发送:', content);
        }, 100);
        
    } catch (error) {
        console.error('发送消息失败:', error);
        showMessage('发送失败', 'error');
    }
}

// 刷新聊天
function refreshChat() {
    showMessage('刷新聊天记录...', 'info');
    loadChatMessages();
}

// 显示模态框
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

// 关闭模态框
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 显示个人档案
function showProfileModal() {
    if (!currentUser) return;
    
    const profileContent = document.getElementById('profileContent');
    profileContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 10px;">${currentUser.avatar}</div>
            <h3 style="margin: 5px 0;">${currentUser.username}</h3>
            <div style="background: #f0f0f0; padding: 5px 10px; border-radius: 10px; display: inline-block;">
                ${getRoleTitle(currentUser.role)}
            </div>
        </div>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <h4><i class="fas fa-chart-line"></i> 基本信息</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                <div>等级: <strong>${currentUser.level || 1}</strong></div>
                <div>经验: <strong>${currentUser.experience || 0}</strong></div>
                <div>语言: <strong>${currentUser.language === 'zh-CN' ? '中文' : currentUser.language}</strong></div>
                <div>加入时间: <strong>${formatDate(currentUser.createdAt)}</strong></div>
            </div>
        </div>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 10px;">
            <h4><i class="fas fa-trophy"></i> 成就</h4>
            <div style="margin-top: 10px;">
                ${(currentUser.achievements || ['初入宫廷']).map(ach => 
                    `<div style="background: #e8f4fd; padding: 8px; border-radius: 8px; margin-bottom: 5px;">
                        <i class="fas fa-award" style="color: gold;"></i> ${ach}
                    </div>`
                ).join('')}
            </div>
        </div>
    `;
    
    showModal('profileModal');
}

// 显示物品库
function showInventoryModal() {
    if (!currentUser) return;
    
    const inventoryContent = document.getElementById('inventoryContent');
    const items = currentUser.items || {};
    
    const itemsList = [
        { icon: '💰', name: '黄金', key: 'gold', value: items.gold || 0 },
        { icon: '🌸', name: '鲜花', key: 'flowers', value: items.flowers || 0 },
        { icon: '💎', name: '玉佩', key: 'jade', value: items.jade || 0 },
        { icon: '🍵', name: '茶叶', key: 'tea', value: items.tea || 0 },
        { icon: '📜', name: '卷轴', key: 'scroll', value: items.scroll || 0 },
        { icon: '🐉', name: '龙鳞', key: 'dragon_scale', value: items.dragon_scale || 0 },
        { icon: '💄', name: '香料', key: 'perfume', value: items.perfume || 0 }
    ];
    
    inventoryContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h4><i class="fas fa-archive"></i> 我的物品</h4>
            <p style="color: #666;">总共 ${Object.keys(items).length} 种物品</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            ${itemsList.map(item => `
                <div style="background: white; border: 2px solid #f0f0f0; border-radius: 10px; padding: 15px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 5px;">${item.icon}</div>
                    <div style="font-weight: bold; margin-bottom: 5px;">${item.name}</div>
                    <div style="font-size: 18px; color: #d4a017;">${item.value}</div>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f8f8f8; border-radius: 10px;">
            <h5><i class="fas fa-lightbulb"></i> 物品说明</h5>
            <p style="font-size: 12px; color: #666; margin-top: 5px;">
                黄金：宫廷通用货币<br>
                鲜花：提升关系值<br>
                玉佩：珍贵礼物<br>
                茶叶：日常消耗品<br>
                卷轴：记载宫廷秘闻<br>
                龙鳞：皇帝专属物品<br>
                香料：嫔妃专属物品
            </p>
        </div>
    `;
    
    showModal('inventoryModal');
}

// 显示好友列表
function showFriendsModal() {
    showMessage('好友功能开发中...', 'info');
}

// 显示任务列表
function showTasksModal() {
    showMessage('宫廷事务功能开发中...', 'info');
}

// 显示礼物赠送
function showGiftModal() {
    showMessage('礼物功能开发中...', 'info');
}

// 显示宫殿巡视
function showPalaceModal() {
    showMessage('宫殿巡视功能开发中...', 'info');
}

// 显示排行榜
function showRankingModal() {
    showMessage('排行榜功能开发中...', 'info');
}

// 设置事件监听器
function setupEventListeners() {
    // 回车发送消息
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 点击模态框背景关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// 心跳函数（保持在线）
function startHeartbeat() {
    setInterval(async () => {
        if (currentUser) {
            try {
                // 更新最后活动时间
                await fetch(`${API_BASE}/updateActivity`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('palace_token')
                    },
                    body: JSON.stringify({
                        userId: currentUser.id
                    })
                });
            } catch (error) {
                console.error('心跳失败:', error);
            }
        }
    }, 60000); // 每分钟一次
}

// 显示消息提示
function showMessage(message, type = 'info') {
    alert(`${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'} ${message}`);
}

// 格式化时间
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// 格式化日期
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('zh-CN');
}

// 退出登录
function logout() {
    localStorage.removeItem('palace_user');
    localStorage.removeItem('palace_token');
    window.location.href = 'index.html';
}

// 全局导出函数供HTML调用
window.showProfileModal = showProfileModal;
window.showInventoryModal = showInventoryModal;
window.showFriendsModal = showFriendsModal;
window.showTasksModal = showTasksModal;
window.showGiftModal = showGiftModal;
window.showPalaceModal = showPalaceModal;
window.showRankingModal = showRankingModal;
window.refreshChat = refreshChat;
window.sendMessage = sendMessage;
window.logout = logout;

window.closeModal = closeModal;

