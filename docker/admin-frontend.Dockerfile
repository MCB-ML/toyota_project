FROM node:22-slim AS deps
WORKDIR /app

COPY admin/frontend/package*.json ./
RUN npm ci

FROM deps AS builder
WORKDIR /app

COPY admin/frontend/ ./
ENV NODE_ENV=production
RUN npm run build

FROM node:22-slim AS prod-deps
WORKDIR /app

COPY admin/frontend/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

FROM oven/bun:1
WORKDIR /app

ENV NODE_ENV=production \
    PORT=80 \
    LOG_DIR=/home/LogFiles/frontend

COPY admin/frontend/package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY admin/frontend/logger-server.ts ./

RUN mkdir -p /home/LogFiles/frontend && chmod 755 /home/LogFiles/frontend

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "const r=await fetch('http://127.0.0.1/api/health').catch(()=>null); process.exit(r?.ok?0:1)"

CMD ["bun", "logger-server.ts"]