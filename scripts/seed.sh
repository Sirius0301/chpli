#!/bin/bash
# =============================================================================
# Chpli Monorepo 测试数据填充脚本
# =============================================================================
# 一键填充开发环境测试数据
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

SQL_FILE="$PROJECT_ROOT/scripts/seed-dev-data.sql"

# 检查 PostgreSQL 是否运行
check_postgres() {
  if ! docker exec chpli-postgres pg_isready -U chpli >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ PostgreSQL 未运行，正在启动...${NC}"
    docker-compose up -d postgres >/dev/null 2>&1
    sleep 3
    if ! docker exec chpli-postgres pg_isready -U chpli >/dev/null 2>&1; then
      echo "PostgreSQL 启动失败"
      exit 1
    fi
  fi
}

# 执行 seed
run_seed() {
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  🌱 正在填充测试数据...${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  psql postgresql://chpli:chpli_secret@localhost:5432/chpli -f "$SQL_FILE"

  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  ✅ 测试数据填充完成${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${CYAN}测试账号:${NC}"
  echo -e "    邮箱:    ${GREEN}test@example.com${NC}"
  echo -e "    密码:    ${GREEN}Test123!@#${NC}"
  echo -e "    用户名:  ${GREEN}测试用户${NC}"
  echo ""
  echo -e "  ${CYAN}数据概览:${NC}"

  docker exec chpli-postgres psql -U chpli -d chpli -t -c "
    SELECT '  Users' || REPEAT(' ', 14) || COUNT(*) FROM um_users;
    SELECT '  Calendar Memos' || REPEAT(' ', 3) || COUNT(*) FROM cm_memos;
    SELECT '  Calendar Tags' || REPEAT(' ', 4) || COUNT(*) FROM cm_tags;
    SELECT '  Bookmarks' || REPEAT(' ', 8) || COUNT(*) FROM bm_bookmarks;
    SELECT '  Bookmark Tags' || REPEAT(' ', 4) || COUNT(*) FROM bm_tags;
    SELECT '  Bookmark Clicks' || REPEAT(' ', 2) || COUNT(*) FROM bm_click_logs;
  " 2>/dev/null | grep -v '^$'

  echo ""
}

check_postgres
run_seed
