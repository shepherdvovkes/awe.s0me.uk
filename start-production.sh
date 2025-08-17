#!/bin/bash

# Production startup script for awe.s0me.uk
# This script sets up the production environment and starts the server

echo "🚀 Starting Production Retro Terminal Server..."

# Set production environment variables
export NODE_ENV=production
export PORT=3000
export DOMAIN=awe.s0me.uk
export ALLOWED_ORIGINS=https://awe.s0me.uk,https://www.awe.s0me.uk
export ENABLE_CORS=true
export ENABLE_HELMET=true
export RATE_LIMIT_WINDOW=900000
export RATE_LIMIT_MAX=100
export AI_RATE_LIMIT_WINDOW=60000
export AI_RATE_LIMIT_MAX=10
export DATABASE_PATH=./terminal_data.db
export DB_ENABLE_WAL=true
export LOG_LEVEL=info
export LOG_ENABLE_CONSOLE=true
export LOG_ENABLE_FILE=true
export LOG_DIR=logs
export CACHE_TTL=300
export CACHE_MAX_KEYS=1000

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is not set"
    echo "Please set it before running this script:"
    echo "export OPENAI_API_KEY=your_api_key_here"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if the production server file exists
if [ ! -f "src/server.production.js" ]; then
    echo "❌ Error: Production server file not found: src/server.production.js"
    exit 1
fi

# Check if nginx is running
if ! pgrep -x "nginx" > /dev/null; then
    echo "⚠️  Warning: nginx is not running. Make sure to start nginx for HTTPS access."
fi

# Start the production server
echo "📡 Starting server on http://127.0.0.1:3000"
echo "🌐 Server will be accessible via nginx at https://awe.s0me.uk"
echo "🔒 Environment: production"
echo ""

# Start the server
node src/server.production.js
