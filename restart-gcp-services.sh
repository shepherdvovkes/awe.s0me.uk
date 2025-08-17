#!/bin/bash

echo "=== Restarting GCP Services ==="
echo "Timestamp: $(date)"
echo ""

echo "=== Stopping Docker Containers ==="
docker stop retro-terminal 2>/dev/null || echo "Container not running"
docker rm retro-terminal 2>/dev/null || echo "Container not found"
echo ""

echo "=== Rebuilding and Starting Docker Container ==="
cd /path/to/your/project  # Замените на реальный путь
docker-compose up -d --build retro-terminal
echo ""

echo "=== Checking Container Status ==="
docker ps -a | grep retro-terminal
echo ""

echo "=== Checking Container Logs ==="
docker logs retro-terminal --tail 10
echo ""

echo "=== Restarting Nginx ==="
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager -l
echo ""

echo "=== Checking Port 3000 ==="
netstat -tlnp | grep :3000 || echo "Port 3000 not listening"
echo ""

echo "=== Testing Local Connection ==="
curl -s http://localhost:3000/api/health || echo "Local connection failed"
echo ""

echo "=== Services Restart Complete ==="
