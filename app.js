// 全局变量
let currentBrand = 'fanuc';
let currentType = 'alarm';
let currentData = [];
let searchResult = null;
let dataCache = {};
let isAdmin = false;
const ADMIN_PASSWORD = 'robot123'; // 管理员密码

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

// 执行精确搜索
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    
    // 如果搜索词为空，清空结果
    if (!searchTerm) {
        clearResults();
        return;
    }
    
    // 执行精确搜索
    const result = currentData.find(item => {
        if (currentType === 'alarm') {
            return item.code.toLowerCase() === searchTerm;
        } else {
            return item.number.toLowerCase() === searchTerm;
        }
    });
    
    searchResult = result;
    displayResult();
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
                <div class="result-detail-item">
                    <span>级别:</span>
                    <span>${item.level}</span>
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
                    <span>数据类型:</span>
                    <span>${item.dataType}</span>
                </div>
                <div class="result-detail-item">
                    <span>范围:</span>
                    <span>${item.range}</span>
                </div>
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