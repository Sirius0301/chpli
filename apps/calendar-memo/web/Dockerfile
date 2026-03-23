# Multi-stage build for Calendar Memo Web
FROM node:20-alpine AS builder

ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /app

# 复制 package.json（已移除 workspace 依赖）
COPY apps/calendar-memo/web/package.json ./
RUN sed -i '/@chpli\/calendar-memo-shared/d' package.json

# 复制其他配置文件
COPY apps/calendar-memo/web/tsconfig.json apps/calendar-memo/web/tsconfig.node.json \
     apps/calendar-memo/web/vite.config.ts apps/calendar-memo/web/tailwind.config.js \
     apps/calendar-memo/web/postcss.config.js apps/calendar-memo/web/index.html \
     apps/calendar-memo/web/nginx.conf ./

# 复制源码
COPY apps/calendar-memo/web/src ./src

# 安装依赖（纯前端包）
RUN npm install

# 构建
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
