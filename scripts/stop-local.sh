#!/bin/bash
# =============================================================================
# Chpli Monorepo 本地开发停止脚本
# =============================================================================
# 用法:
#   ./scripts/stop-local.sh           # 停止所有服务 + PostgreSQL
#   ./scripts/stop-local.sh services  # 仅停止应用服务，保留数据库
#   ./scripts/stop-local.sh <name>    # 停止单个服务
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}ℹ${NC}  $1"; }
log_ok()    { echo -e "${GREEN}✓${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}⚠${NC}  $1"; }
log_err()   { echo -e "${RED}✗${NC}  $1"; }
log_step()  { echo -e "\n${CYAN}▶${NC} ${CYAN}$1${NC}"; }

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

PIDS_DIR="$PROJECT_ROOT/logs/pids"
LOGS_DIR="$PROJECT_ROOT/logs"

# 所有已知的服务名称
ALL_SERVICES=(
  "user-manager"
  "calendar-memo-server"
  "bookmark-server"
  "portal-web"
  "calendar-memo-web"
  "bookmark-web"
)

# 停止单个服务（通过 PID 文件）
stop_by_pidfile() {
  local name=$1
  local pidfile="$PIDS_DIR/${name}.pid"

  if [ ! -f "$pidfile" ]; then
    return 1
  fi

  local pid
  pid=$(cat "$pidfile" 2>/dev/null)
  if [ -z "$pid" ]; then
    rm -f "$pidfile"
    return 1
  fi

  if ! kill -0 "$pid" >/dev/null 2>&1; then
    rm -f "$pidfile"
    return 1
  fi

  # 先优雅终止
  kill "$pid" >/dev/null 2>&1 || true

  # 等待进程退出（最多 5 秒）
  local retries=10
  while kill -0 "$pid" >/dev/null 2>&1 && [ $retries -gt 0 ]; do
    sleep 0.5
    retries=$((retries - 1))
  done

  # 强制终止（如果还在）
  if kill -0 "$pid" >/dev/null 2>&1; then
    kill -9 "$pid" >/dev/null 2>&1 || true
  fi

  rm -f "$pidfile"
  return 0
}

# 通过进程名模式终止（兜底方案）
kill_by_pattern() {
  local pattern=$1
  local label=$2

  if pgrep -f "$pattern" >/dev/null 2>&1; then
    pkill -f "$pattern" 2>/dev/null || true
    log_ok "$label 已停止"
  fi
}

# 停止所有应用服务
stop_all_services() {
  log_step "停止应用服务"
  local stopped=0

  for svc in "${ALL_SERVICES[@]}"; do
    if stop_by_pidfile "$svc"; then
      log_ok "$svc 已停止"
      stopped=$((stopped + 1))
    fi
  done

  # 兜底：通过进程模式清理残留
  kill_by_pattern "tsx watch.*user-manager" "User Manager (tsx)"
  kill_by_pattern "tsx watch.*calendar-memo/server" "Calendar Memo Server (tsx)"
  kill_by_pattern "uvicorn app.main:app.*8001" "Bookmark Server (uvicorn)"
  kill_by_pattern "vite.*apps/portal/web" "Portal Web (vite)"
  kill_by_pattern "vite.*apps/calendar-memo/web" "Calendar Memo Web (vite)"
  kill_by_pattern "vite.*apps/bookmark-manager/web" "Bookmark Web (vite)"

  if [ $stopped -eq 0 ]; then
    log_warn "没有检测到正在运行的服务"
  else
    log_ok "共停止 $stopped 个服务"
  fi
}

# 停止 PostgreSQL
stop_postgres() {
  log_step "停止 PostgreSQL"
  if docker ps | grep -q chpli-postgres; then
    if docker-compose stop postgres >/dev/null 2>&1; then
      log_ok "PostgreSQL 已停止"
    else
      docker stop chpli-postgres >/dev/null 2>&1 || true
      log_ok "PostgreSQL 已停止"
    fi
  else
    log_warn "PostgreSQL 未运行"
  fi
}

# 停止单个服务
stop_single() {
  local name=$1
  local found=false

  for svc in "${ALL_SERVICES[@]}"; do
    if [ "$svc" = "$name" ]; then
      found=true
      if stop_by_pidfile "$name"; then
        log_ok "$name 已停止"
      else
        log_warn "$name 未运行"
      fi
      break
    fi
  done

  if [ "$found" = false ]; then
    log_err "未知服务: $name"
    echo "可用服务: ${ALL_SERVICES[*]}"
    exit 1
  fi
}

# 清理所有日志
show_cleanup_hint() {
  echo ""
  echo -e "${CYAN}提示:${NC}"
  echo -e "  日志文件保留在 ${MAGENTA}$LOGS_DIR/${NC}"
  echo -e "  如需清理日志，可运行: ${YELLOW}rm -rf $LOGS_DIR/*.log${NC}"
}

# 主流程
main() {
  local mode="${1:-all}"

  echo -e "${CYAN}"
  echo '   ________  ___  __    ___ '
  echo '  / ___/ _ \/ _ \/ /   / _ |'
  echo ' / /__/ , _/ // / /__/ / __ |'
  echo ' \___/_/|_/____/____/_/ /_/|_|'
  echo -e "${NC}"
  echo -e "${MAGENTA}  Chpli Monorepo 本地开发停止工具${NC}\n"

  if [ "$mode" = "all" ]; then
    stop_all_services
    stop_postgres
    show_cleanup_hint

  elif [ "$mode" = "services" ]; then
    stop_all_services

  elif [ "$mode" = "db" ] || [ "$mode" = "postgres" ]; then
    stop_postgres

  else
    stop_single "$mode"
  fi

  echo ""
  log_ok "操作完成"
}

main "$@"
