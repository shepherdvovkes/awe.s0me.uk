#!/bin/bash

# Production deployment script for awe.s0me.uk
# This script sets up the production environment with nginx and SSL

set -e

echo "🚀 Deploying Retro Terminal to Production..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt install -y nginx certbot python3-certbot-nginx nodejs npm sqlite3

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/awe.s0me.uk
chown -R www-data:www-data /var/www/awe.s0me.uk

# Copy application files
echo "📋 Copying application files..."
cp -r . /var/www/awe.s0me.uk/
chown -R www-data:www-data /var/www/awe.s0me.uk

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd /var/www/awe.s0me.uk
npm install --production

# Create logs directory
mkdir -p /var/www/awe.s0me.uk/logs
chown -R www-data:www-data /var/www/awe.s0me.uk/logs

# Configure nginx
echo "🌐 Configuring nginx..."
cp nginx.conf /etc/nginx/sites-available/awe.s0me.uk
ln -sf /etc/nginx/sites-available/awe.s0me.uk /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "🔍 Testing nginx configuration..."
nginx -t

# Install systemd service
echo "⚙️  Installing systemd service..."
cp retro-terminal.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable retro-terminal

# Set up SSL certificate
echo "🔒 Setting up SSL certificate..."
echo "Please make sure your domain awe.s0me.uk points to this server's IP address"
echo "Press Enter when ready to continue..."
read

# Get SSL certificate
certbot --nginx -d awe.s0me.uk -d www.awe.s0me.uk --non-interactive --agree-tos --email admin@awe.s0me.uk

# Start services
echo "🚀 Starting services..."
systemctl start retro-terminal
systemctl restart nginx

# Check service status
echo "📊 Checking service status..."
systemctl status retro-terminal --no-pager
systemctl status nginx --no-pager

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your Retro Terminal is now available at: https://awe.s0me.uk"
echo "📡 API endpoints: https://awe.s0me.uk/api/*"
echo ""
echo "📋 Useful commands:"
echo "  - View logs: journalctl -u retro-terminal -f"
echo "  - Restart service: systemctl restart retro-terminal"
echo "  - Check status: systemctl status retro-terminal"
echo "  - View nginx logs: tail -f /var/log/nginx/access.log"
echo ""
echo "🔒 SSL certificate will auto-renew via certbot"
echo "📝 Remember to set your OPENAI_API_KEY environment variable!"
