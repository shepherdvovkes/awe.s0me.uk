const winston = require('winston');
const path = require('path');
const config = require('../config/app');

// Создаем директорию для логов если её нет
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'retro-terminal' },
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        })
    ]
});

// Добавляем консольный транспорт для разработки
if (config.nodeEnv !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Создаем специализированные логгеры
const commandLogger = winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'commands.log'),
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        })
    ]
});

const securityLogger = winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'security.log'),
            maxsize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles
        })
    ]
});

module.exports = {
    logger,
    commandLogger,
    securityLogger,
    logError: (message, error) => {
        logger.error(message, { error: error.message, stack: error.stack });
    },
    logInfo: (message, meta = {}) => {
        logger.info(message, meta);
    },
    logWarning: (message, meta = {}) => {
        logger.warn(message, meta);
    },
    logCommand: (command, args, result, duration) => {
        commandLogger.info('Command executed', {
            command,
            args,
            result: result.substring(0, 200) + (result.length > 200 ? '...' : ''),
            duration,
            timestamp: new Date().toISOString()
        });
    },
    logSecurity: (event, details) => {
        securityLogger.warn('Security event', {
            event,
            details,
            timestamp: new Date().toISOString()
        });
    }
};
