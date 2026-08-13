FROM node:22-alpine AS deps
WORKDIR /app

COPY service/package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_AZURE_AD_CLIENT_ID=""
ARG VITE_AZURE_AD_TENANT_ID=""
ARG VITE_AI365_LOGIN_URL=""
ARG VITE_ADMIN_FRONTEND_URL=""
ARG VITE_POWERBI_REPORT_ID=""
ARG VITE_POWERBI_GROUP_ID=""

ENV VITE_AZURE_AD_CLIENT_ID=$VITE_AZURE_AD_CLIENT_ID \
    VITE_AZURE_AD_TENANT_ID=$VITE_AZURE_AD_TENANT_ID \
    VITE_AI365_LOGIN_URL=$VITE_AI365_LOGIN_URL \
    VITE_ADMIN_FRONTEND_URL=$VITE_ADMIN_FRONTEND_URL \
    VITE_POWERBI_REPORT_ID=$VITE_POWERBI_REPORT_ID \
    VITE_POWERBI_GROUP_ID=$VITE_POWERBI_GROUP_ID

COPY --from=deps /app/node_modules ./node_modules
COPY service/ ./
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY service/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/src/utils ./frontend/src/utils
COPY --from=build /app/frontend/src/components/widgets ./frontend/src/components/widgets

# db:seed / rag:seed 가 읽는 SQL 스키마 — 저장소 루트 db/service/ 를 그대로 가져온다.
COPY db/service ./db/service

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/healthz').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "backend/server.js"]