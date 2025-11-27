// 全局变量
let currentBrand = 'fanuc';
let currentType = 'alarm';
let currentData = [];
let searchResult = null;
let dataCache = {};
let isAdmin = false;
const ADMIN_PASSWORD = 'robot123'; // 管理员密码
let viewCount = 0;
let searchCount = 0;
let userProvince = '未知';

// DOM 元素
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const brandSelect = document.getElementById('brand');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const adminPassword = document.getElementById('adminPassword');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const resultsSection = document.getElementById('resultsSection');
    const adminSection = document.getElementById('adminSection');
    const dataInfo = document.getElementById('dataInfo');
    
    // 评论相关元素
    const showCommentsBtn = document.getElementById('showCommentsBtn');
    const commentsSection = document.getElementById('commentsSection');
    const userName = document.getElementById('userName');
    const userProvinceInput = document.getElementById('userProvince');
    const userComment = document.getElementById('userComment');
    const submitComment = document.getElementById('submitComment');
    const commentsList = document.getElementById('commentsList');
    
    // 统计元素
    const viewCountElement = document.getElementById('viewCount');
    const searchCountElement = document.getElementById('searchCount');
    const footerViewCountElement = document.getElementById('footerViewCount');
    const footerSearchCountElement = document.getElementById('footerSearchCount');
    
    // 事件监听器
    brandSelect.addEventListener('change', handleBrandChange);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    searchBtn.addEventListener('click', performSearch);
    
    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabChange);
    });
    
    adminLoginBtn.addEventListener('click', handleAdminLogin);
    adminPassword.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleAdminLogin();
        }
    });
    
    logoutBtn.addEventListener('click', handleLogout);
    
    // 评论相关事件
    showCommentsBtn.addEventListener('click', toggleCommentsSection);
    submitComment.addEventListener('click', submitUserComment);
    
    // 添加一些延迟，确保DOM完全加载
    setTimeout(() => {
        // 初始化统计数据
        loadStatistics();
        
        // 增加浏览量
        incrementViewCount();
        
        // 获取用户位置信息
        getUserLocation();
        
        // 加载评论
        loadComments();
        
        // 设置评论同步
        setupCommentSync();
        
        // 设置定期同步
        setupPeriodicSync();
    }, 300);
    
    // 初始化页面
    initializePage();
});

// 初始化页面
async function initializePage() {
    // 加载所有品牌的数据
    await loadAllBrandData();
    
    // 显示默认品牌的数据
    await loadBrandData(currentBrand);
    
    // 更新数据统计信息（仅管理员可见）
    if (isAdmin) {
        updateDataStats();
    }
    
    // 初始不显示任何结果
    clearResults();
}

// 加载所有品牌数据
async function loadAllBrandData() {
    const brands = ['fanuc', 'kuka', 'abb', 'yaskawa'];
    const types = ['alarm', 'variable'];
    
    for (const brand of brands) {
        for (const type of types) {
            const cacheKey = `${brand}-${type}`;
            if (!dataCache[cacheKey]) {
                try {
                    dataCache[cacheKey] = await loadData(brand, type);
                } catch (error) {
                    console.error(`加载 ${brand} ${type} 数据失败:`, error);
                    // 创建空数据结构以防止错误
                    dataCache[cacheKey] = { brand, type, lastUpdated: '未知', data: [] };
                }
            }
        }
    }
}

// 加载特定品牌数据
async function loadBrandData(brand) {
    const cacheKey = `${brand}-${currentType}`;
    currentData = dataCache[cacheKey] ? dataCache[cacheKey].data : [];
    
    // 更新最后更新时间（仅管理员可见）
    if (isAdmin) {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (dataCache[cacheKey] && dataCache[cacheKey].lastUpdated) {
            lastUpdateElement.textContent = dataCache[cacheKey].lastUpdated;
        } else {
            lastUpdateElement.textContent = '未知';
        }
    }
}

// 加载数据
async function loadData(brand, type) {
    try {
        const response = await fetch(`data/${brand}-${type}.json`);
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`加载 ${brand}-${type} 数据失败:`, error);
        return { brand, type, lastUpdated: '未知', data: [] };
    }
}

