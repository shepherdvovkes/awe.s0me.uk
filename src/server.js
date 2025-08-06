const express = require('express');
const path = require('path');
const config = require('./config/app');
const databaseManager = require('./modules/database');
const { logInfo, logError } = require('./utils/logger');
const SecurityMiddleware = require('./middleware/security');
const ErrorHandler = require('./middleware/errorHandler');

// Импорт маршрутов
const networkRoutes = require('./routes/network');
const aiRoutes = require('./routes/ai');
const zakonOnlineRoutes = require('./routes/zakonOnline');
const dockerRoutes = require('./routes/docker');

const app = express();

/**
 * Инициализация приложения
 */
async function initializeApp() {
    try {
        // Инициализируем базу данных
        await databaseManager.initialize();
        logInfo('Database initialized successfully');

        // Парсинг JSON
        app.use(express.json({ limit: '1mb' }));
        app.use(express.urlencoded({ extended: true, limit: '1mb' }));

        // Статические файлы
        app.use(express.static(path.join(__dirname, '..')));

        // Главная страница
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'retro_terminal_site.html'));
        });

        // Настраиваем middleware безопасности только для API
        app.use('/api', SecurityMiddleware.getAllMiddleware());

        // Маршруты
        app.use('/api', networkRoutes);
        app.use('/api', aiRoutes);
        app.use('/api/zakon-online', zakonOnlineRoutes);
        app.use('/api/docker', dockerRoutes);

        // Обработчики ошибок
        ErrorHandler.getAllErrorHandlers().forEach(handler => {
            app.use(handler);
        });

        // 404 обработчик
        app.use(ErrorHandler.notFound);

        // Обработчик необработанных исключений
        ErrorHandler.handleUncaughtExceptions();

        logInfo('Application initialized successfully');

    } catch (error) {
        logError('Application initialization failed', error);
        process.exit(1);
    }
}

/**
 * Запуск сервера
 */
async function startServer() {
    try {
        await initializeApp();

        const server = app.listen(config.port, () => {
            logInfo(`🚀 Retro Terminal API Server running on http://localhost:${config.port}`);
            logInfo('📡 Available endpoints:');
            logInfo('   POST /api/ping - Test connectivity');
            logInfo('   POST /api/traceroute - Trace network path');
            logInfo('   POST /api/nslookup - DNS lookup');
            logInfo('   POST /api/netstat - Network statistics');
            logInfo('   POST /api/whois - Domain information');
            logInfo('   POST /api/motd - Generate Bender-style MOTD');
            logInfo('   POST /api/process-command - Process unknown commands with AI');
            logInfo('   POST /api/detect-legal - Detect legal requests');
            logInfo('   POST /api/legal-search - Search legal database');
            logInfo('   POST /api/court-cases - Process court case requests');
            logInfo('   POST /api/tcc - Process TCC requests');
            logInfo('   GET  /api/motd/history - MOTD history');
            logInfo('   GET  /api/openai/history - OpenAI requests history');
            logInfo('   GET  /api/system - System information');
            logInfo('   GET  /api/health - Health check');
            logInfo('   GET  /api/commands - Available commands');
            logInfo('   GET  /api/status - AI service status');
            logInfo('   GET  /api/zakon-online/search - Search legal database');
            logInfo('   GET  /api/zakon-online/courts - Get courts list');
            logInfo('   GET  /api/zakon-online/history - Search history');
            logInfo('   GET  /api/zakon-online/stats - Search statistics');
            logInfo('   POST /api/docker/assembler - Run NASM assembler');
            logInfo('   POST /api/docker/pascal - Run Free Pascal compiler');
            logInfo('   POST /api/docker/dos - Run DOS program via DOSBox');
            logInfo('   POST /api/docker/qemu - Run QEMU emulation');
            logInfo('   GET  /api/docker/files - List workspace files');
            logInfo('   POST /api/docker/sample - Create sample program');
            logInfo('   GET  /api/docker/status - Docker containers status');
            logInfo('   POST /api/docker/start - Start Docker containers');
            logInfo('   POST /api/docker/stop - Stop Docker containers');
        });

        // Graceful shutdown
        process.on('SIGTERM', async() => {
            logInfo('SIGTERM received, shutting down gracefully');
            server.close(async() => {
                await databaseManager.close();
                logInfo('Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', async() => {
            logInfo('SIGINT received, shutting down gracefully');
            server.close(async() => {
                await databaseManager.close();
                logInfo('Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        logError('Server startup failed', error);
        process.exit(1);
    }
}

// Запускаем сервер
startServer();
