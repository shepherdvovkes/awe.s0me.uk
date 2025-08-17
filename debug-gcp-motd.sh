#!/bin/bash

echo "=== GCP MOTD Debug Script ==="
echo "Timestamp: $(date)"
echo ""

echo "=== 1. Docker Container Status ==="
docker ps -a | grep retro-terminal || echo "Container not found"
echo ""

echo "=== 2. Docker Container Logs (Last 50 lines) ==="
docker logs retro-terminal --tail 50 2>/dev/null || echo "Container not running or not found"
echo ""

echo "=== 3. Test Local Connection to Container ==="
curl -s http://localhost:3000/api/health || echo "Local connection failed"
echo ""

echo "=== 4. Test MOTD Endpoint Locally ==="
curl -X POST http://localhost:3000/api/motd -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "MOTD endpoint failed"
echo ""

echo "=== 5. Check Environment Variables ==="
docker exec retro-terminal env | grep -E "(OPENAI|NODE_ENV|PORT)" 2>/dev/null || echo "Cannot check env vars"
echo ""

echo "=== 6. Check Database Connection ==="
docker exec retro-terminal node -e "
const databaseManager = require('./src/modules/database');
databaseManager.initialize().then(() => {
    console.log('Database connection OK');
    process.exit(0);
}).catch(err => {
    console.log('Database connection failed:', err.message);
    process.exit(1);
});
" 2>/dev/null || echo "Database check failed"
echo ""

echo "=== 7. Check OpenAI API Key ==="
docker exec retro-terminal node -e "
const config = require('./src/config/app');
console.log('OpenAI API Key:', config.openai.apiKey ? 'SET' : 'NOT SET');
console.log('Model:', config.openai.model);
" 2>/dev/null || echo "Config check failed"
echo ""

echo "=== 8. Check File Permissions ==="
docker exec retro-terminal ls -la /app/logs/ 2>/dev/null || echo "Cannot check logs directory"
echo ""

echo "=== 9. Check Process Status ==="
docker exec retro-terminal ps aux | grep node 2>/dev/null || echo "Cannot check processes"
echo ""

echo "=== 10. Check Network Ports ==="
docker exec retro-terminal netstat -tlnp 2>/dev/null || echo "Cannot check network"
echo ""

echo "=== 11. Test OpenAI API Directly ==="
docker exec retro-terminal node -e "
const OpenAI = require('openai');
const config = require('./src/config/app');

const openai = new OpenAI({
    apiKey: config.openai.apiKey
});

openai.chat.completions.create({
    model: config.openai.model,
    messages: [{ role: 'user', content: 'test' }],
    max_tokens: 5
}).then(() => {
    console.log('OpenAI API test: SUCCESS');
}).catch(err => {
    console.log('OpenAI API test: FAILED -', err.message);
});
" 2>/dev/null || echo "OpenAI API test failed"
echo ""

echo "=== Debug Complete ==="
