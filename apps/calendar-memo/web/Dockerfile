# Multi-stage build for Calendar Memo Web

# Stage 1: Build
FROM node:20-alpine AS builder

# 构建参数
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=${VITE_API_URL}

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace files first (for better caching)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy shared package
COPY apps/calendar-memo/shared ./apps/calendar-memo/shared

# Install dependencies at root level first
RUN pnpm install --frozen-lockfile

# Copy web app source code (this layer will change when code updates)
COPY apps/calendar-memo/web ./apps/calendar-memo/web

# Debug: Show what files were copied
RUN echo "=== Web App Files ===" && \
    ls -la /app/apps/calendar-memo/web/src/ && \
    echo "=== Package.json version ===" && \
    cat /app/apps/calendar-memo/web/package.json | grep version

# Build the web app
WORKDIR /app/apps/calendar-memo/web
RUN pnpm build

# Debug: Show build output
RUN echo "=== Build Output ===" && \
    ls -la /app/apps/calendar-memo/web/dist/

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/apps/calendar-memo/web/dist /usr/share/nginx/html

# Copy nginx config
COPY apps/calendar-memo/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Note: 生产环境通过 5173 端口访问 (映射到容器 80 端口)

CMD ["nginx", "-g", "daemon off;"]
