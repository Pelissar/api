FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
COPY shared/package.json shared/package.json

RUN npm install

COPY shared shared
COPY prisma prisma
COPY scripts scripts
COPY src src
COPY tsconfig.json tsconfig.json
COPY docker-entrypoint.sh docker-entrypoint.sh

RUN npm run prisma:generate \
  && npm run build \
  && chmod +x docker-entrypoint.sh

EXPOSE 3333

CMD ["./docker-entrypoint.sh"]
