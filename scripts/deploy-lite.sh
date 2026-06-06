#!/usr/bin/env bash
set -euo pipefail

echo "== AI Project Starter Lite Deployment =="

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-tiger_local_life_saas}"
COMPOSE_CMD=(docker compose -p "${PROJECT_NAME}")

if [ ! -f ".env" ]; then
  echo "Missing .env. Copy .env.example to .env and fill production values first."
  exit 1
fi

git config --global --add safe.directory "$(pwd)" || true

echo "1/7 Running security audit"
npm run security:audit

echo "2/7 Installing dependencies"
npm ci

echo "3/7 Checking environment"
npm run check:env

echo "4/8 Starting database and cache services"
"${COMPOSE_CMD[@]}" up -d postgres redis

echo "5/8 Generating Prisma client"
npm run db:generate

echo "6/8 Applying database schema"
npm run db:push

echo "7/8 Building application"
npm run build

echo "8/8 Starting web service"
"${COMPOSE_CMD[@]}" up -d --build web

echo "Deployment command finished."
echo "Compose project: ${PROJECT_NAME}"
echo "Verify with: npm run verify:runtime"
