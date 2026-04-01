#!/bin/sh
set -eu

if [ "${RUN_DB_MIGRATIONS:-1}" = "1" ]; then
  echo "[api] Aplicando migrations..."
  npm run prisma:deploy
fi

if [ "${RUN_DB_SEED:-0}" = "1" ]; then
  echo "[api] Executando seed..."
  npm run prisma:seed
fi

echo "[api] Iniciando servidor..."
exec npm run start
