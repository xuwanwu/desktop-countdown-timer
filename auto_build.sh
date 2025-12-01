#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}   Tauri Windows 构建自动化脚本${NC}"
echo -e "${BLUE}==============================================${NC}"
echo ""

# 1. 检查依赖
echo -e "${YELLOW}[1/5] 检查环境依赖...${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}错误: 未安装 git${NC}"
    echo "请运行: brew install git"
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo -e "${RED}错误: 未安装 GitHub CLI (gh)${NC}"
    echo "请运行: brew install gh"
    echo "安装后请运行: gh auth login"
    exit 1
fi

# 检查 gh 登录状态
if ! gh auth status &> /dev/null; then
    echo -e "${RED}错误: GitHub CLI 未登录${NC}"
    echo "请运行: gh auth login"
    exit 1
fi

echo -e "${GREEN}✓ 环境检查通过${NC}"
echo ""

# 2. 仓库初始化与检查
echo -e "${YELLOW}[2/5] 检查 Git 仓库...${NC}"

if [ ! -d ".git" ]; then
    echo "初始化 Git 仓库..."
    git init
    git add .
    git commit -m "Initial commit"
fi

# 检查远程仓库
REMOTE_URL=$(git remote get-url origin 2>/dev/null)

if [ -z "$REMOTE_URL" ]; then
    echo "未检测到远程仓库，正在创建..."
    echo -n "请输入仓库名称 (默认: desktop-countdown-timer): "
    read REPO_NAME
    REPO_NAME=${REPO_NAME:-desktop-countdown-timer}
    
    # 创建公开仓库
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}创建仓库失败${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ 仓库创建并关联成功${NC}"
else
    echo -e "${GREEN}✓ 已关联远程仓库: $REMOTE_URL${NC}"
fi
echo ""

# 3. 推送代码
echo -e "${YELLOW}[3/5] 推送代码到 GitHub...${NC}"

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "发现未提交的更改，正在提交..."
    git add .
    git commit -m "Auto build update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# 推送代码
echo "正在推送代码..."
git push -u origin main 2>/dev/null || git push -u origin master

if [ $? -ne 0 ]; then
    echo -e "${RED}推送失败，请检查网络或权限${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 代码推送成功${NC}"
echo ""

# 4. 监控构建
echo -e "${YELLOW}[4/5] 等待 GitHub Actions 构建...${NC}"
echo "正在获取最新构建任务..."

# 等待几秒让 GitHub 创建 workflow run
sleep 5

# 获取最新的 run ID
RUN_ID=$(gh run list --workflow "Build Windows" --limit 1 --json databaseId --jq '.[0].databaseId')

if [ -z "$RUN_ID" ]; then
    echo -e "${RED}未找到构建任务，请检查 .github/workflows/build-windows.yml 是否存在${NC}"
    exit 1
fi

echo "开始监控构建任务 ID: $RUN_ID"
echo "这可能需要 5-15 分钟，请耐心等待..."
echo "按 Ctrl+C 可以取消监控（构建会在后台继续）"
echo ""

# 实时监控
gh run watch "$RUN_ID"

if [ $? -ne 0 ]; then
    echo -e "${RED}构建失败或被取消${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 构建成功完成！${NC}"
echo ""

# 5. 下载产物
echo -e "${YELLOW}[5/5] 下载构建产物...${NC}"

# 创建下载目录
mkdir -p dist_windows

# 下载
echo "正在下载 Windows 安装包..."
gh run download "$RUN_ID" --dir dist_windows

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${BLUE}==============================================${NC}"
    echo -e "${GREEN}🎉 恭喜！Windows 版本构建完成！${NC}"
    echo -e "${BLUE}==============================================${NC}"
    echo ""
    echo "文件已保存到 dist_windows 目录："
    ls -lh dist_windows
    
    # 尝试自动打开目录
    open dist_windows 2>/dev/null
else
    echo -e "${RED}下载失败，请手动访问 GitHub Actions 页面下载${NC}"
fi
