# syntax=docker/dockerfile:1

# ------------------------------------------------------------
# Stage 1: Build & Dependencies
# ------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install required build tools and libraries for Prisma on Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy dependency definitions
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and build config
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript to dist/
RUN npm run build

# Remove development dependencies to keep production footprint minimal
RUN npm prune --omit=dev

# ------------------------------------------------------------
# Stage 2: Production Runner
# ------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime utilities:
# - openssl & libc6-compat: Prisma engine runtime
# - dumb-init: PID 1 signal handling
# - curl: Container healthchecks
RUN apk add --no-cache openssl libc6-compat dumb-init curl

ENV NODE_ENV=production
ENV PORT=5001

# Copy build artifacts and dependencies from builder stage
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node public ./public

# Run as non-root user
USER node

EXPOSE 5001

# Container healthcheck against /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5001}/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
