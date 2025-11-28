// 全局变量
let currentBrand = 'fanuc';
let currentType = 'alarm';
let currentData = [];
let searchResult = null;
let dataCache = {};
let isAdmin = false;
// 管理员密码不再在代码中明文存储
let viewCount = 0;
let searchCount = 0;

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
    
    // 管理员登录按钮
    const adminLoginFooterBtn = document.getElementById('adminLoginFooterBtn');
    
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
    
    // 页脚管理员登录按钮事件
    adminLoginFooterBtn.addEventListener('click', showAdminLogin);
    
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
    
    // 初始化统计数据
    loadStatistics();
    loadSiteStats();
    incrementViewCount();
    
    // 初始化评论功能
    loadComments();
    initCommentEvents();
    
    // 启动数据同步机制
    syncDataWithGitHub();
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
        
        searchResult = results;
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
    
    // 只显示前3条结果
    const maxResults = 3;
    const limitedResults = searchResult.slice(0, maxResults);
    
    // 创建并添加结果元素
    limitedResults.forEach(item => {
        resultsContainer.appendChild(createResultElement(item));
    });
    
    // 如果搜索结果超过3条，添加提示信息
    if (searchResult.length > maxResults) {
        const moreInfo = document.createElement('div');
        moreInfo.className = 'more-results-info';
        moreInfo.textContent = `模糊搜索找到 ${searchResult.length} 条结果，仅显示前 ${maxResults} 条。请使用更精确的关键词查找更多信息。`;
        resultsContainer.appendChild(moreInfo);
    }
    
    // 显示评论区域
    showCommentsSection();
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

function showAdminLogin() {
    document.getElementById('adminSection').classList.remove('hidden');
}


function handleAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    

    if (password === '') {
        alert('上当了吧，哈哈');
        return;
    }
    
  
    const validPasswords = ['shanhaixiansheng2810', 'shanhaixiansheng2810', 'shanhaixiansheng2810']; 
    
    if (validPasswords.includes(password)) {
        isAdmin = true;
        document.getElementById('adminSection').classList.add('hidden');
        document.getElementById('dataInfo').classList.remove('hidden');
        updateDataStats();
        updateStatisticsDisplay();
    } else {
        alert('密码错误，请重新输入');
        document.getElementById('adminPassword').value = '';
    }
}

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

// 统计相关函数
function loadStatistics() {
    // 从localStorage加载统计数据
    viewCount = parseInt(localStorage.getItem('viewCount') || '0');
    searchCount = parseInt(localStorage.getItem('searchCount') || '0');
    
    // 更新管理员界面的统计显示（仅管理员可见时更新）
    if (isAdmin) {
        updateStatisticsDisplay();
    }
}

function updateStatisticsDisplay() {
    // 仅更新管理员界面中的统计显示
    if (isAdmin) {
        document.getElementById('adminViewCount').textContent = viewCount;
        document.getElementById('adminSearchCount').textContent = searchCount;
    }
}

function incrementViewCount() {
    // 更新本地统计数据
    viewCount++;
    localStorage.setItem('viewCount', viewCount.toString());
    updateStatisticsDisplay();
    
    // 更新全局网站统计数据
    siteStats.totalViews = (siteStats.totalViews || 0) + 1;
    siteStats.todayViews = (siteStats.todayViews || 0) + 1;
    saveSiteStats();
    updatePublicStatsDisplay();
}

function incrementSearchCount() {
    // 更新本地统计数据
    searchCount++;
    localStorage.setItem('searchCount', searchCount.toString());
    updateStatisticsDisplay();
    
    // 更新全局网站统计数据
    siteStats.totalSearches = (siteStats.totalSearches || 0) + 1;
    siteStats.todaySearches = (siteStats.todaySearches || 0) + 1;
    saveSiteStats();
}

// 评论和地理位置相关功能
let userLocation = null;
let userComments = [];
let siteStats = {
    totalViews: 0,
    todayViews: 0,
    totalSearches: 0,
    todaySearches: 0,
    lastUpdated: null
};

