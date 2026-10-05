FROM node:22-bookworm-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev && npm cache clean --force

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001 \
    LOG_TO_STDOUT=true

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 owl \
    && useradd --system --uid 1001 --gid owl --home-dir /app owl

WORKDIR /app
COPY --from=builder --chown=owl:owl /app/node_modules ./node_modules
COPY --chown=owl:owl package.json package-lock.json prisma.config.ts ./
COPY --chown=owl:owl scripts ./scripts
COPY --chown=owl:owl prisma ./prisma
COPY --chown=owl:owl docker ./docker
COPY --from=builder --chown=owl:owl /app/dist ./dist

RUN chmod +x docker/entrypoint.sh \
    && mkdir -p logs/access logs/database-access logs/error logs/login logs/operation logs/system \
    && chown -R owl:owl logs

USER owl
EXPOSE 3001

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "dist/main.js"]
