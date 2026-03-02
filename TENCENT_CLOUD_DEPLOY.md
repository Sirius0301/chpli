# 腾讯云 CVM 部署完整指南

## 📋 部署前准备

### 1. 购买 CVM 实例
- **地域**: 选择靠近用户的地域（如广州、上海、北京）
- **实例规格**: 
  - 推荐: 2核4G 或更高
  - 最低: 1核2G（仅测试使用）
- **镜像**: 
  - 推荐: CentOS 8.2 / Ubuntu 20.04 LTS
- **系统盘**: 50GB SSD 云硬盘
- **公网带宽**: 3Mbps 或以上

### 2. 配置安全组
登录 [腾讯云控制台](https://console.cloud.tencent.com/cvm/securitygroup) 配置安全组规则：

| 协议 | 端口 | 来源 | 说明 |
|-----|------|-----|------|
| TCP | 22 | 你的本地IP/32 | SSH（限制访问） |
| TCP | 80 | 0.0.0.0/0 | HTTP 访问 |
| TCP | 3001 | 0.0.0.0/0 | 后端 API（可选，建议仅内网访问） |

> ⚠️ **安全提示**: 生产环境建议关闭 3001 端口公网访问，只开放 80 端口

### 3. 准备 SSH 密钥
确保可以通过 SSH 连接到服务器：
```bash
ssh root@你的服务器IP
```

---

## 🚀 一键部署（推荐）

### 方式一：本地构建后上传（国内服务器推荐）

适合国内服务器，避免在服务器上拉取 Docker 镜像缓慢的问题。

```bash
# 1. 在项目根目录执行
./scripts/deploy-to-cvm.sh 你的服务器IP

# 例如
./scripts/deploy-to-cvm.sh 123.456.789.0
```

脚本会自动完成：
- ✅ 本地构建 Docker 镜像
- ✅ 保存并压缩镜像
- ✅ 上传到服务器
- ✅ 安装 Docker（如未安装）
- ✅ 加载镜像并启动服务
- ✅ 初始化数据库

### 方式二：服务器直接构建

适合海外服务器或已有 Docker 环境的服务器。

```bash
# 1. 连接服务器
ssh root@你的服务器IP

# 2. 安装 Git 并克隆项目
yum install -y git  # CentOS
# 或
apt-get update && apt-get install -y git  # Ubuntu/Debian

cd /opt
git clone https://github.com/your-repo/chpli.git
cd chpli

# 3. 运行部署脚本
chmod +x deploy.sh
./deploy.sh

# 4. 构建并启动
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🔧 手动部署步骤

如果一键脚本遇到问题，可以手动执行：

### 步骤 1: 连接服务器并安装 Docker

```bash
ssh root@你的服务器IP

# 安装 Docker
curl -fsSL https://get.docker.com | bash
systemctl enable docker --now

# 验证安装
docker --version
docker-compose --version
```

### 步骤 2: 上传项目代码

在本地执行：
```bash
# 方式 1: 使用 scp
cd /path/to/chpli
tar czvf chpli.tar.gz --exclude=node_modules --exclude=.git .
scp chpli.tar.gz root@服务器IP:/opt/

ssh root@服务器IP "cd /opt && tar xzvf chpli.tar.gz && mv chpli chpli-app"

# 方式 2: 使用 git
git clone https://github.com/your-repo/chpli.git
```

### 步骤 3: 配置环境变量

```bash
cd /opt/chpli

# 创建环境变量文件
cat > .env << 'EOF'
SERVER_IP=你的服务器公网IP
POSTGRES_USER=chpli
POSTGRES_PASSWORD=你的强密码
POSTGRES_DB=chpli
JWT_SECRET=你的JWT密钥
VITE_API_URL=http://你的服务器公网IP:3001
CORS_ORIGIN=*
EOF
```

### 步骤 4: 启动服务

```bash
# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d --build

# 查看日志
docker-compose logs -f

# 等待数据库初始化完成后，按 Ctrl+C 退出日志
```

---

## ✅ 部署验证

### 测试访问
```bash
# 测试前端
curl http://你的服务器IP

# 测试后端 API
curl http://你的服务器IP:3001/api/health

# 测试完整流程
curl -X POST http://你的服务器IP:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test","code":"123456"}'
```

### 浏览器访问
打开浏览器访问：`http://你的服务器IP`

---

## 🔒 安全配置（生产环境必需）

### 1. 修改默认密码

编辑 `.env` 文件：
```bash
cd /opt/chpli
vi .env

# 修改以下配置
POSTGRES_PASSWORD=你的强密码（至少16位）
JWT_SECRET=openssl rand -base64 32 生成的密钥
```

### 2. 关闭后端端口公网访问

修改 `docker-compose.prod.yml`：
```yaml
calendar-memo-server:
  ports:
    # 只监听本地，不暴露到公网
    - "127.0.0.1:3001:3001"
```

重启服务：
```bash
docker-compose down
docker-compose up -d
```

### 3. 配置防火墙（云服务器）

```bash
# CentOS
systemctl start firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --reload

# Ubuntu/Debian
ufw allow 80/tcp
ufw enable
```

### 4. 配置 HTTPS（使用 Let's Encrypt）

```bash
# 安装 certbot
yum install -y certbot  # CentOS
# 或
apt-get install -y certbot  # Ubuntu

# 获取证书（确保域名已解析到服务器）
certbot certonly --standalone -d yourdomain.com

# 配置 Nginx 反向代理（参考 DEPLOY.md）
```

---

## 🗄️ 数据备份

### 自动备份脚本

创建备份脚本：
```bash
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec chpli-postgres pg_dump -U chpli chpli > $BACKUP_DIR/chpli_$DATE.sql

# 保留最近 7 天的备份
find $BACKUP_DIR -name "chpli_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/backup.sh
```

配置定时任务：
```bash
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /opt/backup.sh
```

---

## 🐛 常见问题

### 问题 1: 无法访问网站

**检查清单：**
1. 安全组是否开放 80 端口
2. 防火墙是否放行
3. Docker 服务是否正常运行

```bash
# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f calendar-memo-web

# 检查端口监听
netstat -tlnp | grep 80
```

### 问题 2: 数据库连接失败

```bash
# 检查数据库状态
docker-compose ps postgres
docker-compose logs postgres

# 进入数据库容器检查
docker exec -it chpli-postgres psql -U chpli -d chpli -c "\dt"
```

### 问题 3: CORS 跨域错误

修改 `.env` 中的 CORS 配置：
```bash
# 从
CORS_ORIGIN=*

# 改为具体 IP
CORS_ORIGIN=http://你的服务器IP
```

然后重启：
```bash
docker-compose restart calendar-memo-server
```

### 问题 4: 上传文件失败

检查上传目录权限：
```bash
docker exec chpli-calendar-memo-server ls -la /app/uploads
docker exec chpli-calendar-memo-server chmod 755 /app/uploads
```

---

## 📞 获取帮助

如果部署遇到问题：

1. 查看服务日志：`docker-compose logs -f`
2. 检查环境变量：`cat .env`
3. 重启服务：`docker-compose restart`
4. 完全重置：`docker-compose down -v && docker-compose up -d`

---

## 📁 部署文件说明

| 文件 | 说明 |
|-----|------|
| `docker-compose.prod.yml` | 生产环境 Docker Compose 配置 |
| `deploy.sh` | 服务器端部署脚本 |
| `scripts/deploy-to-cvm.sh` | 本地一键部署脚本 |
| `DEPLOY.md` | 详细部署文档 |
| `TENCENT_CLOUD_DEPLOY.md` | 本文件，腾讯云专用指南 |

---

## ✨ 部署完成！

部署完成后，你可以：
- 🌐 访问 `http://你的服务器IP` 使用应用
- 🔧 使用 `docker-compose logs -f` 查看实时日志
- 💾 数据库自动持久化，重启数据不丢失
- 🔄 使用 `docker-compose pull && docker-compose up -d` 更新版本
