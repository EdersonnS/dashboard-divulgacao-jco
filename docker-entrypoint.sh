#!/bin/sh
set -e

echo "[entrypoint] Rodando migrations..."
node scripts/migrate.mjs

echo "[entrypoint] Rodando seed..."
node scripts/seed.mjs

echo "[entrypoint] Iniciando servidor..."
exec node server.js
