#!/bin/bash
# Calendar Memo 本地开发启动脚本
# 使用 Docker 运行 PostgreSQL，pnpm 启动前后端

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Calendar Memo 本地开发启动工具${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查命令是否存在
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# 检查依赖
check_dependencies() {
  echo -e "${YELLOW}▶ 检查依赖...${NC}"
  
  if ! command_exists docker; then
    echo -e "${RED}✗ Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
  fi
  echo -e "${GREEN}✓ Docker${NC}"
  
  if ! command_exists docker-compose; then
    echo -e "${RED}✗ Docker Compose 未安装${NC}"
    echo "请先安装 Docker Compose"
    exit 1
  fi
  echo -e "${GREEN}✓ Docker Compose${NC}"
  
  if ! command_exists pnpm; then
    echo -e "${RED}✗ pnpm 未安装${NC}"
    echo "请先安装 pnpm: npm install -g pnpm"
    exit 1
  fi
  echo -e "${GREEN}✓ pnpm${NC}"
  
  echo ""
}

# 检查并创建 .env 文件
setup_env() {
  if [ ! -f ".env" ]; then
    echo -e "${YELLOW}▶ 创建 .env 文件...${NC}"
    cat > .env << 'EOF'
# 本地开发环境配置
NODE_ENV=development

# PostgreSQL 配置
POSTGRES_USER=chpli
POSTGRES_PASSWORD=chpli_secret
POSTGRES_DB=chpli
POSTGRES_PORT=5432
DATABASE_URL="postgresql://chpli:chpli_secret@localhost:5432/chpli?schema=public"

# JWT 配置
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# 端口配置
SERVER_PORT=3001
WEB_PORT=5173
VITE_API_URL=http://localhost:3001
EOF
    echo -e "${GREEN}✓ .env 文件已创建${NC}"
  else
    echo -e "${GREEN}✓ .env 文件已存在${NC}"
  fi
  
  # 设置后端 .env
  if [ ! -f "apps/calendar-memo/server/.env" ]; then
    cp .env apps/calendar-memo/server/.env
    echo -e "${GREEN}✓ 后端 .env 已创建${NC}"
  fi
  
  echo ""
}

# 启动 PostgreSQL
start_postgres() {
  echo -e "${YELLOW}▶ 启动 PostgreSQL...${NC}"
  
  # 检查是否已在运行
  if docker ps | grep -q chpli-postgres; then
    echo -e "${GREEN}✓ PostgreSQL 已在运行${NC}"
  else
    docker-compose up -d postgres
    echo -e "${GREEN}✓ PostgreSQL 启动成功${NC}"
    
    # 等待数据库就绪
    echo -e "${YELLOW}  等待数据库就绪...${NC}"
    sleep 3
    
    until docker exec chpli-postgres pg_isready -U chpli > /dev/null 2>&1; do
      echo -e "${YELLOW}  等待数据库...${NC}"
      sleep 2
    done
    echo -e "${GREEN}✓ 数据库已就绪${NC}"
  fi
  
  echo ""
}

# 初始化数据库
init_database() {
  echo -e "${YELLOW}▶ 初始化数据库...${NC}"
  
  cd apps/calendar-memo/server
  
  # 检查是否需要安装依赖
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}  安装后端依赖...${NC}"
    pnpm install
  fi
  
  # 生成 Prisma Client
  echo -e "${YELLOW}  生成 Prisma Client...${NC}"
  npx prisma generate
  
  # 推送数据库 schema
  echo -e "${YELLOW}  推送数据库 schema...${NC}"
  npx prisma db push --accept-data-loss
  
  cd ../../..
  echo -e "${GREEN}✓ 数据库初始化完成${NC}"
  echo ""
}

# 安装依赖
install_deps() {
  echo -e "${YELLOW}▶ 检查依赖...${NC}"
  
  # 根目录
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}  安装根目录依赖...${NC}"
    pnpm install
  fi
  
  # 后端
  if [ ! -d "apps/calendar-memo/server/node_modules" ]; then
    echo -e "${YELLOW}  安装后端依赖...${NC}"
    cd apps/calendar-memo/server
    pnpm install
    cd ../../..
  fi
  
  # 前端
  if [ ! -d "apps/calendar-memo/web/node_modules" ]; then
    echo -e "${YELLOW}  安装前端依赖...${NC}"
    cd apps/calendar-memo/web
    pnpm install
    cd ../../..
  fi
  
  echo -e "${GREEN}✓ 依赖检查完成${NC}"
  echo ""
}

