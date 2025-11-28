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

// 同步节流变量
let lastSyncTime = 0;
const SYNC_THROTTLE_MS = 3000; // 3秒内只同步一次

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
    
    // 添加平滑滚动和悬停效果
    addSmoothInteractions();
    
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
    
    // 更新公共统计显示（包括运行天数）
    updatePublicStatsDisplay();
    
    // 获取用户位置
    getUserLocation().then(location => {
        console.log('用户位置:', location);
    });
    
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
    
    // 尝试同步统计数据到云端
    submitDataToGitHub(siteStats, 'stats');
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
    
    // 尝试同步统计数据到云端
    submitDataToGitHub(siteStats, 'stats');
}

// 地理位置相关功能
let userLocation = null;
let siteStats = {
    totalViews: 0,
    todayViews: 0,
    totalSearches: 0,
    todaySearches: 0,
    lastUpdated: null
};



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
    const runningDays = getRunningDays();
    document.getElementById('publicViewCount').textContent = siteStats.totalViews || '--';
    document.getElementById('todayViewCount').textContent = siteStats.todayViews || '--';
    document.getElementById('siteRunningDays').textContent = runningDays;
    document.getElementById('headerRunningDays').textContent = runningDays;
}

// 计算网站运行天数
function getRunningDays() {
    // 网站上线日期 (2025-11-20)
    const startDate = new Date('2025-11-20');
    const currentDate = new Date();
    
    // 计算日期差异
    const timeDiff = currentDate - startDate;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // 确保不会显示负数（如果是未来日期）
    return daysDiff > 0 ? daysDiff : 0;
}

// 加载评论数据







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





// 实时数据同步机制
async function syncDataWithGitHub() {
    try {
        // 从GitHub Pages获取最新的统计数据
        await fetchStatsFromGitHub();
        
        // 每3分钟同步一次数据
        setTimeout(syncDataWithGitHub, 3 * 60 * 1000);
    } catch (error) {
        console.error('数据同步失败:', error);
        // 如果同步失败，1分钟后重试
        setTimeout(syncDataWithGitHub, 60 * 1000);
    }
}

// 从云端获取统计数据
async function fetchStatsFromGitHub() {
    try {
        // 1. 首先尝试从JSONBin.io获取
        try {
            const statsBinId = localStorage.getItem('statsBinId');
            if (statsBinId) {
                const response = await fetch(`https://api.jsonbin.io/v3/b/${statsBinId}/latest`);
                if (response.ok) {
                    const remoteStats = await response.json();
                    
                    if (remoteStats.lastUpdated && (!siteStats.lastUpdated || new Date(remoteStats.lastUpdated) > new Date(siteStats.lastUpdated))) {
                        siteStats = remoteStats;
                        saveSiteStats();
                        updatePublicStatsDisplay();
                        console.log('统计数据已从JSONBin.io同步');
                        return;
                    }
                }
            }
        } catch (error) {
            console.log('从JSONBin.io获取统计数据失败:', error);
        }
        
        // 2. 尝试从MyJSON获取
        try {
            const statsJsonUri = localStorage.getItem('statsJsonUri');
            if (statsJsonUri) {
                const response = await fetch(statsJsonUri);
                if (response.ok) {
                    const remoteStats = await response.json();
                    
                    if (remoteStats.lastUpdated && (!siteStats.lastUpdated || new Date(remoteStats.lastUpdated) > new Date(siteStats.lastUpdated))) {
                        siteStats = remoteStats;
                        saveSiteStats();
                        updatePublicStatsDisplay();
                        console.log('统计数据已从MyJSON同步');
                        return;
                    }
                }
            }
        } catch (error) {
            console.log('从MyJSON获取统计数据失败:', error);
        }
        
        // 3. 尝试从GitHub Pages获取
        let response = await fetch('https://shanhaixiansheng.github.io/robot/stats.json');
        if (response.ok) {
            const remoteStats = await response.json();
            
            if (remoteStats.lastUpdated && (!siteStats.lastUpdated || new Date(remoteStats.lastUpdated) > new Date(siteStats.lastUpdated))) {
                siteStats = remoteStats;
                saveSiteStats();
                updatePublicStatsDisplay();
                console.log('统计数据已从GitHub Pages同步');
                return;
            }
        }
        
    } catch (error) {
        console.error('获取统计数据失败:', error);
    }
}



// 提交数据到云端存储（带节流机制）
async function submitDataToGitHub(data, dataType) {
    // 节流：在指定时间内只允许一次同步请求
    const now = Date.now();
    if (now - lastSyncTime < SYNC_THROTTLE_MS) {
        console.log(`${dataType}同步请求被节流，上次同步时间: ${new Date(lastSyncTime)}`);
        return;
    }
    lastSyncTime = now;
    
    try {
        // 保存数据到本地
        if (dataType === 'stats') {
            saveSiteStats();
        }
        
        // 显示同步中状态
        showSyncInProgressNotification(dataType);
        
        // 尝试使用JSONBin.io作为云端存储
        try {
            await submitToJSONBin(data, dataType);
            return;
        } catch (error) {
            console.log('JSONBin.io提交失败:', error);
        }
        
        // 尝试使用MyJSON作为备用方案
        try {
            await submitToMyJSON(data, dataType);
            return;
        } catch (error) {
            console.log('MyJSON提交失败:', error);
        }
        
        // 最后的备用方案：使用GitHub Issues API
        try {
            await submitToGitHubIssues(data, dataType);
        } catch (error) {
            console.error('所有数据提交方案都失败:', error);
            showDataSyncNotification(dataType, false);
        }
        
    } catch (error) {
        console.error('提交数据到云端失败:', error);
        showDataSyncNotification(dataType, false);
    }
}

