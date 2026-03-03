#!/bin/bash
# Calendar Memo 本地开发停止脚本

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}▶ 正在停止服务...${NC}"

# 停止前端 (vite)
if pgrep -f "vite" > /dev/null; then
  pkill -f "vite" 2>/dev/null || true
  echo -e "${GREEN}✓ 前端已停止${NC}"
else
  echo "  前端未运行"
fi

# 停止后端 (tsx watch)
if pgrep -f "tsx watch" > /dev/null; then
  pkill -f "tsx watch" 2>/dev/null || true
  echo -e "${GREEN}✓ 后端已停止${NC}"
else
  echo "  后端未运行"
fi

# 停止数据库
echo -e "${YELLOW}▶ 停止数据库...${NC}"
if docker ps | grep -q chpli-postgres; then
  docker-compose stop postgres
  echo -e "${GREEN}✓ 数据库已停止${NC}"
else
  echo "  数据库未运行"
fi

echo ""
echo -e "${GREEN}✓ 所有服务已停止${NC}"
