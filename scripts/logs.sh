#!/bin/bash
# =============================================================================
# Chpli Monorepo 日志查看脚本
# =============================================================================
# 用法:
#   ./scripts/logs.sh -l, --list        # 列出所有服务日志文件
#   ./scripts/logs.sh -a, --all         # 实时跟踪所有服务日志
#   ./scripts/logs.sh -s, --status      # 查看所有服务运行状态
#   ./scripts/logs.sh <service>         # 实时跟踪单个服务日志
#   ./scripts/logs.sh <service> -n 50   # 查看最后 50 行
#
# 服务名称:
#   user-manager, calendar-memo-server, bookmark-server,
#   portal-web, calendar-memo-web, bookmark-web
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGS_DIR="$PROJECT_ROOT/logs"
PIDS_DIR="$LOGS_DIR/pids"

SERVICES=(
  "user-manager:User Manager"
  "calendar-memo-server:Calendar Memo Server"
  "bookmark-server:Bookmark Server"
  "portal-web:Portal Web"
  "calendar-memo-web:Calendar Memo Web"
  "bookmark-web:Bookmark Web"
)

# 检查服务是否在运行
is_running() {
  local name=$1
  local pidfile="$PIDS_DIR/${name}.pid"
  if [ ! -f "$pidfile" ]; then
    return 1
  fi
  local pid
  pid=$(cat "$pidfile" 2>/dev/null)
  [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1
}

# 列出所有日志
list_logs() {
  echo -e "${CYAN}日志文件列表:${NC}\n"
  printf "  %-28s %-10s %s\n" "服务" "状态" "日志文件"
  echo "  $(printf '%*s' 70 '' | tr ' ' '-')"

  local has_logs=false
  for svc in "${SERVICES[@]}"; do
    IFS=':' read -r name label <<< "$svc"
    local logfile="$LOGS_DIR/${name}.log"
    local status="${GRAY}未启动${NC}"
    local size=""

    if is_running "$name"; then
      status="${GREEN}运行中${NC}"
    fi

    if [ -f "$logfile" ]; then
      has_logs=true
      size="$(du -h "$logfile" 2>/dev/null | cut -f1)"
      printf "  %-28s %-20s %s (%s)\n" "$label" "$status" "$logfile" "$size"
    else
      printf "  %-28s %-20s %s\n" "$label" "$status" "${GRAY}(无日志文件)${NC}"
    fi
  done

  if [ "$has_logs" = false ]; then
    echo ""
    echo -e "  ${YELLOW}暂无日志文件，请先运行 ./scripts/start-local.sh 启动服务${NC}"
  fi
}

# 查看服务状态
show_status() {
  echo -e "${CYAN}服务运行状态:${NC}\n"
  printf "  %-28s %-12s %-10s %s\n" "服务" "状态" "PID" "端口"
  echo "  $(printf '%*s' 70 '' | tr ' ' '-')"

  local running=0
  for svc in "${SERVICES[@]}"; do
    IFS=':' read -r name label <<< "$svc"
    local pidfile="$PIDS_DIR/${name}.pid"
    local status="${GRAY}停止${NC}"
    local pid="-"
    local port="-"

    if [ -f "$pidfile" ]; then
      pid=$(cat "$pidfile" 2>/dev/null)
      if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
        status="${GREEN}运行中${NC}"
        running=$((running + 1))
      else
        status="${RED}异常${NC}"
      fi
    fi

    # 根据服务名推断端口
    case "$name" in
      user-manager) port=3002 ;;
      calendar-memo-server) port=3001 ;;
      bookmark-server) port=8001 ;;
      portal-web) port=5173 ;;
      calendar-memo-web) port=5175 ;;
      bookmark-web) port=5174 ;;
    esac

    printf "  %-28s %-20s %-10s %s\n" "$label" "$status" "$pid" "$port"
  done

  echo ""
  echo -e "  运行中: ${GREEN}$running${NC} / ${#SERVICES[@]}"
}

