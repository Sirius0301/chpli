#!/bin/bash
# =============================================================================
# Chpli Monorepo 本地开发启动脚本
# =============================================================================
# 用法:
#   ./scripts/start-local.sh           # 启动全部服务
#   ./scripts/start-local.sh db        # 仅启动并初始化数据库
#   ./scripts/start-local.sh backend   # 仅启动后端服务
#   ./scripts/start-local.sh frontend  # 仅启动前端服务
#   ./scripts/start-local.sh <name>    # 启动单个服务
#
# 服务名称: postgres | user-manager | calendar-memo-server | bookmark-server |
#           portal-web | calendar-memo-web | bookmark-web
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# 颜色定义
# -----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# 配置
# -----------------------------------------------------------------------------
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# 端口映射
USER_MANAGER_PORT="${USER_MANAGER_PORT:-3002}"
CALENDAR_MEMO_SERVER_PORT="${CALENDAR_MEMO_SERVER_PORT:-3001}"
BOOKMARK_MANAGER_SERVER_PORT="${BOOKMARK_MANAGER_SERVER_PORT:-8001}"
PORTAL_WEB_PORT="${PORTAL_WEB_PORT:-5173}"
CALENDAR_MEMO_WEB_PORT="${CALENDAR_MEMO_WEB_PORT:-5175}"
BOOKMARK_MANAGER_WEB_PORT="${BOOKMARK_MANAGER_WEB_PORT:-5174}"

# 目录
LOGS_DIR="$PROJECT_ROOT/logs"
PIDS_DIR="$LOGS_DIR/pids"
mkdir -p "$LOGS_DIR" "$PIDS_DIR"

# 服务定义: 名称|启动目录|启动命令|端口|类型(node/python)
SERVICES_DEF=$(cat <<'EOF'
user-manager|apps/user-manager/server|pnpm dev|3002|node
calendar-memo-server|apps/calendar-memo/server|pnpm dev|3001|node
bookmark-server|apps/bookmark-manager/server|source .venv/bin/activate && uvicorn app.main:app --reload --port 8001 --host 0.0.0.0|8001|python
portal-web|apps/portal/web|pnpm dev|5173|node
calendar-memo-web|apps/calendar-memo/web|pnpm dev|5175|node
bookmark-web|apps/bookmark-manager/web|pnpm dev|5174|node
EOF
)

