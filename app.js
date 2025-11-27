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
    incrementViewCount();
    
    // 获取用户位置信息
    getUserLocation();
    
    // 加载评论
    loadComments();
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

// 统计相关函数
function loadStatistics() {
    // 从localStorage加载统计数据
    viewCount = parseInt(localStorage.getItem('viewCount') || '0');
    searchCount = parseInt(localStorage.getItem('searchCount') || '0');
    
    // 更新显示
    updateStatisticsDisplay();
}

function updateStatisticsDisplay() {
    // 更新页面中的统计显示
    document.getElementById('viewCount').textContent = viewCount;
    document.getElementById('searchCount').textContent = searchCount;
    document.getElementById('footerViewCount').textContent = viewCount;
    document.getElementById('footerSearchCount').textContent = searchCount;
}

function incrementViewCount() {
    viewCount++;
    localStorage.setItem('viewCount', viewCount.toString());
    updateStatisticsDisplay();
}

function incrementSearchCount() {
    searchCount++;
    localStorage.setItem('searchCount', searchCount.toString());
    updateStatisticsDisplay();
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

// 评论相关函数
function toggleCommentsSection() {
    const commentsSection = document.getElementById('commentsSection');
    commentsSection.classList.toggle('hidden');
}

function submitUserComment() {
    const userName = document.getElementById('userName').value.trim();
    const userCommentText = document.getElementById('userComment').value.trim();
    
    if (!userName || !userCommentText) {
        alert('请填写昵称和评论内容');
        return;
    }
    
    const comment = {
        name: userName,
        province: userProvince,
        text: userCommentText,
        time: new Date().toLocaleString()
    };
    
    // 获取现有评论
    const comments = JSON.parse(localStorage.getItem('comments') || '[]');
    comments.unshift(comment); // 新评论添加到前面
    
    // 保存评论
    localStorage.setItem('comments', JSON.stringify(comments));
    
    // 清空表单
    document.getElementById('userName').value = '';
    document.getElementById('userComment').value = '';
    
    // 重新加载评论
    loadComments();
    
    alert('评论发表成功！');
}

function loadComments() {
    const comments = JSON.parse(localStorage.getItem('comments') || '[]');
    const commentsList = document.getElementById('commentsList');
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p>暂无评论，快来发表第一条评论吧！</p>';
        return;
    }
    
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
}