# Multi-stage build for Calendar Memo Web

# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json ./
COPY apps/calendar-memo/shared ./apps/calendar-memo/shared
COPY apps/calendar-memo/web ./apps/calendar-memo/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the web app
WORKDIR /app/apps/calendar-memo/web
RUN pnpm build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/apps/calendar-memo/web/dist /usr/share/nginx/html

# Copy nginx config
COPY apps/calendar-memo/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
