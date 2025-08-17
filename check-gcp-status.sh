#!/bin/bash

echo "=== GCP VM Status Check ==="
echo "Timestamp: $(date)"
echo ""

echo "=== Docker Containers Status ==="
docker ps -a
echo ""

echo "=== Docker Container Logs (retro-terminal) ==="
docker logs retro-terminal --tail 20 2>/dev/null || echo "Container not found or not running"
echo ""

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l
echo ""

echo "=== Nginx Error Logs ==="
sudo tail -20 /var/log/nginx/error.log 2>/dev/null || echo "Nginx error log not found"
echo ""

echo "=== Nginx Access Logs ==="
sudo tail -20 /var/log/nginx/access.log 2>/dev/null || echo "Nginx access log not found"
echo ""

echo "=== Node.js Processes ==="
ps aux | grep node | grep -v grep
echo ""

echo "=== Port 3000 Status ==="
netstat -tlnp | grep :3000 || echo "Port 3000 not listening"
echo ""

echo "=== SSL Certificates Status ==="
sudo ls -la /etc/letsencrypt/live/awe.s0me.uk/ 2>/dev/null || echo "SSL certificates not found"
echo ""

echo "=== System Resources ==="
free -h
df -h /
echo ""

echo "=== Recent System Logs ==="
sudo journalctl -u nginx --no-pager -n 20 2>/dev/null || echo "Nginx service logs not found"
echo ""