# 跟踪单个日志
tail_single() {
  local name=$1
  local lines="${2:-20}"
  local follow="${3:-false}"
  local logfile="$LOGS_DIR/${name}.log"

  if [ ! -f "$logfile" ]; then
    echo -e "${RED}错误:${NC} $name 的日志文件不存在"
    return 1
  fi

  # 查找对应 label
  local label="$name"
  for svc in "${SERVICES[@]}"; do
    IFS=':' read -r svc_name svc_label <<< "$svc"
    if [ "$svc_name" = "$name" ]; then
      label="$svc_label"
      break
    fi
  done

  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  📄 $label 日志${NC}"
  if is_running "$name"; then
    echo -e "${GREEN}  状态: 运行中${NC}"
  else
    echo -e "${YELLOW}  状态: 未运行${NC}"
  fi
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  if [ "$follow" = true ]; then
    tail -n "$lines" -f "$logfile"
  else
    tail -n "$lines" "$logfile"
  fi
}

# 跟踪所有日志
tail_all() {
  local log_files=()
  local labels=()

  for svc in "${SERVICES[@]}"; do
    IFS=':' read -r name label <<< "$svc"
    local logfile="$LOGS_DIR/${name}.log"
    if [ -f "$logfile" ]; then
      log_files+=("$logfile")
      labels+=("$label")
    fi
  done

  if [ ${#log_files[@]} -eq 0 ]; then
    echo -e "${YELLOW}暂无日志文件，请先运行 ./scripts/start-local.sh 启动服务${NC}"
    exit 1
  fi

  if [ ${#log_files[@]} -eq 1 ]; then
    tail -n 20 -f "${log_files[0]}"
    return
  fi

  # 多日志同时跟踪，使用前缀区分
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  📄 实时跟踪所有服务日志 (按 Ctrl+C 退出)${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  # 构建 tail 命令：为每个日志添加颜色前缀
  local cmds=()
  local colors=("\033[0;36m" "\033[0;32m" "\033[0;33m" "\033[0;35m" "\033[0;34m" "\033[0;31m")

  for i in "${!log_files[@]}"; do
    local color="${colors[$i % ${#colors[@]}]}"
    local label="${labels[$i]}"
    # 使用 sed 为每行添加前缀和颜色
    cmds+=("tail -n 0 -F '${log_files[$i]}' 2>/dev/null | sed -u 's/^/${color}[${label}]${NC} /'")
  done

  # 并行运行所有 tail，按 Enter 分隔
  eval "(${cmds[*]})" || true
}

# 打印帮助
show_help() {
  echo -e "${CYAN}Chpli Monorepo 日志查看工具${NC}\n"
  echo "用法:"
  echo "  ./scripts/logs.sh -l, --list        列出所有日志文件"
  echo "  ./scripts/logs.sh -a, --all         实时跟踪所有日志"
  echo "  ./scripts/logs.sh -s, --status      查看服务运行状态"
  echo "  ./scripts/logs.sh <service>         实时跟踪单个服务日志"
  echo "  ./scripts/logs.sh <service> -n 50   查看最后 50 行"
  echo ""
  echo "服务名称:"
  echo "  user-manager, calendar-memo-server, bookmark-server"
  echo "  portal-web, calendar-memo-web, bookmark-web"
}

# 主流程
main() {
  local cmd="${1:-}"
  local n_lines=20
  local follow=true

  case "$cmd" in
    -l|--list)
      list_logs
      ;;
    -a|--all)
      tail_all
      ;;
    -s|--status)
      show_status
      ;;
    -h|--help|"")
      show_help
      ;;
    *)
      # 检查是否是 -n 参数先出现
      if [ "$cmd" = "-n" ]; then
        n_lines="${2:-20}"
        cmd="${3:-}"
        follow=false
      fi

      # 解析剩余参数
      local service="$cmd"
      if [ "$2" = "-n" ]; then
        n_lines="$3"
        follow=false
      fi

      if [ -z "$service" ]; then
        show_help
        exit 1
      fi

      tail_single "$service" "$n_lines" "$follow"
      ;;
  esac
}

main "$@"
