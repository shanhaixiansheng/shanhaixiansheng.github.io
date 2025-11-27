// 全局变量
let currentBrand = 'fanuc';
let currentType = 'alarm';
let currentPage = 1;
let resultsPerPage = 10;
let currentData = [];
let searchResults = [];
let dataCache = {};

// DOM 元素
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const brandSelect = document.getElementById('brand');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchTypeRadios = document.querySelectorAll('input[name="searchType"]');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
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
    
    prevPageBtn.addEventListener('click', () => changePage(-1));
    nextPageBtn.addEventListener('click', () => changePage(1));
    
    // 初始化页面
    initializePage();
});

// 初始化页面
async function initializePage() {
    // 加载所有品牌的数据
    await loadAllBrandData();
    
    // 显示默认品牌的数据
    await loadBrandData(currentBrand);
    
    // 更新数据统计信息
    updateDataStats();
    
    // 显示初始搜索结果
    searchResults = currentData;
    displayResults();
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
    
    // 更新最后更新时间
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (dataCache[cacheKey] && dataCache[cacheKey].lastUpdated) {
        lastUpdateElement.textContent = dataCache[cacheKey].lastUpdated;
    } else {
        lastUpdateElement.textContent = '未知';
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
    currentPage = 1;
    loadBrandData(currentBrand).then(() => {
        performSearch();
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
    currentPage = 1;
    
    // 加载新数据
    loadBrandData(currentBrand).then(() => {
        performSearch();
    });
}

// 执行搜索
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    
    // 重置当前页码
    currentPage = 1;
    
    // 如果搜索词为空，显示所有数据
    if (!searchTerm) {
        searchResults = [...currentData];
    } else {
        // 执行搜索
        searchResults = filterData(currentData, searchTerm, searchType);
    }
    
    // 显示结果
    displayResults();
}

// 数据过滤
function filterData(data, searchTerm, searchType) {
    if (searchType === 'exact') {
        return data.filter(item => {
            if (currentType === 'alarm') {
                return item.code.toLowerCase() === searchTerm || 
                       item.name.toLowerCase() === searchTerm;
            } else {
                return item.number.toLowerCase() === searchTerm || 
                       item.name.toLowerCase() === searchTerm;
            }
        });
    } else { // 模糊匹配
        return data.filter(item => {
            if (currentType === 'alarm') {
                return item.code.toLowerCase().includes(searchTerm) || 
                       item.name.toLowerCase().includes(searchTerm) ||
                       item.description.toLowerCase().includes(searchTerm) ||
                       item.category.toLowerCase().includes(searchTerm) ||
                       item.level.toLowerCase().includes(searchTerm);
            } else {
                return item.number.toLowerCase().includes(searchTerm) || 
                       item.name.toLowerCase().includes(searchTerm) ||
                       item.description.toLowerCase().includes(searchTerm) ||
                       item.category.toLowerCase().includes(searchTerm);
            }
        });
    }
}

// 显示结果
function displayResults() {
    const resultsContainer = document.getElementById('searchResults');
    const noResultsElement = document.getElementById('noResults');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsCountElement = document.getElementById('resultsCount');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfoElement = document.getElementById('pageInfo');
    
    // 隐藏加载指示器和无结果提示
    loadingIndicator.classList.add('hidden');
    noResultsElement.classList.add('hidden');
    
    // 更新结果计数
    resultsCountElement.textContent = searchResults.length;
    
    // 如果没有结果，显示无结果提示
    if (searchResults.length === 0) {
        resultsContainer.innerHTML = '';
        noResultsElement.classList.remove('hidden');
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        pageInfoElement.textContent = `第 1 页，共 1 页`;
        return;
    }
    
    // 计算分页
    const totalPages = Math.ceil(searchResults.length / resultsPerPage);
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = Math.min(startIndex + resultsPerPage, searchResults.length);
    const pageResults = searchResults.slice(startIndex, endIndex);
    
    // 渲染结果
    resultsContainer.innerHTML = '';
    pageResults.forEach(item => {
        resultsContainer.appendChild(createResultElement(item));
    });
    
    // 更新分页控件
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    pageInfoElement.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
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

// 分页处理
function changePage(direction) {
    const totalPages = Math.ceil(searchResults.length / resultsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayResults();
        
        // 滚动到结果区域顶部
        document.querySelector('.results-section').scrollIntoView({ behavior: 'smooth' });
    }
}

// 更新数据统计
function updateDataStats() {
    for (const brand of ['fanuc', 'kuka', 'abb', 'yaskawa']) {
        const alarmData = dataCache[`${brand}-alarm`] ? dataCache[`${brand}-alarm`].data.length : 0;
        const variableData = dataCache[`${brand}-variable`] ? dataCache[`${brand}-variable`].data.length : 0;
        
        document.getElementById(`${brand}-alarm-count`).textContent = alarmData;
        document.getElementById(`${brand}-variable-count`).textContent = variableData;
    }
}