# 启动后端
start_backend() {
  echo -e "${YELLOW}▶ 启动后端服务 (端口 3001)...${NC}"
  
  # 创建日志目录
  mkdir -p logs
  
  cd apps/calendar-memo/server
  
  # 检查端口是否被占用
  if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${RED}✗ 端口 3001 已被占用${NC}"
    echo "请关闭占用该端口的进程后再试"
    exit 1
  fi
  
  # 后台启动，日志输出到项目目录 (server目录下需 ../../../ 才能到根目录)
  pnpm dev > ../../../logs/server.log 2>&1 &
  SERVER_PID=$!
  
  # 等待服务启动
  echo -e "${YELLOW}  等待后端启动...${NC}"
  for i in {1..30}; do
    if curl -s http://localhost:3001/ > /dev/null 2>&1; then
      echo -e "${GREEN}✓ 后端启动成功 (PID: $SERVER_PID)${NC}"
      echo -e "${BLUE}  日志: tail -f logs/server.log${NC}"
      cd ../../..
      return 0
    fi
    sleep 1
  done
  
  echo -e "${RED}✗ 后端启动失败${NC}"
  echo "查看日志: tail -f logs/server.log"
  cd ../../..
  exit 1
}

# 启动前端
start_frontend() {
  echo ""
  echo -e "${YELLOW}▶ 启动前端服务 (端口 5173)...${NC}"
  
  cd apps/calendar-memo/web
  
  # 检查端口是否被占用
  if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${RED}✗ 端口 5173 已被占用${NC}"
    echo "请关闭占用该端口的进程后再试"
    exit 1
  fi
  
  # 前台启动（会阻塞）
  echo -e "${GREEN}✓ 启动前端...${NC}"
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${GREEN}  所有服务已启动！${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
  echo -e "  前端: ${GREEN}http://localhost:5173${NC}"
  echo -e "  后端: ${GREEN}http://localhost:3001${NC}"
  echo -e "  数据库: ${GREEN}localhost:5432${NC}"
  echo ""
  echo -e "  ${YELLOW}常用命令:${NC}"
  echo -e "    查看后端日志: ${BLUE}tail -f /tmp/chpli-server.log${NC}"
  echo -e "    停止所有服务: ${BLUE}./stop.sh${NC} 或 ${BLUE}Ctrl+C${NC}"
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo ""
  
  pnpm dev
}

# 清理函数
cleanup() {
  echo ""
  echo -e "${YELLOW}▶ 正在停止服务...${NC}"
  
  # 停止后端
  pkill -f "tsx watch" 2>/dev/null || true
  
  echo -e "${GREEN}✓ 服务已停止${NC}"
  echo -e "${BLUE}  日志保存在: logs/server.log${NC}"
}

# 捕获 Ctrl+C
trap cleanup EXIT

# 主流程
main() {
  check_dependencies
  setup_env
  install_deps
  start_postgres
  init_database
  start_backend
  start_frontend
}

# 根据参数执行
if [ "$1" == "db" ]; then
  # 只启动数据库
  check_dependencies
  setup_env
  start_postgres
  init_database
  echo -e "${GREEN}✓ 数据库已就绪，可以手动启动前后端${NC}"
  
elif [ "$1" == "install" ]; then
  # 只安装依赖
  install_deps
  
elif [ "$1" == "help" ] || [ "$1" == "-h" ]; then
  echo "用法: $0 [选项]"
  echo ""
  echo "选项:"
  echo "  (无参数)    启动完整开发环境（数据库 + 后端 + 前端）"
  echo "  db          只启动并初始化数据库"
  echo "  install     只安装依赖"
  echo "  help        显示帮助"
  echo ""
  echo "示例:"
  echo "  $0          # 启动完整环境"
  echo "  $0 db       # 只启动数据库"
  
else
  main
fi
