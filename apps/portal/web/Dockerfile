# Multi-stage build for Portal Web
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY apps/portal/web/package.json ./
RUN npm install

# Copy config files
COPY apps/portal/web/tsconfig.json apps/portal/web/tsconfig.node.json \
     apps/portal/web/vite.config.ts apps/portal/web/tailwind.config.js \
     apps/portal/web/postcss.config.js apps/portal/web/index.html ./

# Copy source
COPY apps/portal/web/src ./src

# Build
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
