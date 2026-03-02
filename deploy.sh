#!/bin/bash
# 腾讯云 CVM 部署脚本

set -e

echo "=========================================="
echo "Calendar Memo 部署脚本"
echo "=========================================="

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then 
  echo "请使用 sudo 运行此脚本"
  exit 1
fi

# 获取服务器 IP
SERVER_IP=119.45.25.38
echo "服务器公网 IP: $SERVER_IP"

# 安装 Docker
echo ""
echo "[1/5] 安装 Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | bash
  systemctl enable docker
  systemctl start docker
  echo "Docker 安装完成"
else
  echo "Docker 已安装"
fi

# 安装 Docker Compose
echo ""
echo "[2/5] 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
  curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
  ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
  echo "Docker Compose 安装完成"
else
  echo "Docker Compose 已安装"
fi

# 创建应用目录
echo ""
echo "[3/5] 创建应用目录..."
APP_DIR="/opt/chpli"
mkdir -p $APP_DIR
cd $APP_DIR

# 生成环境变量文件
echo ""
echo "[4/5] 配置环境变量..."
JWT_SECRET=JWTSecretKey123
POSTGRES_PASSWORD=PostgresSecret123

cat > .env << EOF
# 服务器配置
SERVER_IP=$SERVER_IP

# 数据库配置
POSTGRES_USER=chpli
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=chpli
POSTGRES_PORT=5432

# JWT 密钥
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# 前端 API 地址（使用服务器 IP）
VITE_API_URL=http://$SERVER_IP:3001

# 端口配置
CALENDAR_MEMO_WEB_PORT=80
CALENDAR_MEMO_SERVER_PORT=3001

# CORS 配置（允许所有 IP 访问，生产环境建议限制具体域名）
CORS_ORIGIN=*
EOF

echo "环境变量已写入 .env 文件"

# 创建 docker-compose.yml
echo ""
echo "[5/5] 创建 docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: chpli-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-chpli}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-chpli_secret}
      POSTGRES_DB: ${POSTGRES_DB:-chpli}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-chpli}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - chpli-network

  calendar-memo-server:
    image: node:20-alpine
    container_name: chpli-server
    working_dir: /app/apps/calendar-memo/server
    command: >
      sh -c "apk add --no-cache openssl &&
             npm install -g pnpm &&
             pnpm install &&
             npx prisma generate &&
             npx prisma db push --accept-data-loss &&
             pnpm build &&
             node dist/index.js"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER:-chpli}:${POSTGRES_PASSWORD:-chpli_secret}@postgres:5432/${POSTGRES_DB:-chpli}?schema=public
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN:-*}
    ports:
      - "3001:3001"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/apps/calendar-memo/server/node_modules
      - /app/apps/calendar-memo/server/uploads
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - chpli-network

  calendar-memo-web:
    image: nginx:alpine
    container_name: chpli-web
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - calendar-memo-server
    networks:
      - chpli-network

volumes:
  postgres_data:

networks:
  chpli-network:
    driver: bridge
EOF

# 创建简单的 nginx 配置
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://calendar-memo-server:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 上传文件代理
    location /uploads/ {
        proxy_pass http://calendar-memo-server:3001/uploads/;
    }
}
EOF

echo ""
echo "=========================================="
echo "部署配置已完成！"
echo "=========================================="
echo ""
echo "应用目录: $APP_DIR"
echo "访问地址: http://$SERVER_IP"
echo ""
echo "接下来请执行:"
echo "1. 将项目代码上传到 $APP_DIR"
echo "2. 构建前端: cd $APP_DIR && docker run --rm -v \$(pwd):/app -w /app/apps/calendar-memo/web node:20-alpine sh -c \"npm install -g pnpm && pnpm install && pnpm build\" && cp -r dist ../.."
echo "3. 启动服务: docker-compose up -d"
echo ""
echo "或者使用以下命令一键部署:"
echo "  docker-compose up -d"
echo ""
