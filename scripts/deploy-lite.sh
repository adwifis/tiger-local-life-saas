#!/usr/bin/env bash
set -euo pipefail

echo "== AI Project Starter Lite Deployment =="

if [ ! -f ".env" ]; then
  echo "Missing .env. Copy .env.example to .env and fill production values first."
  exit 1
fi

echo "1/7 Running security audit"
npm run security:audit

echo "2/7 Installing dependencies"
npm ci

echo "3/7 Checking environment"
npm run check:env

echo "4/7 Generating Prisma client"
npm run db:generate

echo "5/7 Applying database schema"
npm run db:push

echo "6/7 Building application"
npm run build

echo "7/7 Starting Docker services"
docker compose up -d --build

echo "Deployment command finished."
echo "Verify with: npm run verify:runtime"