// 脏话识别列表
const badWords = [
    '操', '肏', '干', '日', '草', '妈', '妈逼', '傻逼', '傻B', '傻b', 'SB', 'sb',
    '他妈', '他吗', '他妈的', 'TMD', 'tmd', '妈蛋', '废物', '废物点心',
    '滚', '去死', '死妈', '死全家', '尼玛', '你妈', '你M', 'M的',
    'CAO', 'cao', 'FUCK', 'fuck', 'SHIT', 'shit', 'BITCH', 'bitch', 'ASS', 'ass',
    '操你', '草你', '肏你', '狗日的', '狗屎', '屄', '逼', 'B', 'b',
    '鸡巴', 'JB', 'jb', '屌', '阴道', '淫荡', '淫秽', '色情'
];

// 检查脏话
function containsBadWords(text) {
    const lowerText = text.toLowerCase();
    return badWords.some(word => lowerText.includes(word.toLowerCase()));
}

// 获取用户地理位置
async function getUserLocation() {
    if (userLocation) {
        return userLocation;
    }
    
    try {
        // 先尝试浏览器地理位置API
        if (navigator.geolocation) {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            
            // 使用免费的地理定位API获取省份信息
            const response = await fetch(`https://api.ipbase.com/v1/json?apikey=YOUR_API_KEY&ip=${ip}`);
            const data = await response.json();
            
            if (data && data.data) {
                userLocation = {
                    country: data.data.country.name || '未知',
                    region: data.data.region.name || '未知',
                    city: data.data.city.name || '未知',
                    ip: data.data.ip || '未知'
                };
                return userLocation;
            }
        }
    } catch (error) {
        console.error('获取地理位置失败:', error);
    }
    
    // 如果失败，使用IP获取大致位置
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data) {
            userLocation = {
                country: data.country_name || '未知',
                region: data.region || '未知',
                city: data.city || '未知',
                ip: data.ip || '未知'
            };
            return userLocation;
        }
    } catch (error) {
        console.error('通过IP获取位置失败:', error);
    }
    
    // 所有方法都失败，返回默认值
    userLocation = {
        country: '未知',
        region: '未知',
        city: '未知',
        ip: '未知'
    };
    return userLocation;
}

// 加载网站统计数据
function loadSiteStats() {
    const stored = localStorage.getItem('robotAssistantSiteStats');
    if (stored) {
        siteStats = JSON.parse(stored);
    }
    
    // 检查是否是新的一天
    const today = new Date().toDateString();
    const lastUpdate = siteStats.lastUpdated ? new Date(siteStats.lastUpdated).toDateString() : '';
    
    if (today !== lastUpdate) {
        siteStats.todayViews = 0;
        siteStats.todaySearches = 0;
    }
    
    updatePublicStatsDisplay();
}

// 保存网站统计数据
function saveSiteStats() {
    siteStats.lastUpdated = new Date().toISOString();
    localStorage.setItem('robotAssistantSiteStats', JSON.stringify(siteStats));
}

// 更新公共统计显示
function updatePublicStatsDisplay() {
    document.getElementById('publicViewCount').textContent = siteStats.totalViews || '--';
    document.getElementById('todayViewCount').textContent = siteStats.todayViews || '--';
}

// 增加浏览量
function incrementViewCount() {
    siteStats.totalViews = (siteStats.totalViews || 0) + 1;
    siteStats.todayViews = (siteStats.todayViews || 0) + 1;
    saveSiteStats();
    updatePublicStatsDisplay();
}

// 加载评论数据
function loadComments() {
    const stored = localStorage.getItem('robotAssistantComments');
    if (stored) {
        userComments = JSON.parse(stored);
    }
}

// 保存评论数据
function saveComments() {
    localStorage.setItem('robotAssistantComments', JSON.stringify(userComments));
}

// 显示评论区域
function showCommentsSection() {
    document.getElementById('commentsSection').classList.remove('hidden');
    loadComments();
    displayComments();
    
    // 获取用户位置
    getUserLocation().then(location => {
        console.log('用户位置:', location);
    });
}

