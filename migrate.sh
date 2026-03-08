#!/bin/bash
# 数据迁移脚本 - 在宿主机上直接运行

set -e

echo "========================================"
echo "  Calendar Memo 数据迁移工具"
echo "========================================"
echo ""

# 检查数据库是否运行
if ! docker ps | grep -q chpli-postgres; then
    echo "❌ 错误: PostgreSQL 容器未运行"
    echo "请先启动数据库: docker-compose up -d postgres"
    exit 1
fi

echo "✅ 数据库容器已运行"
echo ""

# 进入 server 目录
cd apps/calendar-memo/server

echo "⏳ 安装依赖..."
pnpm install
echo "✅ 依赖安装完成"
echo ""

echo "⏳ 生成 Prisma Client..."
# 使用本地安装的 prisma，避免 npx 下载新版本
./node_modules/.bin/prisma generate
echo "✅ Prisma Client 生成完成"
echo ""

echo "⏳ 运行数据迁移脚本..."
echo ""
# 使用本地安装的 tsx
./node_modules/.bin/tsx scripts/migrate-memo-completions.ts
echo ""
echo "✅ 迁移完成！"
