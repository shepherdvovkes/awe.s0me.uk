const { logError } = require('../utils/logger');

/**
 * Middleware для обработки ошибок
 */
class ErrorHandler {
    /**
     * Обработчик ошибок валидации
     */
    static validationError = (error, req, res, next) => {
        if (error.name === 'ValidationError') {
            logError('Validation error', {
                error: error.message,
                path: req.path,
                ip: req.ip
            });
            
            return res.status(400).json({
                error: 'Validation failed',
                details: error.message
            });
        }
        
        next(error);
    };

    /**
     * Обработчик ошибок синтаксиса JSON
     */
    static jsonError = (error, req, res, next) => {
        if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
            logError('JSON syntax error', {
                error: error.message,
                path: req.path,
                ip: req.ip
            });
            
            return res.status(400).json({
                error: 'Invalid JSON syntax'
            });
        }
        
        next(error);
    };

    /**
     * Обработчик ошибок команд
     */
    static commandError = (error, req, res, next) => {
        if (error.message && error.message.includes('Command')) {
            logError('Command execution error', {
                error: error.message,
                path: req.path,
                ip: req.ip
            });
            
            return res.status(400).json({
                error: 'Command execution failed',
                details: error.message
            });
        }
        
        next(error);
    };

    /**
     * Обработчик ошибок AI
     */
    static aiError = (error, req, res, next) => {
        if (error.message && (
            error.message.includes('OpenAI') || 
            error.message.includes('AI') ||
            error.message.includes('MOTD')
        )) {
            logError('AI processing error', {
                error: error.message,
                path: req.path,
                ip: req.ip
            });
            
            return res.status(500).json({
                error: 'AI processing failed',
                details: error.message
            });
        }
        
        next(error);
    };

    /**
     * Обработчик ошибок базы данных
     */
    static databaseError = (error, req, res, next) => {
        if (error.message && (
            error.message.includes('database') ||
            error.message.includes('SQL') ||
            error.message.includes('Database')
        )) {
            logError('Database error', {
                error: error.message,
                path: req.path,
                ip: req.ip
            });
            
            return res.status(500).json({
                error: 'Database operation failed',
                details: 'Internal server error'
            });
        }
        
        next(error);
    };

    /**
     * Обработчик ошибок сети
     */
    static networkError = (error, req, res, next) => {
        if (error.code && (
            error.code === 'ENOTFOUND' ||
            error.code === 'ECONNREFUSED' ||
            error.code === 'ETIMEDOUT'
        )) {
            logError('Network error', {
                error: error.message,
                code: error.code,
                path: req.path,
                ip: req.ip
            });
            
            return res.status(503).json({
                error: 'Network service unavailable',
                details: 'The requested service is temporarily unavailable'
            });
        }
        
        next(error);
    };

    /**
     * Общий обработчик ошибок
     */
    static generalError = (error, req, res, next) => {
        // Логируем ошибку
        logError('Unhandled error', {
            error: error.message,
            stack: error.stack,
            path: req.path,
            ip: req.ip,
            method: req.method,
            userAgent: req.get('User-Agent')
        });

        // Определяем статус код
        let statusCode = 500;
        let message = 'Internal server error';

        if (error.status) {
            statusCode = error.status;
        } else if (error.statusCode) {
            statusCode = error.statusCode;
        }

        // Определяем сообщение об ошибке
        if (error.message) {
            message = error.message;
        }

        // В продакшене не показываем детали ошибок
        if (process.env.NODE_ENV === 'production') {
            message = 'Internal server error';
        }

        res.status(statusCode).json({
            error: message,
            timestamp: new Date().toISOString(),
            path: req.path
        });
    };

    /**
     * Обработчик 404 ошибок
     */
    static notFound = (req, res, next) => {
        logError('Route not found', {
            path: req.path,
            method: req.method,
            ip: req.ip
        });

        res.status(404).json({
            error: 'Route not found',
            path: req.path,
            method: req.method
        });
    };

    /**
     * Получает все обработчики ошибок
     */
    static getAllErrorHandlers() {
        return [
            this.jsonError,
            this.validationError,
            this.commandError,
            this.aiError,
            this.databaseError,
            this.networkError,
            this.generalError
        ];
    }

    /**
     * Обработчик необработанных исключений
     */
    static handleUncaughtExceptions() {
        process.on('uncaughtException', (error) => {
            logError('Uncaught Exception', {
                error: error.message,
                stack: error.stack
            });
            
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logError('Unhandled Rejection', {
                reason: reason,
                promise: promise
            });
            
            process.exit(1);
        });
    }
}

module.exports = ErrorHandler; 