// 品牌变更处理
function handleBrandChange() {
    currentBrand = document.getElementById('brand').value;
    loadBrandData(currentBrand).then(() => {
        clearResults();
    });
}

// 标签页切换处理
function handleTabChange(event) {
    // 更新标签页样式
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 更新当前数据类型
    currentType = event.target.dataset.tab;
    
    // 加载新数据
    loadBrandData(currentBrand).then(() => {
        clearResults();
    });
}

// 执行搜索（支持精确和模糊匹配）
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    
    // 如果搜索词为空，清空结果
    if (!searchTerm) {
        clearResults();
        return;
    }
    
    // 更新搜索次数
    incrementSearchCount();
    
    // 根据搜索类型执行搜索
    if (searchType === 'exact') {
        // 精确搜索
        const result = currentData.find(item => {
            if (currentType === 'alarm') {
                return item.code.toLowerCase() === searchTerm;
            } else {
                return item.number.toLowerCase() === searchTerm;
            }
        });
        
        searchResult = result;
        displayResult();
    } else {
        // 模糊搜索
        const results = currentData.filter(item => {
            if (currentType === 'alarm') {
                return item.code.toLowerCase().includes(searchTerm) || 
                       item.name.toLowerCase().includes(searchTerm) ||
                       item.description.toLowerCase().includes(searchTerm) ||
                       item.category.toLowerCase().includes(searchTerm);
            } else {
                return item.number.toLowerCase().includes(searchTerm) || 
                       item.name.toLowerCase().includes(searchTerm) ||
                       item.description.toLowerCase().includes(searchTerm) ||
                       item.category.toLowerCase().includes(searchTerm);
            }
        });
        
        // 限制最多显示3条结果
        searchResult = results.slice(0, 3);
        displayResults();
    }
}

// 显示单个结果
function displayResult() {
    const resultsContainer = document.getElementById('searchResults');
    const noResultsElement = document.getElementById('noResults');
    const resultsSection = document.getElementById('resultsSection');
    
    // 显示结果区域
    resultsSection.classList.remove('hidden');
    
    // 清空之前的结果
    resultsContainer.innerHTML = '';
    
    // 如果没有结果，显示无结果提示
    if (!searchResult) {
        resultsContainer.innerHTML = '';
        noResultsElement.classList.remove('hidden');
        return;
    }
    
    // 隐藏无结果提示
    noResultsElement.classList.add('hidden');
    
    // 创建并添加结果元素
    resultsContainer.appendChild(createResultElement(searchResult));
}

// 显示多个结果（模糊搜索）
function displayResults() {
    const resultsContainer = document.getElementById('searchResults');
    const noResultsElement = document.getElementById('noResults');
    const resultsSection = document.getElementById('resultsSection');
    
    // 显示结果区域
    resultsSection.classList.remove('hidden');
    
    // 清空之前的结果
    resultsContainer.innerHTML = '';
    
    // 如果没有结果，显示无结果提示
    if (!searchResult || searchResult.length === 0) {
        resultsContainer.innerHTML = '';
        noResultsElement.classList.remove('hidden');
        return;
    }
    
    // 隐藏无结果提示
    noResultsElement.classList.add('hidden');
    
    // 创建并添加结果元素
    searchResult.forEach(item => {
        resultsContainer.appendChild(createResultElement(item));
    });
}

// 清空结果
function clearResults() {
    const resultsContainer = document.getElementById('searchResults');
    const noResultsElement = document.getElementById('noResults');
    const resultsSection = document.getElementById('resultsSection');
    
    // 清空结果区域
    resultsContainer.innerHTML = '';
    noResultsElement.classList.add('hidden');
    resultsSection.classList.add('hidden');
    
    searchResult = null;
}

// 创建结果元素
function createResultElement(item) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-item';
    
    if (currentType === 'alarm') {
        resultDiv.innerHTML = `
            <div class="result-code">${item.code}</div>
            <div class="result-name">${item.name}</div>
            <div class="result-description">${item.description}</div>
            <div class="result-details">
                <div class="result-detail-item">
                    <span>类别:</span>
                    <span>${item.category}</span>
                </div>
            </div>
            <div class="result-solution">
                <strong>解决方案:</strong> ${item.solution}
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="result-code">${item.number}</div>
            <div class="result-name">${item.name}</div>
            <div class="result-description">${item.description}</div>
            <div class="result-details">
                <div class="result-detail-item">
                    <span>类别:</span>
                    <span>${item.category}</span>
                </div>
                ${item.unit ? `
                <div class="result-detail-item">
                    <span>单位:</span>
                    <span>${item.unit}</span>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    return resultDiv;
}

