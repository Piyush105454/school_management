#!/bin/bash

# Configuration
APP_NAME="dps_app"

echo "🚀 Starting Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 2. Install dependencies (if any new packages)
echo "📦 Installing dependencies..."
npm install

# 3. Build the application with increased memory limit
echo "🏗️ Building the application (this may take a few minutes)..."
# Setting max-old-space-size to 1.5GB to help on 1GB RAM machines with swap
NODE_OPTIONS="--max-old-space-size=1536" npm run build

# 4. Restart the application using PM2
echo "🔄 Restarting application..."
if pm2 list | grep -q "$APP_NAME"; then
    pm2 restart "$APP_NAME"
else
    pm2 start npm --name "$APP_NAME" -- start
fi

echo "✅ Deployment Complete! Your app is now live."
