# GitHub Pages 部署指南

本指南将帮助您将工业机器人查询助手网站部署到GitHub Pages。

## 前置条件

1. 您需要有一个GitHub账号
2. 您需要有一个GitHub仓库（可以使用现有的 `https://github.com/LIFE-009/------.git`）

## 步骤一：准备项目文件

确保以下文件已准备好并放在仓库的根目录：

1. `index.html` - 网站主页
2. `styles.css` - 网站样式
3. `app.js` - 网站功能脚本
4. `data/` 目录 - 包含所有JSON数据文件
   - `fanuc-alarm.json`
   - `fanuc-variable.json`
   - `kuka-alarm.json`
   - `kuka-variable.json`
   - `abb-alarm.json`
   - `abb-variable.json`
   - `yaskawa-alarm.json`
   - `yaskawa-variable.json`

## 步骤二：上传文件到GitHub

有几种方法可以将文件上传到GitHub：

### 方法一：使用Git命令行（推荐）

1. 克隆仓库到本地：
   ```bash
   git clone https://github.com/LIFE-009/------.git
   cd ------
   ```

2. 复制项目文件到仓库目录：
   ```bash
   # 将所有项目文件复制到仓库根目录
   ```

3. 添加、提交并推送文件：
   ```bash
   git add .
   git commit -m "添加工业机器人查询助手网站"
   git push origin main
   ```

### 方法二：使用GitHub网页界面

1. 访问您的仓库 `https://github.com/LIFE-009/------`
2. 点击"Add file"按钮，然后选择"Upload files"
3. 拖放或选择文件上传
4. 提交更改

## 步骤三：启用GitHub Pages

1. 在您的仓库中，进入"Settings"选项卡
2. 在左侧菜单中找到"Pages"
3. 在"Source"部分：
   - 选择"Deploy from a branch"
   - 在"Branch"下拉菜单中选择"main"（或您的默认分支）
   - 在文件夹选择中选择"/ (root)"
4. 点击"Save"

## 步骤四：访问您的网站

GitHub Pages需要几分钟时间来处理和部署您的网站。部署完成后：

- 您的网站将可在 `https://LIFE-009.github.io/------/` 访问
- 也可以在仓库的"Settings" -> "Pages"部分找到访问链接

## 步骤五：更新数据（如需要）

当您需要更新数据时：

1. 更新 `data/` 目录中的相应JSON文件
2. 提交并推送更改：
   ```bash
   git add .
   git commit -m "更新机器人数据"
   git push origin main
   ```
3. GitHub Pages会自动重新部署网站，几分钟后更新就会生效

## 常见问题解决

### 网站显示404错误

- 确保文件在正确的目录中
- 检查仓库的Pages设置是否正确
- 确保文件名大小写正确

### 数据不显示

- 检查 `data/` 目录是否存在并包含所有JSON文件
- 确保JSON文件格式正确，可以使用在线JSON验证器检查
- 查看浏览器控制台是否有错误信息

### 样式不正确

- 确保 `styles.css` 文件已正确上传
- 检查 `index.html` 中对CSS文件的引用是否正确

## 数据转换工具

要将Excel数据转换为JSON格式，可以使用以下方法：

### 方法一：使用Python脚本

创建一个Python脚本（`convert.py`）：

```python
import pandas as pd
import json
import os

def convert_excel_to_json(excel_path, json_path, data_type):
    # 读取Excel文件
    df = pd.read_excel(excel_path)
    
    # 根据数据类型确定字段名
    if data_type == 'alarm':
        # 调整列名以匹配Excel中的实际列名
        df.columns = ['code', 'name', 'description', 'category', 'level', 'solution']
    else:
        # 调整列名以匹配Excel中的实际列名
        df.columns = ['number', 'name', 'description', 'dataType', 'range', 'unit', 'category']
    
    # 转换为JSON
    data = {
        "brand": "FANUC",
        "type": data_type,
        "lastUpdated": "2025-11-27",
        "data": df.to_dict('records')
    }
    
    # 写入JSON文件
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# 使用示例
convert_excel_to_json('fanucbaojing/FANUC报警代码表.xlsx', 'data/fanuc-alarm.json', 'alarm')
convert_excel_to_json('fanucxitong/FANUC系统变量表.xlsx', 'data/fanuc-variable.json', 'variable')
```

### 方法二：使用在线工具

可以使用在线Excel到JSON转换器，但可能需要手动调整格式。

### 方法三：手动转换

对于小量数据，可以直接手动创建JSON文件。

## 安全注意事项

- 不要将原始Excel文件上传到公共仓库，只上传转换后的JSON文件
- JSON文件中的数据应不包含敏感信息
- 定期检查和更新依赖项以避免安全漏洞

## 联系方式

如果您在部署过程中遇到问题，请检查GitHub Pages文档或在GitHub上提出问题。