# -----------------------------------------------------------------------------
# 工具函数
# -----------------------------------------------------------------------------
log_info()  { echo -e "${BLUE}ℹ${NC}  $1"; }
log_ok()    { echo -e "${GREEN}✓${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}⚠${NC}  $1"; }
log_err()   { echo -e "${RED}✗${NC}  $1"; }
log_step()  { echo -e "\n${CYAN}▶${NC} ${CYAN}$1${NC}"; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

# 检查端口是否被占用
check_port() {
  local port=$1
  if lsof -ti:"$port" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

# 获取占用端口的进程信息
port_owner() {
  local port=$1
  lsof -ti:"$port" | xargs ps -o pid=,comm= 2>/dev/null | head -1
}

# 检查所有需要的端口
check_all_ports() {
  local ports=("$USER_MANAGER_PORT" "$CALENDAR_MEMO_SERVER_PORT" "$BOOKMARK_MANAGER_SERVER_PORT" "$PORTAL_WEB_PORT" "$CALENDAR_MEMO_WEB_PORT" "$BOOKMARK_MANAGER_WEB_PORT")
  local names=("User Manager" "Calendar Memo Server" "Bookmark Server" "Portal Web" "Calendar Memo Web" "Bookmark Web")
  local conflicts=()

  for i in "${!ports[@]}"; do
    if check_port "${ports[$i]}"; then
      conflicts+=("  ${names[$i]}: 端口 ${ports[$i]} 被占用 ($(port_owner "${ports[$i]}"))")
    fi
  done

  if [ ${#conflicts[@]} -gt 0 ]; then
    log_err "检测到端口冲突:"
    for c in "${conflicts[@]}"; do echo -e "${RED}$c${NC}"; done
    echo ""
    echo "请先运行 ./scripts/stop-local.sh 停止已有服务，或手动释放端口。"
    exit 1
  fi
}

# -----------------------------------------------------------------------------
# 依赖检查
# -----------------------------------------------------------------------------
check_dependencies() {
  log_step "检查依赖"

  if ! command_exists docker; then
    log_err "Docker 未安装，请先安装: https://docs.docker.com/get-docker/"
    exit 1
  fi
  log_ok "Docker"

  if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
    log_err "Docker Compose 未安装"
    exit 1
  fi
  log_ok "Docker Compose"

  if ! command_exists pnpm; then
    log_err "pnpm 未安装，请先安装: npm install -g pnpm"
    exit 1
  fi
  log_ok "pnpm"

  if ! command_exists python3; then
    log_err "python3 未安装，Bookmark Server 需要 Python 3.12+"
    exit 1
  fi
  log_ok "python3 ($(python3 --version))"
}

# -----------------------------------------------------------------------------
# Python 虚拟环境
# -----------------------------------------------------------------------------
setup_venv() {
  log_step "检查 Python 虚拟环境"
  local venv_path="apps/bookmark-manager/server/.venv"

  if [ ! -d "$venv_path" ]; then
    log_warn "虚拟环境不存在，正在创建..."
    python3 -m venv "$venv_path"
    log_ok "虚拟环境已创建"
  else
    log_ok "虚拟环境已存在"
  fi

  # 检查关键依赖
  if ! "$venv_path/bin/python" -c "import fastapi" 2>/dev/null; then
    log_warn "正在安装 Python 依赖（首次较慢）..."
    "$venv_path/bin/pip" install -r apps/bookmark-manager/server/requirements.txt --quiet
    log_ok "Python 依赖安装完成"
  else
    log_ok "Python 依赖已就绪"
  fi
}

# -----------------------------------------------------------------------------
# 环境变量文件
# -----------------------------------------------------------------------------
setup_env() {
  log_step "检查环境变量"

  if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
      cp .env.example .env
      log_warn ".env 已根据 .env.example 自动创建，建议检查并修改敏感配置"
    else
      log_err ".env 和 .env.example 均不存在"
      exit 1
    fi
  else
    log_ok "根目录 .env 已存在"
  fi

  # 同步到子项目（如果它们没有 .env）
  local env_targets=(
    "apps/calendar-memo/server"
    "apps/user-manager/server"
  )
  for target in "${env_targets[@]}"; do
    if [ ! -f "$target/.env" ]; then
      cp .env "$target/.env"
      log_ok "$target/.env 已创建"
    fi
  done

  # bookmark-manager server 使用独立 .env
  if [ ! -f "apps/bookmark-manager/server/.env" ]; then
    if [ -f "apps/bookmark-manager/server/.env.example" ]; then
      cp "apps/bookmark-manager/server/.env.example" "apps/bookmark-manager/server/.env"
      log_warn "apps/bookmark-manager/server/.env 已根据 .env.example 创建"
    fi
  fi
}

# -----------------------------------------------------------------------------
# 数据库
# -----------------------------------------------------------------------------
start_postgres() {
  log_step "启动 PostgreSQL"

  if docker ps | grep -q chpli-postgres; then
    log_ok "PostgreSQL 已在运行 (chpli-postgres)"
    return 0
  fi

  if docker ps -a | grep -q chpli-postgres; then
    docker start chpli-postgres >/dev/null 2>&1
  else
    docker-compose up -d postgres >/dev/null 2>&1
  fi

  log_info "等待数据库就绪..."
  local retries=30
  while [ $retries -gt 0 ]; do
    if docker exec chpli-postgres pg_isready -U chpli >/dev/null 2>&1; then
      log_ok "PostgreSQL 已就绪 (端口 5432)"
      return 0
    fi
    sleep 1
    retries=$((retries - 1))
  done

  log_err "PostgreSQL 启动超时"
  exit 1
}

stop_postgres() {
  if docker ps | grep -q chpli-postgres; then
    docker-compose stop postgres >/dev/null 2>&1 || true
  fi
}

# -----------------------------------------------------------------------------
# 依赖安装
# -----------------------------------------------------------------------------
install_deps() {
  log_step "安装 Node 依赖"

  if [ ! -d "node_modules" ] || [ ! -d "apps/portal/web/node_modules" ]; then
    log_info "正在安装 workspace 依赖（可能需要几分钟）..."
    pnpm install --prefer-offline
    log_ok "Node 依赖安装完成"
  else
    log_ok "Node 依赖已就绪"
  fi
}

# -----------------------------------------------------------------------------
# 数据库初始化
# -----------------------------------------------------------------------------
init_databases() {
  log_step "初始化数据库 Schema"

  # ⚠️ 关键：user-manager 和 calendar-memo 各自有独立的 Prisma schema，
  # 但共享同一个 PostgreSQL 数据库。如果分别执行 prisma db push，
  # 后执行的会删除前一次创建的表（因为 Prisma 认为它们"不属于当前 schema"）。
  # 解决方案：创建临时合并 schema，一次性 push 所有 Node 服务的表，
  # 然后再分别为各服务生成 Prisma Client。

  local MERGED_SCHEMA="/tmp/chpli-merged-schema.prisma"
  {
    # 取一个 generator 和一个 datasource
    sed -n '/^generator /,/^}/p; /^datasource /,/^}/p' apps/user-manager/server/prisma/schema.prisma
    echo ""
    # 合并两个服务的所有 model 和 enum
    sed -n '/^model /,/^}/p; /^enum /,/^}/p' apps/user-manager/server/prisma/schema.prisma
    echo ""
    sed -n '/^model /,/^}/p; /^enum /,/^}/p' apps/calendar-memo/server/prisma/schema.prisma
  } > "$MERGED_SCHEMA"

  # 一次性 push 合并后的 schema（避免互相覆盖删除）
  log_info "同步合并 Schema 到数据库..."
  cd apps/user-manager/server
  npx prisma db push --schema="$MERGED_SCHEMA" --accept-data-loss --skip-generate >/dev/null 2>&1
  cd "$PROJECT_ROOT"
  log_ok "数据库表结构已同步 (um_*, cm_*)"

  # 分别为各服务生成 Prisma Client
  log_info "生成 User Manager Prisma Client..."
  cd apps/user-manager/server
  npx prisma generate >/dev/null 2>&1
  cd "$PROJECT_ROOT"

  log_info "生成 Calendar Memo Prisma Client..."
  cd apps/calendar-memo/server
  npx prisma generate >/dev/null 2>&1
  cd "$PROJECT_ROOT"
  log_ok "Prisma Client 生成完成"

  # Bookmark Manager (Alembic - 不会删除其他服务的表)
  log_info "初始化 Bookmark Manager (Alembic)..."
  cd apps/bookmark-manager/server
  if [ -d ".venv" ]; then
    .venv/bin/alembic upgrade head >/dev/null 2>&1
  fi
  cd "$PROJECT_ROOT"
  log_ok "Bookmark Manager 数据库已就绪 (bm_*)"
}

# -----------------------------------------------------------------------------
# 启动单个服务
# -----------------------------------------------------------------------------
start_service() {
  local name=$1
  local dir=$2
  local cmd=$3
  local port=$4
  local type=$5

  log_info "启动 $name (端口 $port)..."

  local logfile="$LOGS_DIR/${name}.log"
  local pidfile="$PIDS_DIR/${name}.pid"

  # 如果已经有 PID 文件，先尝试停止
  if [ -f "$pidfile" ]; then
    local oldpid=$(cat "$pidfile" 2>/dev/null)
    if kill -0 "$oldpid" >/dev/null 2>&1; then
      log_warn "$name 已在运行 (PID: $oldpid)，跳过"
      return 0
    else
      rm -f "$pidfile"
    fi
  fi

  # 进入目录并启动
  cd "$PROJECT_ROOT/$dir"

  if [ "$type" = "python" ]; then
    # Python 服务：激活 .venv 后启动
    nohup bash -c "source .venv/bin/activate && $cmd" > "$logfile" 2>&1 &
  else
    # Node 服务
    nohup bash -c "$cmd" > "$logfile" 2>&1 &
  fi

  local pid=$!
  echo $pid > "$pidfile"
  cd "$PROJECT_ROOT"

  # 等待端口就绪
  local retries=30
  while [ $retries -gt 0 ]; do
    if check_port "$port"; then
      log_ok "$name 已启动 (PID: $pid, 端口: $port)"
      return 0
    fi
    sleep 1
    retries=$((retries - 1))
  done

  log_err "$name 启动失败，请查看日志: $logfile"
  return 1
}

# -----------------------------------------------------------------------------
# 停止单个服务
# -----------------------------------------------------------------------------
stop_service_by_name() {
  local name=$1
  local pidfile="$PIDS_DIR/${name}.pid"
  if [ -f "$pidfile" ]; then
    local pid=$(cat "$pidfile" 2>/dev/null)
    if [ -n "$pid" ]; then
      kill "$pid" >/dev/null 2>&1 || true
      # 等待进程退出
      local retries=10
      while kill -0 "$pid" >/dev/null 2>&1 && [ $retries -gt 0 ]; do
        sleep 0.5
        retries=$((retries - 1))
      done
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
    rm -f "$pidfile"
  fi
}

# -----------------------------------------------------------------------------
# 状态展示
# -----------------------------------------------------------------------------
show_status() {
  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  🚀 Chpli Monorepo 本地开发环境已启动${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${CYAN}前端访问地址:${NC}"
  echo -e "    Portal (统一入口)         ${GREEN}http://localhost:$PORTAL_WEB_PORT${NC}"
  echo -e "    Calendar Memo             ${GREEN}http://localhost:$CALENDAR_MEMO_WEB_PORT${NC}"
  echo -e "    Bookmark Manager          ${GREEN}http://localhost:$BOOKMARK_MANAGER_WEB_PORT${NC}"
  echo ""
  echo -e "  ${CYAN}后端 API:${NC}"
  echo -e "    User Manager              ${GREEN}http://localhost:$USER_MANAGER_PORT${NC}"
  echo -e "    Calendar Memo Server      ${GREEN}http://localhost:$CALENDAR_MEMO_SERVER_PORT${NC}"
  echo -e "    Bookmark Server           ${GREEN}http://localhost:$BOOKMARK_MANAGER_SERVER_PORT${NC}"
  echo ""
  echo -e "  ${CYAN}数据库:${NC} ${GREEN}postgresql://chpli:chpli_secret@localhost:5432/chpli${NC}"
  echo ""
  echo -e "  ${CYAN}日志目录:${NC} ${MAGENTA}$LOGS_DIR/${NC}"
  echo -e "  ${CYAN}常用命令:${NC}"
  echo -e "    查看全部日志            ${YELLOW}./scripts/logs.sh -a${NC}"
  echo -e "    查看单个服务日志        ${YELLOW}./scripts/logs.sh <服务名>${NC}"
  echo -e "    停止所有服务            ${YELLOW}./scripts/stop-local.sh${NC}"
  echo -e "    查看服务列表            ${YELLOW}./scripts/logs.sh -l${NC}"
  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
}

# -----------------------------------------------------------------------------
# 主流程
# -----------------------------------------------------------------------------
main() {
  local mode="${1:-all}"

  # 打印标题
  echo -e "${CYAN}"
  echo '   ________  ___  __    ___ '
  echo '  / ___/ _ \/ _ \/ /   / _ |'
  echo ' / /__/ , _/ // / /__/ / __ |'
  echo ' \___/_/|_/____/____/_/ /_/|_|'
  echo -e "${NC}"
  echo -e "${MAGENTA}  Chpli Monorepo 本地开发启动工具${NC}\n"

  # 通用准备
  check_dependencies
  setup_env

  # 仅数据库模式
  if [ "$mode" = "db" ]; then
    start_postgres
    init_databases
    log_ok "数据库已就绪，可手动启动各服务"
    exit 0
  fi

  # 检查端口
  if [ "$mode" = "all" ] || [ "$mode" = "backend" ] || [ "$mode" = "frontend" ]; then
    check_all_ports
  fi

  # 启动数据库
  start_postgres

  # 安装依赖
  install_deps
  setup_venv

  # 初始化数据库
  init_databases

  # 启动服务
  local failed=()

  # 定义服务启动顺序：后端先，前端后
  local backend_services=()
  local frontend_services=()

  while IFS='|' read -r name dir cmd port type; do
    [ -z "$name" ] && continue
    if [ "$type" = "node" ] && [[ "$name" == *-server* || "$name" == "user-manager" || "$name" == "bookmark-server" ]]; then
      backend_services+=("$name|$dir|$cmd|$port|$type")
    else
      frontend_services+=("$name|$dir|$cmd|$port|$type")
    fi
  done <<< "$SERVICES_DEF"

  # 根据模式启动
  if [ "$mode" = "all" ] || [ "$mode" = "backend" ]; then
    log_step "启动后端服务"
    for svc in "${backend_services[@]}"; do
      IFS='|' read -r name dir cmd port type <<< "$svc"
      if ! start_service "$name" "$dir" "$cmd" "$port" "$type"; then
        failed+=("$name")
      fi
      sleep 1
    done
  fi

  if [ "$mode" = "all" ] || [ "$mode" = "frontend" ]; then
    log_step "启动前端服务"
    for svc in "${frontend_services[@]}"; do
      IFS='|' read -r name dir cmd port type <<< "$svc"
      if ! start_service "$name" "$dir" "$cmd" "$port" "$type"; then
        failed+=("$name")
      fi
      sleep 1
    done
  fi

  # 单个服务启动
  if [ "$mode" != "all" ] && [ "$mode" != "backend" ] && [ "$mode" != "frontend" ] && [ "$mode" != "db" ]; then
    local found=false
    while IFS='|' read -r name dir cmd port type; do
      [ -z "$name" ] && continue
      if [ "$name" = "$mode" ]; then
        found=true
        if ! start_service "$name" "$dir" "$cmd" "$port" "$type"; then
          failed+=("$name")
        fi
        break
      fi
    done <<< "$SERVICES_DEF"

    if [ "$found" = false ]; then
      log_err "未知服务: $mode"
      echo "可用服务: user-manager, calendar-memo-server, bookmark-server, portal-web, calendar-memo-web, bookmark-web"
      exit 1
    fi
  fi

  # 结果汇总
  if [ ${#failed[@]} -gt 0 ]; then
    echo ""
    log_err "以下服务启动失败:"
    for f in "${failed[@]}"; do echo -e "  ${RED}- $f${NC}"; done
    exit 1
  fi

  show_status

  # 提示是否跟踪日志
  if [ "$mode" = "all" ]; then
    echo ""
    read -rp "是否实时查看所有服务日志? [y/N]: " answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
      exec ./scripts/logs.sh -a
    fi
  fi
}

# 捕获信号
cleanup_on_interrupt() {
  echo ""
  log_warn "收到中断信号，正在停止服务..."
  ./scripts/stop-local.sh >/dev/null 2>&1 || true
  exit 0
}
trap cleanup_on_interrupt INT TERM

main "$@"
