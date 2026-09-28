#!/bin/bash
set -e

if [ ! -f package.json ] || ! grep -q '"name": "nestjs-shopsavvy"' package.json; then
  echo "WARNING: run test.sh from the nestjs-shopsavvy directory"
  exit 1
fi

echo "ShopSavvy NestJS Module Tests"
echo "=============================="

echo "Installing dependencies..."
bun install --silent

echo "Building + typechecking..."
bun run typecheck

echo "Running tests (real Nest app using the built package, real SDK, local API stand-in)..."
bun test tests

echo "Checking the built package loads in Node..."
node -e 'require("reflect-metadata"); const m = require("./dist"); if (typeof m.ShopSavvyModule?.forRoot !== "function" || typeof m.ShopSavvyService !== "function") process.exit(1)'
echo "  OK"

echo ""
echo "All checks passed"
