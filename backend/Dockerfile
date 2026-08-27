# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001 \
    LOG_TO_STDOUT=true

RUN groupadd --system --gid 1001 owl \
    && useradd --system --uid 1001 --gid owl --home-dir /app owl

WORKDIR /app
COPY --from=dependencies --chown=owl:owl /app/node_modules ./node_modules
COPY --chown=owl:owl . .

RUN chmod +x docker/entrypoint.sh \
    && mkdir -p logs/access logs/database-access logs/error logs/login logs/operation logs/system \
    && chown -R owl:owl logs

USER owl
EXPOSE 3001

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "src/app.js"]
