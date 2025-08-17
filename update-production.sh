#!/bin/bash

# Update production deployment script for awe.s0me.uk
# This script updates the existing production environment with the latest fixes

set -e

echo "🔄 Updating Retro Terminal Production Deployment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# Navigate to application directory
cd /var/www/awe.s0me.uk

# Backup current configuration
echo "💾 Backing up current configuration..."
cp nginx.conf nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
cp src/server.production.js src/server.production.js.backup.$(date +%Y%m%d_%H%M%S)

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install/update Node.js dependencies
echo "📦 Installing/updating Node.js dependencies..."
npm install --production

# Update nginx configuration
echo "🌐 Updating nginx configuration..."
cp nginx.conf /etc/nginx/sites-available/awe.s0me.uk

# Test nginx configuration
echo "🔍 Testing nginx configuration..."
nginx -t

# Restart services
echo "🚀 Restarting services..."
systemctl restart retro-terminal
systemctl reload nginx

# Check service status
echo "📊 Checking service status..."
systemctl status retro-terminal --no-pager
systemctl status nginx --no-pager

# Test endpoints
echo "🧪 Testing API endpoints..."
echo "Testing /api/health..."
curl -s -o /dev/null -w "Health check: %{http_code}\n" https://awe.s0me.uk/api/health

echo "Testing /api/motd..."
curl -s -o /dev/null -w "MOTD endpoint: %{http_code}\n" -X POST https://awe.s0me.uk/api/motd

echo "Testing /api/process-command..."
curl -s -o /dev/null -w "Process command: %{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"command":"test"}' https://awe.s0me.uk/api/process-command

echo ""
echo "✅ Production update completed successfully!"
echo ""
echo "🌐 Your Retro Terminal is now updated at: https://awe.s0me.uk"
echo "📡 API endpoints: https://awe.s0me.uk/api/*"
echo ""
echo "📋 Useful commands:"
echo "  - View logs: journalctl -u retro-terminal -f"
echo "  - Restart service: systemctl restart retro-terminal"
echo "  - Check status: systemctl status retro-terminal"
echo "  - View nginx logs: tail -f /var/log/nginx/error.log"
echo ""
echo "🔍 If you encounter issues, check:"
echo "  - nginx error logs: tail -f /var/log/nginx/error.log"
echo "  - application logs: journalctl -u retro-terminal -f"
echo "  - nginx config: nginx -t"
