# 工业机器人查询助手

这是一个基于GitHub Pages的工业机器人查询助手网站，支持主流工业机器人品牌的报警代码和系统变量查询。

## 功能特点

- 支持FANUC、KUKA、ABB、Yaskawa等主流工业机器人品牌
- 提供报警代码和系统变量查询功能
- 支持精确匹配和模糊搜索
- 分页显示查询结果
- 响应式设计，适配不同设备

## 文件结构

```
/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── app.js              # 主应用脚本
├── data/               # 数据目录
│   ├── fanuc-alarm.json        # FANUC报警代码数据
│   ├── fanuc-variable.json     # FANUC系统变量数据
│   ├── kuka-alarm.json         # KUKA报警代码数据
│   ├── kuka-variable.json      # KUKA系统变量数据
│   ├── abb-alarm.json          # ABB报警代码数据
│   ├── abb-variable.json       # ABB系统变量数据
│   ├── yaskawa-alarm.json      # Yaskawa报警代码数据
│   └── yaskawa-variable.json   # Yaskawa系统变量数据
└── README.md           # 说明文档
```

## 数据格式说明

数据存储为JSON格式，文件命名为 `{品牌}-{类型}.json`，如 `fanuc-alarm.json`。

### 报警代码数据格式

```json
{
  "brand": "FANUC",
  "type": "alarm",
  "lastUpdated": "2025-11-27",
  "data": [
    {
      "code": "SRVO-001",
      "name": "报警名称",
      "description": "报警描述",
      "category": "报警类别",
      "level": "报警级别",
      "solution": "解决方案"
    }
  ]
}
```

### 系统变量数据格式

```json
{
  "brand": "FANUC",
  "type": "variable",
  "lastUpdated": "2025-11-27",
  "data": [
    {
      "number": "$R[1]",
      "name": "变量名称",
      "description": "变量描述",
      "dataType": "数据类型",
      "range": "取值范围",
      "unit": "单位",
      "category": "变量类别"
    }
  ]
}
```

## 部署步骤

1. 将所有文件上传到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择源分支和根目录
4. 等待部署完成后即可通过 `https://username.github.io/repository-name` 访问

## 数据更新

网站数据存储在 `data/` 目录下的JSON文件中，要更新数据：

1. 准备新的Excel数据文件
2. 使用转换工具将Excel数据转换为JSON格式
3. 更新相应品牌的JSON文件
4. 将更新后的JSON文件上传到仓库
5. 推送更改后，网站将自动显示更新后的数据

注意：为了保护原始数据，不应将原始Excel文件上传到仓库中，只上传转换后的JSON数据文件。

## 开发和自定义

### 添加新的品牌

1. 在 `data/` 目录下创建 `{新品牌}-alarm.json` 和 `{新品牌}-variable.json` 文件
2. 在 `index.html` 中的品牌选择器中添加新品牌选项
3. 在 `app.js` 中更新 `loadAllBrandData()` 函数中的品牌列表

### 修改样式

编辑 `styles.css` 文件来自定义网站外观。

### 扩展功能

在 `app.js` 中添加新功能，如：
- 高级搜索过滤器
- 数据导出功能
- 用户反馈收集

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)
- GitHub Pages

## 许可证

本项目采用 MIT 许可证。