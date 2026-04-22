FROM node:20-alpine

# Install pnpm and openssl
RUN apk add --no-cache openssl && npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/auth-shared ./packages/auth-shared
COPY apps/user-manager/server/package.json ./apps/user-manager/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/auth-shared ./packages/auth-shared
COPY apps/user-manager/server ./apps/user-manager/server

# Build
WORKDIR /app/apps/user-manager/server
RUN npx prisma generate
RUN pnpm build

# Set environment
ENV NODE_ENV=production
ENV PORT=3002

# Copy entrypoint script
COPY apps/user-manager/server/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3002

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