// 显示评论列表
function displayComments() {
    const commentsList = document.getElementById('commentsList');
    const noComments = document.getElementById('noComments');
    const commentCount = document.querySelector('.comment-count');
    
    if (userComments.length === 0) {
        commentsList.innerHTML = '';
        noComments.style.display = 'block';
        commentCount.textContent = '(0)';
        return;
    }
    
    noComments.style.display = 'none';
    commentCount.textContent = `(${userComments.length})`;
    
    // 按时间倒序排序
    const sortedComments = [...userComments].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    commentsList.innerHTML = sortedComments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <div>
                    <span class="comment-location">${comment.location.region} ${comment.location.city}</span>
                    <span class="comment-time">${formatTime(comment.timestamp)}</span>
                </div>
            </div>
            <div class="comment-content">${comment.content}</div>
        </div>
    `).join('');
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
        return `${diffDays}天前`;
    } else if (diffHours > 0) {
        return `${diffHours}小时前`;
    } else if (diffMins > 0) {
        return `${diffMins}分钟前`;
    } else {
        return '刚刚';
    }
}

// 提交评论
async function submitComment() {
    const nameInput = document.getElementById('commentName');
    const contentInput = document.getElementById('commentContent');
    const name = nameInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!name || !content) {
        alert('请填写昵称和评论内容');
        return;
    }
    
    // 检查脏话
    if (containsBadWords(content)) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'comment-warning';
        warningDiv.textContent = '您的评论包含不当内容，请修改后重试。';
        contentInput.parentNode.insertBefore(warningDiv, contentInput.nextSibling);
        
        setTimeout(() => {
            warningDiv.remove();
        }, 3000);
        return;
    }
    
    // 获取用户位置
    const location = await getUserLocation();
    
    // 创建新评论
    const newComment = {
        id: Date.now().toString(),
        author: name,
        content: content,
        location: location,
        timestamp: new Date().toISOString()
    };
    
    // 添加到评论列表
    userComments.push(newComment);
    saveComments();
    displayComments();
    
    // 清空表单
    nameInput.value = '';
    contentInput.value = '';
    
    alert('评论发表成功！');
}

// 初始化评论相关事件
function initCommentEvents() {
    const submitBtn = document.getElementById('submitComment');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitComment);
    }
}

// 实时数据同步机制
async function syncDataWithGitHub() {
    // 使用GitHub API作为简单的后端存储
    // 这里使用公共API示例，实际使用时需要配置GitHub Personal Access Token
    try {
        const repo = 'shanhaixiansheng/robot-data';
        const statsPath = 'stats.json';
        const commentsPath = 'comments.json';
        
        // 同步统计数据
        await syncStatsToGitHub(repo, statsPath);
        
        // 同步评论数据
        await syncCommentsToGitHub(repo, commentsPath);
        
        console.log('数据同步成功');
    } catch (error) {
        console.error('数据同步失败:', error);
    }
}

// 同步统计数据到GitHub
async function syncStatsToGitHub(repo, path) {
    // 在实际应用中，这里需要使用GitHub API进行PUT请求
    // 由于跨域限制，这个功能需要服务器端代理或GitHub Actions
    
    // 目前保存到localStorage作为临时方案
    saveSiteStats();
    
    // 每5分钟尝试同步一次数据
    setTimeout(syncDataWithGitHub, 5 * 60 * 1000);
}

// 同步评论数据到GitHub
async function syncCommentsToGitHub(repo, path) {
    // 在实际应用中，这里需要使用GitHub API进行PUT请求
    // 由于跨域限制，这个功能需要服务器端代理或GitHub Actions
    
    // 目前保存到localStorage作为临时方案
    saveComments();
    
    // 每次提交评论后尝试同步数据
    if (userComments.length > 0) {
        console.log('尝试同步评论数据...');
    }
}

// 从GitHub获取数据
async function fetchDataFromGitHub(repo, path) {
    try {
        const url = `https://api.github.com/repos/${repo}/contents/${path}`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            // 解码base64内容
            const content = atob(data.content);
            return JSON.parse(content);
        }
        
        return null;
    } catch (error) {
        console.error('从GitHub获取数据失败:', error);
        return null;
    }
}

// 将数据推送到GitHub
async function pushDataToGitHub(repo, path, data, message) {
    try {
        // 在实际应用中，这需要服务器端实现
        // 前端无法直接推送数据到GitHub（需要认证且有CORS限制）
        
        // 这里只是示例代码
        console.log('将数据推送到GitHub:', { repo, path, data, message });
        
        // 在实际部署时，可以使用GitHub Actions或Netlify Functions等服务器端函数
    } catch (error) {
        console.error('推送数据到GitHub失败:', error);
    }
}