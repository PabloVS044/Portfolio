# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build with Node adapter (standalone server) instead of Vercel adapter
RUN npm run build:docker

# ── Stage 2: Runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Non-root user for security
RUN addgroup -S portfolio && adduser -S portfolio -G portfolio

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

USER portfolio

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:4321 || exit 1

CMD ["node", "dist/server/entry.mjs"]
