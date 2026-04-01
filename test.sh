#!/bin/bash
set -e

echo "ShopSavvy NestJS Module Tests"
echo "=============================="

echo "Running structural checks..."
echo ""

echo "Checking required files..."
REQUIRED="src/index.ts src/shopsavvy.module.ts src/shopsavvy.service.ts src/constants.ts package.json README.md"
MISSING=0
for f in $REQUIRED; do
  if [ ! -f "$f" ]; then
    echo "  Missing: $f"
    MISSING=$((MISSING + 1))
  fi
done
if [ $MISSING -eq 0 ]; then
  echo "  All required files present ($(echo $REQUIRED | wc -w | tr -d ' ') files)"
else
  echo "  $MISSING required files missing"
  exit 1
fi

echo "Checking TypeScript syntax..."
if command -v bun &> /dev/null; then
  ERRORS=0
  for f in src/*.ts; do
    if ! bun build --no-bundle "$f" --outfile /tmp/nestjs-shopsavvy-check.js > /dev/null 2>&1; then
      echo "  Syntax error: $f"
      ERRORS=$((ERRORS + 1))
    fi
  done
  if [ $ERRORS -eq 0 ]; then
    echo "  All TypeScript files pass syntax check"
  else
    echo "  $ERRORS files have syntax errors"
    exit 1
  fi
  rm -f /tmp/nestjs-shopsavvy-check.js
fi

echo ""
echo "All unit checks passed"
