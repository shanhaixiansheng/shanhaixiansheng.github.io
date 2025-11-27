# Firebase 设置指南

## 概述
本应用使用Firebase实时数据库来存储和同步评论及统计数据，这样所有用户都能看到彼此的评论和实时更新的统计数据。

## 步骤1：创建Firebase项目
1. 访问 [Firebase控制台](https://console.firebase.google.com/)
2. 点击"添加项目"
3. 输入项目名称，例如："robot-comments"
4. 选择是否启用Google Analytics（可以不启用）
5. 点击"创建项目"

## 步骤2：设置实时数据库
1. 在项目控制台中，点击左侧菜单的"构建" → "实时数据库"
2. 点击"创建数据库"
3. 选择"在测试模式下启动"（允许读写访问）
4. 选择数据库位置（建议选择asia-southeast1或其他亚洲地区）
5. 点击"启用"

## 步骤3：配置数据库规则
1. 在实时数据库页面，点击"规则"选项卡
2. 将规则替换为以下内容：

```json
{
  "rules": {
    ".read": "true",
    ".write": "true",
    "comments": {
      ".indexOn": ["timestamp"]
    }
  }
}
```

3. 点击"发布"

## 步骤4：获取Firebase配置
1. 在项目控制台中，点击项目设置图标（齿轮图标）
2. 选择"我的应用" → "Web应用"
3. 给应用命名，例如："Robot Assistant"
4. 点击"注册应用"
5. 复制`firebaseConfig`对象内容

## 步骤5：更新app.js中的Firebase配置
1. 打开app.js文件
2. 找到开头的`firebaseConfig`对象
3. 将步骤4中复制的配置信息粘贴进去
4. 保存文件

## 步骤6：上传更新后的代码
1. 使用Git提交更新后的代码：
   ```
   git add .
   git commit -m "集成Firebase实时数据库"
   git push origin main
   ```

2. 等待GitHub Pages完成部署（通常需要几分钟）

## 完成！
现在您的网站应该可以正常工作了，所有用户都能看到彼此的评论和实时更新的统计数据。

## 注意事项
1. 本指南使用的是测试模式，允许任何人读写数据库
2. 在生产环境中，您可能需要设置更严格的安全规则
3. Firebase有免费配额限制，对于小型网站来说足够使用
4. 如果需要，可以随时在Firebase控制台中查看数据使用情况