// 处理管理员登录
function handleAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('adminSection').classList.add('hidden');
        document.getElementById('dataInfo').classList.remove('hidden');
        updateDataStats();
    } else {
        alert('密码错误，请重新输入');
        document.getElementById('adminPassword').value = '';
    }
}

// 处理管理员登出
function handleLogout() {
    isAdmin = false;
    document.getElementById('dataInfo').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');
    document.getElementById('adminPassword').value = '';
}

// 更新数据统计
function updateDataStats() {
    if (!isAdmin) return;
    
    for (const brand of ['fanuc', 'kuka', 'abb', 'yaskawa']) {
        const alarmData = dataCache[`${brand}-alarm`] ? dataCache[`${brand}-alarm`].data.length : 0;
        const variableData = dataCache[`${brand}-variable`] ? dataCache[`${brand}-variable`].data.length : 0;
        
        document.getElementById(`${brand}-alarm-count`).textContent = alarmData;
        document.getElementById(`${brand}-variable-count`).textContent = variableData;
    }
}

// 获取共享数据
async function loadSharedData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/shanhaixiansheng/robot/main/data/shared-data.json?t=' + Date.now());
        if (!response.ok) {
            throw new Error('获取共享数据失败');
        }
        return await response.json();
    } catch (error) {
        console.error('获取共享数据失败:', error);
        // 如果获取失败，使用本地缓存
        return JSON.parse(localStorage.getItem('robotSharedData') || '{"comments":[],"viewCount":0,"searchCount":0}');
    }
}

// 更新共享数据（这需要通过GitHub API）
async function updateSharedData(data) {
    // 存储到本地缓存
    localStorage.setItem('robotSharedData', JSON.stringify(data));
    // 注意：实际更新GitHub需要API密钥，这里只是模拟
    console.log('共享数据已更新到本地缓存');
}

// 统计相关函数
async function loadStatistics() {
    try {
        // 尝试从共享数据加载
        const sharedData = await loadSharedData();
        
        // 从localStorage加载本地数据
        const localViewCount = parseInt(localStorage.getItem('viewCount') || '0');
        const localSearchCount = parseInt(localStorage.getItem('searchCount') || '0');
        
        // 使用共享数据作为基础，加上本地增量
        viewCount = sharedData.viewCount + localViewCount;
        searchCount = sharedData.searchCount + localSearchCount;
        
        console.log('加载统计数据 - 浏览量:', viewCount, '查询次数:', searchCount);
        
        // 使用延迟确保DOM元素已加载
        setTimeout(updateStatisticsDisplay, 100);
    } catch (error) {
        console.error('加载统计数据失败:', error);
        // 如果加载失败，使用本地缓存
        viewCount = parseInt(localStorage.getItem('viewCount') || '0');
        searchCount = parseInt(localStorage.getItem('searchCount') || '0');
        setTimeout(updateStatisticsDisplay, 100);
    }
}

function updateStatisticsDisplay() {
    // 确保元素存在
    const viewCountElement = document.getElementById('viewCount');
    const searchCountElement = document.getElementById('searchCount');
    const footerViewCountElement = document.getElementById('footerViewCount');
    const footerSearchCountElement = document.getElementById('footerSearchCount');
    
    // 更新页面中的统计显示
    if (viewCountElement) {
        viewCountElement.textContent = viewCount;
        console.log('更新浏览量显示:', viewCount);
    } else {
        console.error('无法找到viewCount元素');
    }
    
    if (searchCountElement) {
        searchCountElement.textContent = searchCount;
        console.log('更新查询次数显示:', searchCount);
    } else {
        console.error('无法找到searchCount元素');
    }
    
    if (footerViewCountElement) {
        footerViewCountElement.textContent = viewCount;
    } else {
        console.error('无法找到footerViewCount元素');
    }
    
    if (footerSearchCountElement) {
        footerSearchCountElement.textContent = searchCount;
    } else {
        console.error('无法找到footerSearchCount元素');
    }
}

