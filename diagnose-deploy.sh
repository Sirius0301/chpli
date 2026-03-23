#!/bin/bash

echo "=========================================="
echo "  部署问题诊断脚本"
echo "=========================================="
echo ""

# 1. 检查本地代码版本
echo "📋 1. 本地代码状态："
echo "   最新提交:"
git log -1 --oneline
echo "   修改的文件:"
git status --short
echo ""

# 2. 检查服务器代码是否正确
echo "📋 2. 检查关键文件是否存在："
echo "   Sidebar.tsx:"
ls -la apps/calendar-memo/web/src/components/Sidebar.tsx 2>/dev/null | awk '{print $9, $6, $7, $8}'
echo "   TagManager.tsx:"
ls -la apps/calendar-memo/web/src/components/TagManager.tsx 2>/dev/null | awk '{print $9, $6, $7, $8}'
echo ""

# 3. 检查 Docker 镜像
echo "📋 3. Docker 镜像信息："
docker images | grep chpli || echo "   没有找到 chpli 镜像"
echo ""

# 4. 检查运行中的容器
echo "📋 4. 运行中的容器："
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep chpli || echo "   没有运行中的 chpli 容器"
echo ""

# 5. 检查容器内的文件
echo "📋 5. 容器内的前端文件："
if docker ps | grep -q chpli-web; then
    echo "   容器内 index.html 修改时间："
    docker exec chpli-web ls -la /usr/share/nginx/html/index.html 2>/dev/null || echo "   无法访问"
    echo "   容器内 assets 文件数："
    docker exec chpli-web sh -c "ls /usr/share/nginx/html/assets/ | wc -l" 2>/dev/null || echo "   无法访问"
else
    echo "   web 容器未运行"
fi
echo ""

# 6. 测试 API
echo "📋 6. API 健康检查："
curl -s http://localhost:3001/health 2>/dev/null || curl -s http://localhost:3001/api/health 2>/dev/null || echo "   API 无响应"
echo ""

echo "=========================================="
echo "  诊断建议："
echo "=========================================="
echo ""

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  警告：本地有未提交的更改！"
    echo "   请先提交并推送代码:"
    echo "   git add ."
    echo "   git commit -m 'your message'"
    echo "   git push"
    echo ""
fi

# 检查是否有未推送的提交
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
if [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
    echo "⚠️  警告：本地有未推送的提交！"
    echo "   请执行: git push"
    echo ""
fi

echo "✅ 如果以上检查都正常，请执行:"
echo "   chmod +x deploy.sh && ./deploy.sh"
echo ""
