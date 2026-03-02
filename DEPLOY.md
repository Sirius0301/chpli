# 腾讯云 CVM 部署指南

## 1. 服务器准备

### 购买腾讯云 CVM
- **镜像**: CentOS 8 / Ubuntu 20.04 / Debian 11
- **配置**: 2核4G 或以上
- **带宽**: 3Mbps 或以上
- **安全组**: 开放端口 80 (HTTP)、3001 (后端 API)

### 安全组配置
```
入站规则:
- TCP 80   0.0.0.0/0   HTTP
- TCP 3001 0.0.0.0/0   后端 API
- TCP 22   你的IP      SSH (限制访问)
```

---

## 2. 快速部署

### 方式一：使用部署脚本（推荐）

```bash
# 1. 连接服务器
ssh root@你的服务器IP

# 2. 下载并运行部署脚本
curl -fsSL https://raw.githubusercontent.com/your-repo/chpli/main/deploy.sh | sudo bash

# 3. 上传项目代码到 /opt/chpli
# 使用 scp 或 git clone

# 4. 构建并启动
cd /opt/chpli
docker-compose up -d --build
```

### 方式二：手动部署

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | bash
systemctl enable docker --now

# 2. 安装 Docker Compose
DOCKER_COMPOSE_VERSION=v2.23.0
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 3. 克隆项目
cd /opt
git clone https://github.com/your-repo/chpli.git
cd chpli

# 4. 配置环境变量
export SERVER_IP=$(curl -s ifconfig.me)
cat > .env << EOF
SERVER_IP=$SERVER_IP
POSTGRES_USER=chpli
POSTGRES_PASSWORD=$(openssl rand -base64 16)
POSTGRES_DB=chpli
JWT_SECRET=$(openssl rand -base64 32)
VITE_API_URL=http://$SERVER_IP:3001
CORS_ORIGIN=*
EOF

# 5. 启动服务
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 3. 本地构建后上传（推荐国内服务器）

由于国内服务器拉取 Docker 镜像较慢，建议在本地构建后上传：

```bash
# 1. 在本地构建（Mac/Linux）
export SERVER_IP=你的服务器IP
docker-compose -f docker-compose.prod.yml build

# 2. 保存镜像
docker save chpli-calendar-memo-server chpli-calendar-memo-web > chpli-images.tar

# 3. 上传到服务器
scp chpli-images.tar root@$SERVER_IP:/opt/chpli/
scp docker-compose.prod.yml root@$SERVER_IP:/opt/chpli/

# 4. 在服务器加载镜像
ssh root@$SERVER_IP "cd /opt/chpli && docker load < chpli-images.tar && docker-compose up -d"
```

---

## 4. 配置域名（可选）

如果使用域名，修改 `.env`：

```bash
VITE_API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

然后使用 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:80;
    }
}
```

---

## 5. 常用命令

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 更新代码后重新构建
docker-compose up -d --build

# 备份数据库
docker exec chpli-postgres pg_dump -U chpli chpli > backup.sql

# 恢复数据库
docker exec -i chpli-postgres psql -U chpli chpli < backup.sql
```

---

## 6. 故障排查

### 无法访问
```bash
# 检查防火墙
systemctl status firewalld
iptables -L -n | grep 80

# 检查安全组（腾讯云控制台）
# 确保入站规则允许 80 和 3001 端口

# 检查服务状态
docker-compose ps
docker-compose logs
```

### 数据库连接失败
```bash
# 检查数据库状态
docker exec chpli-postgres pg_isready

# 重置数据库（会丢失数据）
docker-compose down -v
docker-compose up -d
```

### CORS 错误
修改 `docker-compose.prod.yml` 中的 `CORS_ORIGIN` 为具体 IP：
```yaml
environment:
  - CORS_ORIGIN=http://你的服务器IP
```

---

## 7. 安全建议

1. **修改默认密码**: 编辑 `.env` 文件，修改 `POSTGRES_PASSWORD` 和 `JWT_SECRET`
2. **限制端口访问**: 生产环境关闭 3001 端口公网访问，只开放 80 端口
3. **使用 HTTPS**: 配置 SSL 证书
4. **定期备份**: 设置定时任务备份数据库

```bash
# 设置定时备份
crontab -e
# 添加: 0 2 * * * cd /opt/chpli && docker exec chpli-postgres pg_dump -U chpli chpli > backup-$(date +\%Y\%m\%d).sql
```
