#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 Retro Terminal Server Launcher');
console.log('================================');
console.log('1. HTTP Server (http://localhost:3000)');
console.log('2. HTTPS Server (https://localhost:3001)');
console.log('3. Exit');
console.log('');

rl.question('Выберите режим (1-3): ', (answer) => {
    switch(answer.trim()) {
        case '1':
            console.log('\n🌐 Запуск HTTP сервера...');
            console.log('📡 URL: http://localhost:3000');
            console.log('⏹️  Для остановки нажмите Ctrl+C\n');
            startServer('src/server.js');
            break;
        case '2':
            console.log('\n🔒 Запуск HTTPS сервера...');
            console.log('📡 URL: https://localhost:3001');
            console.log('⚠️  Примите самоподписанный сертификат в браузере');
            console.log('⏹️  Для остановки нажмите Ctrl+C\n');
            startServer('server_https.js');
            break;
        case '3':
            console.log('\n👋 До свидания!');
            rl.close();
            process.exit(0);
            break;
        default:
            console.log('\n❌ Неверный выбор. Попробуйте снова.');
            rl.close();
            process.exit(1);
    }
});

function startServer(script) {
    const child = spawn('node', [script], {
        stdio: 'inherit',
        shell: true
    });

    child.on('error', (error) => {
        console.error(`❌ Ошибка запуска сервера: ${error.message}`);
        process.exit(1);
    });

    child.on('exit', (code) => {
        if (code !== 0) {
            console.error(`❌ Сервер завершился с кодом ${code}`);
        }
        process.exit(code);
    });

    // Обработка Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n🛑 Остановка сервера...');
        child.kill('SIGINT');
    });
} 