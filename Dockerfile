FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npm run build --workspace @nexus/shared \
  && npm run prisma:generate --workspace @nexus/api \
  && npm run build --workspace @nexus/api \
  && chmod +x apps/api/docker-entrypoint.sh

WORKDIR /app/apps/api

EXPOSE 3333

CMD ["./docker-entrypoint.sh"]
