#!/bin/bash
cd /home/site/wwwroot
if [ ! -d node_modules/express ]; then
  echo "Installing server dependencies..."
  npm install --omit=dev --no-audit --no-fund
fi
node backend/server.js
