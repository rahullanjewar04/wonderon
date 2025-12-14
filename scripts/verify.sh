#!/bin/bash

# setup-env.sh - Copy example config files if they don't exist

echo "🔍 Checking configuration files..."

# Check and copy .env
if [ ! -f ".env" ]; then
  echo "✅ .env.example → .env (copied)"
  cp .env.example .env
else
  echo "ℹ️  .env already exists (skipped)"
fi

# Check and copy config.json
if [ ! -f "config.json" ]; then
  echo "✅ config.example.json → config.json (copied)"
  cp config.example.json config.json
else
  echo "ℹ️  config.json already exists (skipped)"
fi

echo "🎉 Setup complete! Files populated where needed."
echo "💡 Edit .env and config.json with your values before starting."
echo ""

exit 0
