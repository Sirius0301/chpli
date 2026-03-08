#!/bin/bash

# 运行 SQL 迁移脚本
# 为非重复备忘录创建 completion 记录

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 加载环境变量
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

# 数据库连接信息
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${POSTGRES_DB:-chpli}
DB_USER=${POSTGRES_USER:-chpli}
DB_PASSWORD=${DB_PASSWORD:-chpli_secret}

echo "运行 SQL 迁移脚本..."
echo "数据库: $DB_NAME"
echo "用户: $DB_USER"

# 运行 SQL 脚本
export PGPASSWORD="$DB_PASSWORD"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/migrate-memo-completions.sql"

echo ""
echo "SQL 迁移完成！"
echo ""
echo "注意：此脚本只处理了非重复备忘录。"
echo "如需处理重复备忘录，请运行: pnpm migrate:completions"
