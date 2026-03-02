FROM node:20-alpine

# Install pnpm and openssl
RUN apk add --no-cache openssl && npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/calendar-memo/shared ./apps/calendar-memo/shared
COPY apps/calendar-memo/server/package.json ./apps/calendar-memo/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/calendar-memo/shared ./apps/calendar-memo/shared
COPY apps/calendar-memo/server ./apps/calendar-memo/server

# Build
WORKDIR /app/apps/calendar-memo/server
RUN npx prisma generate
RUN pnpm build

# Create uploads directory
RUN mkdir -p /app/uploads

# Copy entrypoint script
COPY apps/calendar-memo/server/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set environment
ENV NODE_ENV=production
ENV PORT=3001
ENV UPLOAD_DIR=/app/uploads

EXPOSE 3001

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