function incrementViewCount() {
    // 增加本地浏览量
    const localViewCount = parseInt(localStorage.getItem('viewCount') || '0');
    localStorage.setItem('viewCount', (localViewCount + 1).toString());
    
    // 更新总浏览量
    viewCount++;
    console.log('浏览量增加:', viewCount);
    updateStatisticsDisplay();
    
    // 定期将本地数据同步到共享存储
    syncStatsToShared();
}

function incrementSearchCount() {
    // 增加本地查询次数
    const localSearchCount = parseInt(localStorage.getItem('searchCount') || '0');
    localStorage.setItem('searchCount', (localSearchCount + 1).toString());
    
    // 更新总查询次数
    searchCount++;
    console.log('查询次数增加:', searchCount);
    updateStatisticsDisplay();
    
    // 定期将本地数据同步到共享存储
    syncStatsToShared();
}

// 同步统计数据到共享存储（模拟）
async function syncStatsToShared() {
    // 注意：实际应用中，这里应该调用GitHub API更新shared-data.json
    // 但由于CORS限制和安全考虑，我们只能模拟这个过程
    
    // 获取当前共享数据
    try {
        const sharedData = await loadSharedData();
        
        // 更新统计数据
        sharedData.viewCount += 1; // 只增加1次，因为我们是在用户访问时调用
        sharedData.searchCount = parseInt(localStorage.getItem('searchCount') || '0');
        sharedData.lastUpdated = new Date().toISOString();
        
        // 保存到本地缓存
        await updateSharedData(sharedData);
    } catch (error) {
        console.error('同步统计数据失败:', error);
    }
}

// 获取用户位置信息
function getUserLocation() {
    // 使用IP地址获取省份信息
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            if (data.region) {
                userProvince = data.region;
                document.getElementById('userProvince').value = userProvince;
            }
        })
        .catch(error => {
            console.error('获取位置信息失败:', error);
            // 如果获取失败，使用备用API
            fetch('https://api.ip.sb/geoip')
                .then(response => response.json())
                .then(data => {
                    if (data.region) {
                        userProvince = data.region;
                        document.getElementById('userProvince').value = userProvince;
                    }
                })
                .catch(err => {
                    console.error('备用位置API也失败:', err);
                });
        });
}

// 脏话过滤
const forbiddenWords = [
    '妈的', '傻逼', '神经病', '他妈', '草', '操', '日', 'bitch', 'fuck', '傻', '蠢', 
    '死', '滚', '废物', '垃圾', '白痴', '混蛋', '狗屎', '王八', '靠', '我操',
    '婊子', '贱人', '妈了个逼', '妈了个b', '妈了个B', '妈了个屄', '妈了隔壁'
];

function containsForbiddenWords(text) {
    const lowerText = text.toLowerCase();
    for (const word of forbiddenWords) {
        if (lowerText.includes(word.toLowerCase())) {
            return true;
        }
    }
    return false;
}

// 评论相关函数
function toggleCommentsSection() {
    console.log('切换评论区显示状态');
    const commentsSection = document.getElementById('commentsSection');
    if (commentsSection) {
        commentsSection.classList.toggle('hidden');
        console.log('评论区显示状态切换:', !commentsSection.classList.contains('hidden'));
        // 显示评论区时重新加载评论
        if (!commentsSection.classList.contains('hidden')) {
            loadComments();
        }
    } else {
        console.error('无法找到评论区元素');
    }
}