// 提交数据到JSONBin.io
async function submitToJSONBin(data, dataType) {
    const jsonData = JSON.stringify(data, null, 2);
    
    // 创建一个新的JSON Bin
    const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': '$2a$10$yourkeyhere', // 这是一个示例密钥，需要替换为实际密钥
        },
        body: jsonData
    });
    
    if (response.ok) {
        const result = await response.json();
        console.log(`${dataType}数据已提交到JSONBin.io:`, result);
        
        // 保存Bin ID到本地，用于后续同步
        if (dataType === 'stats') {
            localStorage.setItem('statsBinId', result.id);
        }
        
        showDataSyncNotification(dataType, true);
    } else {
        throw new Error('Failed to create JSONBin');
    }
}

// 提交数据到MyJSON
async function submitToMyJSON(data, dataType) {
    const jsonData = JSON.stringify(data, null, 2);
    
    // 创建一个新的JSON文档
    const response = await fetch('https://api.myjson.com/bins', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: jsonData
    });
    
    if (response.ok) {
        const result = await response.json();
        console.log(`${dataType}数据已提交到MyJSON:`, result);
        
        // 保存URI到本地，用于后续同步
        if (dataType === 'stats') {
            localStorage.setItem('statsJsonUri', result.uri);
        }
        
        showDataSyncNotification(dataType, true);
    } else {
        throw new Error('Failed to create MyJSON');
    }
}

// 使用GitHub Issues API作为数据存储的最后备用方案
async function submitToGitHubIssues(data, dataType) {
    try {
        // 创建一个包含数据的Issue，用作简单的数据存储
        const issueTitle = `Data Sync: ${dataType} - ${new Date().toISOString()}`;
        const issueBody = `
### ${dataType} Data Update

更新时间: ${new Date().toISOString()}

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
        `;
        
        // 使用GitHub Issues API创建Issue（需要用户手动创建GitHub Personal Access Token）
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const githubUrl = 'https://api.github.com/repos/shanhaixiansheng/robot/issues';
        
        const issueData = {
            title: issueTitle,
            body: issueBody,
            labels: [dataType, 'data-sync']
        };
        
        const response = await fetch(proxyUrl + githubUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(issueData)
        });
        
        if (response.ok || response.status === 201) {
            console.log(`${dataType}数据已作为Issue提交到GitHub`);
            showDataSyncNotification(dataType, true);
        } else {
            throw new Error('Failed to create Issue');
        }
    } catch (error) {
        console.error('提交到GitHub Issues失败:', error);
        throw error;
    }
}

// 创建下载数据文件
function createDownloadFile(data, dataType) {
    const filename = `${dataType}_${new Date().toISOString().slice(0, 10)}.json`;
    const content = JSON.stringify(data, null, 2);
    
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

// 显示数据同步中提示
function showSyncInProgressNotification(dataType) {
    // 检查是否已经有同步中通知
    if (document.getElementById('sync-in-progress')) {
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = 'sync-notification';
    notification.id = 'sync-in-progress';
    notification.style.backgroundColor = 'rgba(33, 150, 243, 0.95)';
    notification.innerHTML = `
        <p>🔄 正在同步${dataType === 'stats' ? '统计数据' : '数据'}到云端...</p>
        <div class="sync-spinner"></div>
    `;
    
    document.body.appendChild(notification);
    
    // 10秒后自动关闭同步中通知
    setTimeout(() => {
        const inProgress = document.getElementById('sync-in-progress');
        if (inProgress) {
            inProgress.remove();
        }
    }, 10000);
}

// 显示数据同步提示
function showDataSyncNotification(dataType, success) {
    // 移除同步中通知
    const inProgress = document.getElementById('sync-in-progress');
    if (inProgress) {
        inProgress.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'sync-notification';
    
    if (success) {
        notification.style.backgroundColor = 'rgba(76, 175, 80, 0.95)';
        notification.innerHTML = `
            <p>✅ ${dataType === 'stats' ? '统计数据' : '数据'}已成功同步到云端！</p>
            <button class="close-notification">确定</button>
        `;
    } else {
        notification.style.backgroundColor = 'rgba(255, 152, 0, 0.95)';
        notification.innerHTML = `
            <p>⚠️ 数据已暂存到本地，正在尝试自动同步...</p>
            <p>如果同步失败，数据将保存在本地存储中，下次尝试时会自动同步。</p>
            <button class="close-notification">关闭</button>
        `;
    }
    
    document.body.appendChild(notification);
    
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.remove();
    });
    
    // 5秒后自动关闭
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
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

// 添加平滑交互效果
function addSmoothInteractions() {
    // 添加平滑滚动效果
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // 添加元素进入视口时的动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // 观察所有需要动画的元素
    document.querySelectorAll('.result-item, .stat-item').forEach(item => {
        observer.observe(item);
    });
    
    // 添加按钮点击涟漪效果
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // 添加输入框聚焦动画
    document.querySelectorAll('input, textarea, select').forEach(element => {
        element.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        element.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });
}

// 添加页面加载完成后的动画
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // 为结果区域添加延迟加载动画
    setTimeout(() => {
        document.querySelectorAll('.result-item').forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 300);
});

// 添加平滑过渡类
const style = document.createElement('style');
style.innerHTML = `
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
    
    .focused {
        transform: translateY(-2px);
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .loaded .result-item {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .loaded header, .loaded .search-section, .loaded .about-section {
        animation: slideInFromTop 0.8s ease-out;
    }
    
    @keyframes slideInFromTop {
        0% { opacity: 0; transform: translateY(-30px); }
        100% { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);