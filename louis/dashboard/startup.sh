#!/bin/bash
cd /home/site/wwwroot
if [ ! -d node_modules/express ]; then
  echo "Installing server dependencies..."
  npm install --no-save --no-audit --no-fund express openai dotenv
fi
node server.js
