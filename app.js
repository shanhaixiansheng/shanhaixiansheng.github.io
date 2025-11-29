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
    
    // 移除加载状态
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
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
    
    // 添加调试日志
    console.log(`加载 ${brand}-${currentType} 数据，缓存键: ${cacheKey}`, {
        缓存存在: !!dataCache[cacheKey],
        数据长度: currentData.length
    });
    
    // 确保数据加载完成
    if (!currentData || currentData.length === 0) {
        console.warn('警告: 数据为空，可能是加载失败或缓存问题');
        // 尝试直接从文件加载数据
        try {
            const data = await loadData(brand, currentType);
            if (data && data.data) {
                dataCache[cacheKey] = data;
                currentData = data.data;
                console.log('直接加载数据成功，数据长度:', currentData.length);
            }
        } catch (error) {
            console.error('直接加载数据失败:', error);
        }
    }
    
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
        console.log(`尝试加载数据: data/${brand}-${type}.json`);
        const response = await fetch(`data/${brand}-${type}.json`);
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        const data = await response.json();
        console.log(`成功加载 ${brand}-${type} 数据，数据长度:`, data.data ? data.data.length : 0);
        return data;
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
    
    console.log(`开始搜索: 关键词="${searchTerm}", 类型="${searchType}", 数据类型="${currentType}", 品牌="${currentBrand}", 当前数据量=${currentData.length}`);
    
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
        
        console.log('精确搜索结果:', result);
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
        
        console.log('模糊搜索结果数量:', results.length);
        searchResult = results;
        displayResults();
    }
}

// 显示单个结果
function displayResult() {
    const resultsContainer = document.getElementById('searchResults');
    const noResultsElement = document.getElementById('noResults');
    const resultsSection = document.getElementById('resultsSection');
    
    console.log('显示单个结果:', searchResult);
    console.log('结果容器元素:', resultsContainer);
    console.log('无结果元素:', noResultsElement);
    console.log('结果区域元素:', resultsSection);
    
    // 显示结果区域
    resultsSection.classList.remove('hidden');
    console.log('已显示结果区域，移除hidden类');
    
    // 清空之前的结果
    resultsContainer.innerHTML = '';
    
    // 如果没有结果，显示无结果提示
    if (!searchResult) {
        console.log('没有搜索结果，显示无结果提示');
        resultsContainer.innerHTML = '';
        noResultsElement.classList.remove('hidden');
        return;
    }
    
    // 隐藏无结果提示
    noResultsElement.classList.add('hidden');
    
    // 创建并添加结果元素
    const resultElement = createResultElement(searchResult);
    console.log('创建的结果元素:', resultElement);
    resultsContainer.appendChild(resultElement);
    console.log('已添加结果元素到容器');
}

// 显示多个结果（模糊搜索）
function displayResults() {
    const resultsContainer = document.getElementById('searchResults');
    const noResultsElement = document.getElementById('noResults');
    const resultsSection = document.getElementById('resultsSection');
    
    console.log('显示多个结果，结果数量:', searchResult ? searchResult.length : 0);
    console.log('结果容器元素:', resultsContainer);
    console.log('无结果元素:', noResultsElement);
    console.log('结果区域元素:', resultsSection);
    
    // 显示结果区域
    resultsSection.classList.remove('hidden');
    console.log('已显示结果区域，移除hidden类');
    
    // 清空之前的结果
    resultsContainer.innerHTML = '';
    
    // 如果没有结果，显示无结果提示
    if (!searchResult || searchResult.length === 0) {
        console.log('没有搜索结果，显示无结果提示');
        resultsContainer.innerHTML = '';
        noResultsElement.classList.remove('hidden');
        return;
    }
    
    // 隐藏无结果提示
    noResultsElement.classList.add('hidden');
    
    // 只显示前3条结果
    const maxResults = 3;
    const limitedResults = searchResult.slice(0, maxResults);
    console.log('将显示前', limitedResults.length, '个结果');
    
    // 创建并添加结果元素
    limitedResults.forEach((item, index) => {
        const resultElement = createResultElement(item);
        console.log(`创建结果元素 ${index}:`, resultElement);
        resultsContainer.appendChild(resultElement);
    });
    console.log('已添加所有结果元素到容器');
    
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
    resultDiv.style.border = '2px solid #e0e0e0';
    resultDiv.style.backgroundColor = '#ffffff';
    
    if (currentType === 'alarm') {
        resultDiv.innerHTML = `
            <div class="result-code" style="color: #d32f2f; background: #f8f9fa;">${item.code}</div>
            <div class="result-name" style="color: #1a237e;">${item.name}</div>
            <div class="result-description" style="color: #333333;">${item.description}</div>
            <div class="result-details">
                <div class="result-detail-item">
                    <span style="color: #555555;">类别:</span>
                    <span style="color: #333333;">${item.category}</span>
                </div>
            </div>
            <div class="result-solution">
                <strong style="color: #2e7d32;">解决方案:</strong> <span style="color: #333333;">${item.solution}</span>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="result-code" style="color: #d32f2f; background: #f8f9fa;">${item.number}</div>
            <div class="result-name" style="color: #1a237e;">${item.name}</div>
            <div class="result-description" style="color: #333333;">${item.description}</div>
            <div class="result-details">
                <div class="result-detail-item">
                    <span style="color: #555555;">类别:</span>
                    <span style="color: #333333;">${item.category}</span>
                </div>
                ${item.unit ? `
                <div class="result-detail-item">
                    <span style="color: #555555;">单位:</span>
                    <span style="color: #333333;">${item.unit}</span>
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
    
        // 尝试同步统计数据到云端 - 已禁用
    // submitDataToGitHub(siteStats, 'stats');
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
    
        // 尝试同步统计数据到云端 - 已禁用
    // submitDataToGitHub(siteStats, 'stats');
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

// 脏话识别列表
const badWords = [
    '操', '肏', '干', '日', '草', '妈', '妈逼', '傻逼', '傻B', '傻b', 'SB', 'sb',
    '他妈', '他吗', '他妈的', 'TMD', 'tmd', '妈蛋', '废物', '废物点心',
    '滚', '去死', '死妈', '死全家', '尼玛', '你妈', '你M', 'M的',
    'CAO', 'cao', 'FUCK', 'fuck', 'SHIT', 'shit', 'BITCH', 'bitch', 'ASS', 'ass',
    '操你', '草你', '肏你', '狗日的', '狗屎', '屄', '逼', 'B', 'b',
    '鸡巴', 'JB', 'jb', '屌', '阴道', '淫荡', '淫秽', '色情','qnmd'
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
        // 使用IP获取大致位置
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
    document.body.classList.remove('loading');
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
    
    .loaded header, .loaded .search-section, .loaded .comments-section {
        animation: slideInFromTop 0.8s ease-out;
    }
    
    @keyframes slideInFromTop {
        0% { opacity: 0; transform: translateY(-30px); }
        100% { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);