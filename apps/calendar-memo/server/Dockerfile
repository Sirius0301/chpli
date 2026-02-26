# Multi-stage build for Calendar Memo Server

# Stage 1: Dependencies
FROM node:20-alpine AS deps

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json ./
COPY apps/calendar-memo/shared ./apps/calendar-memo/shared
COPY apps/calendar-memo/server/package.json ./apps/calendar-memo/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/calendar-memo/shared ./apps/calendar-memo/shared
COPY --from=deps /app/apps/calendar-memo/server/node_modules ./apps/calendar-memo/server/node_modules

# Copy source code
COPY apps/calendar-memo/shared ./apps/calendar-memo/shared
COPY apps/calendar-memo/server ./apps/calendar-memo/server

# Build TypeScript
WORKDIR /app/apps/calendar-memo/server
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/calendar-memo/server/dist ./dist
COPY --from=builder /app/apps/calendar-memo/server/node_modules ./node_modules
COPY --from=builder /app/node_modules ./node_modules

# Create uploads directory
RUN mkdir -p /app/uploads

# Set environment
ENV NODE_ENV=production
ENV PORT=3001
ENV UPLOAD_DIR=/app/uploads

EXPOSE 3001

CMD ["node", "dist/index.js"]
