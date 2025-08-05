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

const app = express();

/**
 * Инициализация приложения
 */
async function initializeApp() {
    try {
        // Инициализируем базу данных
        await databaseManager.initialize();
        logInfo('Database initialized successfully');

        // Настраиваем middleware безопасности
        app.use(SecurityMiddleware.getAllMiddleware());

        // Парсинг JSON
        app.use(express.json({ limit: '1mb' }));
        app.use(express.urlencoded({ extended: true, limit: '1mb' }));

        // Статические файлы
        app.use(express.static(path.join(__dirname, '..')));

        // Маршруты
        app.use('/api', networkRoutes);
        app.use('/api', aiRoutes);

        // Главная страница
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'retro_terminal_site.html'));
        });

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
