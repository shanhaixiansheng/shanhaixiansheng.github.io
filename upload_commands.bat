@echo off
REM GitHub 上传命令脚本 (Windows版本)

REM 配置变量
set REPO_URL=https://github.com/LIFE-009/robot.git
set REPO_NAME=robot

echo 开始上传代码到 GitHub 仓库...

REM 1. 初始化仓库（如果是第一次）
echo 步骤1: 初始化仓库...
if not exist .git (
    git init
    git remote add origin %REPO_URL%
    echo 已初始化Git仓库并添加远程地址
) else (
    echo Git仓库已存在，跳过初始化
)

REM 2. 添加所有文件到暂存区
echo 步骤2: 添加文件到暂存区...
git add .

REM 3. 提交更改
echo 步骤3: 提交更改...
git commit -m "添加工业机器人查询助手网站"

REM 4. 推送到GitHub
echo 步骤4: 推送到GitHub...
git branch -M main
git push -u origin main

echo 上传完成！
echo 请稍等几分钟，然后访问: https://LIFE-009.github.io/robot/