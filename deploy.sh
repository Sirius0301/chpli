#!/bin/bash

# 部署脚本 - 确保最新代码被正确构建

set -e

echo "=========================================="
echo "  Calendar Memo 部署脚本"
echo "=========================================="
echo ""

# 1. 确认代码最新
echo "📥 拉取最新代码..."
git pull origin main  # 或你的分支名
echo "✅ 代码已更新"
echo ""

# 2. 停止并删除旧容器
echo "🛑 停止并删除旧容器..."
docker-compose down
docker rm -f chpli-web 2>/dev/null || true
docker rm -f chpli-server 2>/dev/null || true
echo "✅ 旧容器已清理"
echo ""

# 3. 删除旧镜像（强制重新构建）
echo "🗑️  删除旧镜像..."
docker rmi chpli-web 2>/dev/null || true
docker rmi chpli-server 2>/dev/null || true
# 删除所有悬空镜像
docker image prune -f
echo "✅ 旧镜像已删除"
echo ""

# 4. 清理构建缓存（关键！）
echo "🧹 清理 Docker 构建缓存..."
docker builder prune -f
echo "✅ 构建缓存已清理"
echo ""

# 5. 重新构建（不使用缓存）
echo "🔨 重新构建镜像..."
docker-compose build --no-cache web server
echo "✅ 镜像构建完成"
echo ""

# 6. 启动服务
echo "🚀 启动服务..."
docker-compose up -d
echo "✅ 服务已启动"
echo ""

# 7. 等待服务就绪
echo "⏳ 等待服务就绪..."
sleep 5

# 8. 验证部署
echo "📋 验证部署状态..."
docker-compose ps
echo ""

# 9. 查看前端版本（验证是否更新）
echo "🔍 检查前端版本..."
docker exec chpli-web ls -la /usr/share/nginx/html
echo ""

echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "检查日志: docker-compose logs -f web"