async function submitUserComment() {
    const userNameElement = document.getElementById('userName');
    const userCommentElement = document.getElementById('userComment');
    
    if (!userNameElement || !userCommentElement) {
        console.error('无法找到评论表单元素');
        return;
    }
    
    const userName = userNameElement.value.trim();
    const userCommentText = userCommentElement.value.trim();
    
    if (!userName || !userCommentText) {
        alert('请填写昵称和评论内容');
        return;
    }
    
    // 检查用户名和评论内容是否包含脏话
    if (containsForbiddenWords(userName)) {
        alert('昵称中包含不当言论，请修改后重新提交');
        return;
    }
    
    if (containsForbiddenWords(userCommentText)) {
        alert('评论内容中包含不当言论，请修改后重新提交');
        return;
    }
    
    // 显示同步状态
    showSyncStatus('正在同步评论...');
    
    const comment = {
        name: userName,
        province: userProvince,
        text: userCommentText,
        time: new Date().toLocaleString(),
        id: Date.now().toString() // 添加唯一ID
    };
    
    // 获取当前共享数据
    const sharedData = await loadSharedData();
    
    // 添加新评论
    sharedData.comments.unshift(comment);
    
    // 限制评论数量最多保留50条
    if (sharedData.comments.length > 50) {
        sharedData.comments.splice(50);
    }
    
    // 更新时间戳
    sharedData.lastUpdated = new Date().toISOString();
    
    // 保存到本地缓存
    await updateSharedData(sharedData);
    
    // 同时保存到localStorage作为备份
    localStorage.setItem('robotComments', JSON.stringify(sharedData.comments));
    localStorage.setItem('robotCommentsUpdated', Date.now().toString());
    
    // 清空表单
    userNameElement.value = '';
    userCommentElement.value = '';
    
    // 延迟重新加载评论，让用户看到同步效果
    setTimeout(() => {
        loadComments();
        showSyncStatus('评论同步成功！');
    }, 1500);
}

async function loadComments() {
    try {
        // 尝试从GitHub加载共享评论
        const sharedData = await loadSharedData();
        const comments = sharedData.comments || [];
        
        const commentsList = document.getElementById('commentsList');
        
        if (!commentsList) {
            console.error('无法找到评论列表元素');
            return;
        }
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p>暂无评论，快来发表第一条评论吧！</p>';
            return;
        }
        
        // 添加同步提示
        if (window.lastCommentCount !== undefined && window.lastCommentCount !== comments.length) {
            showSyncStatus(`发现 ${comments.length - window.lastCommentCount} 条新评论`);
        }
        window.lastCommentCount = comments.length;
        
        commentsList.innerHTML = '';
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment-item';
            commentElement.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${comment.name}</span>
                    <span class="comment-province">${comment.province}</span>
                    <span class="comment-time">${comment.time}</span>
                </div>
                <div class="comment-content">${comment.text}</div>
            `;
            commentsList.appendChild(commentElement);
        });
    } catch (error) {
        console.error('加载评论失败:', error);
        // 如果加载失败，显示错误信息
        const commentsList = document.getElementById('commentsList');
        if (commentsList) {
            commentsList.innerHTML = '<p>加载评论失败，请刷新页面重试。</p>';
        }
    }
}

// 监听评论更新
function setupCommentSync() {
    // 定期检查更新
    setInterval(async () => {
        try {
            // 每次显示评论区时重新加载评论
            const commentsSection = document.getElementById('commentsSection');
            if (commentsSection && !commentsSection.classList.contains('hidden')) {
                showSyncStatus('正在检查新评论...');
                await loadComments();
                showSyncStatus('评论检查完成');
            }
        } catch (error) {
            console.error('评论同步检查失败:', error);
            showSyncStatus('评论检查失败');
        }
    }, 15000); // 每15秒检查一次，更频繁
}

// 显示同步状态
function showSyncStatus(message) {
    const statusElement = document.getElementById('syncStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.display = 'block';
        
        // 重新触发动画
        statusElement.style.animation = 'none';
        statusElement.offsetHeight; // 触发重排
        statusElement.style.animation = 'fadeOut 3s forwards';
        
        // 3秒后隐藏状态信息
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }
}

// 设置定期同步
function setupPeriodicSync() {
    // 定期重新加载统计数据
    setInterval(async () => {
        try {
            showSyncStatus('正在同步数据...');
            await loadStatistics();
            showSyncStatus('数据同步完成');
        } catch (error) {
            console.error('定期同步统计数据失败:', error);
            showSyncStatus('数据同步失败');
        }
    }, 60000); // 每分钟更新一次统计数据
    
    // 立即执行一次同步
    setTimeout(async () => {
        try {
            showSyncStatus('正在同步评论和统计数据...');
            await loadStatistics();
            await loadComments();
            showSyncStatus('初始数据同步完成');
        } catch (error) {
            console.error('初始同步失败:', error);
            showSyncStatus('初始数据同步失败');
        }
    }, 2000);
}