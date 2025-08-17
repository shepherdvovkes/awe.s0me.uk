#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Retro Terminal with Authentication...');
console.log('📡 Server will be available at: http://localhost:3001');
console.log('🔐 Authentication API: http://localhost:3001/api/auth');
console.log('');

// Set environment variables
process.env.PORT = '3001';

// Start the server
const server = spawn('node', ['src/server.js'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: '3001' }
});

server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

server.on('close', (code) => {
    console.log(`\n🛑 Server stopped with code ${code}`);
    process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGTERM');
}); 