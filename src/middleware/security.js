const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { logSecurity } = require('../utils/logger');
const config = require('../config/app');

/**
 * Middleware безопасности
 */
class SecurityMiddleware {
    /**
     * Rate limiter для API endpoints
     */
    static rateLimiter = rateLimit({
        windowMs: config.security.rateLimitWindow,
        max: config.security.rateLimitMax,
        message: {
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(config.security.rateLimitWindow / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logSecurity('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path
            });
            res.status(429).json({
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: Math.ceil(config.security.rateLimitWindow / 1000)
            });
        }
    });

    /**
     * Специальный rate limiter для AI endpoints
     */
    static aiRateLimiter = rateLimit({
        windowMs: 60 * 1000, // 1 минута
        max: 10, // максимум 10 запросов в минуту
        message: {
            error: 'Too many AI requests, please try again later.',
            retryAfter: 60
        },
        handler: (req, res) => {
            logSecurity('AI rate limit exceeded', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path
            });
            res.status(429).json({
                error: 'Too many AI requests, please try again later.',
                retryAfter: 60
            });
        }
    });

    /**
     * CORS настройки
     */
    static corsOptions = {
        origin: (origin, callback) => {
            // Разрешаем запросы без origin (например, мобильные приложения)
            if (!origin) return callback(null, true);
            
            if (config.security.allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logSecurity('CORS violation', { origin });
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };

    /**
     * Валидация входных данных
     */
    static inputValidation = (req, res, next) => {
        try {
            const { hostname, domain, command, query } = req.body;
            
            // Валидация hostname
            if (hostname) {
                if (typeof hostname !== 'string' || hostname.length > 253) {
                    return res.status(400).json({ 
                        error: 'Invalid hostname format or length' 
                    });
                }
                
                // Проверяем на потенциально опасные символы
                if (/[;&|`$(){}[\]<>]/.test(hostname)) {
                    logSecurity('Malicious hostname detected', { hostname, ip: req.ip });
                    return res.status(400).json({ 
                        error: 'Invalid hostname characters' 
                    });
                }
            }
            
            // Валидация domain
            if (domain) {
                if (typeof domain !== 'string' || domain.length > 253) {
                    return res.status(400).json({ 
                        error: 'Invalid domain format or length' 
                    });
                }
                
                // Проверяем на потенциально опасные символы
                if (/[;&|`$(){}[\]<>]/.test(domain)) {
                    logSecurity('Malicious domain detected', { domain, ip: req.ip });
                    return res.status(400).json({ 
                        error: 'Invalid domain characters' 
                    });
                }
            }
            
            // Валидация command
            if (command) {
                if (typeof command !== 'string' || command.length > 1000) {
                    return res.status(400).json({ 
                        error: 'Invalid command format or length' 
                    });
                }
                
                // Проверяем на потенциально опасные символы
                if (/[;&|`$(){}[\]<>]/.test(command)) {
                    logSecurity('Malicious command detected', { command, ip: req.ip });
                    return res.status(400).json({ 
                        error: 'Invalid command characters' 
                    });
                }
            }
            
            // Валидация query
            if (query) {
                if (typeof query !== 'string' || query.length > 2000) {
                    return res.status(400).json({ 
                        error: 'Invalid query format or length' 
                    });
                }
            }
            
            next();
        } catch (error) {
            logSecurity('Input validation error', { error: error.message, ip: req.ip });
            res.status(400).json({ error: 'Input validation failed' });
        }
    };

    /**
     * Логирование запросов
     */
    static requestLogger = (req, res, next) => {
        const startTime = Date.now();
        
        // Логируем начало запроса
        logSecurity('Request started', {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });
        
        // Перехватываем ответ
        const originalSend = res.send;
        res.send = function(data) {
            const duration = Date.now() - startTime;
            
            // Логируем завершение запроса
            logSecurity('Request completed', {
                method: req.method,
                path: req.path,
                ip: req.ip,
                statusCode: res.statusCode,
                duration,
                timestamp: new Date().toISOString()
            });
            
            originalSend.call(this, data);
        };
        
        next();
    };

    /**
     * Проверка заголовков безопасности
     */
    static securityHeaders = (req, res, next) => {
        // Добавляем заголовки безопасности
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        next();
    };

    /**
     * Проверка размера тела запроса
     */
    static bodySizeLimit = (req, res, next) => {
        const contentLength = parseInt(req.get('Content-Length') || '0');
        const maxSize = 1024 * 1024; // 1MB
        
        if (contentLength > maxSize) {
            logSecurity('Request body too large', {
                contentLength,
                maxSize,
                ip: req.ip,
                path: req.path
            });
            return res.status(413).json({ 
                error: 'Request entity too large' 
            });
        }
        
        next();
    };

    /**
     * Проверка метода запроса
     */
    static methodValidation = (req, res, next) => {
        const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
        
        if (!allowedMethods.includes(req.method)) {
            logSecurity('Invalid HTTP method', {
                method: req.method,
                ip: req.ip,
                path: req.path
            });
            return res.status(405).json({ 
                error: 'Method not allowed' 
            });
        }
        
        next();
    };

    /**
     * Проверка IP адреса
     */
    static ipValidation = (req, res, next) => {
        const ip = req.ip;
        
        // Проверяем на localhost и private IP ranges
        const privateIPRanges = [
            /^127\./,
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./
        ];
        
        const isPrivateIP = privateIPRanges.some(range => range.test(ip));
        
        if (!isPrivateIP && config.nodeEnv === 'production') {
            logSecurity('Non-private IP access', { ip, path: req.path });
        }
        
        next();
    };

    /**
     * Получает все middleware безопасности
     */
    static getAllMiddleware() {
        return [
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                        fontSrc: ["'self'", "https://fonts.gstatic.com"],
                        scriptSrc: ["'self'", "'unsafe-inline'"],
                        imgSrc: ["'self'", "data:", "https:"],
                        connectSrc: ["'self'", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002"]
                    }
                },
                hsts: {
                    maxAge: 31536000,
                    includeSubDomains: true,
                    preload: true
                }
            }),
            cors(this.corsOptions),
            this.requestLogger,
            this.securityHeaders,
            this.bodySizeLimit,
            this.methodValidation,
            this.ipValidation
        ];
    }
}

module.exports = SecurityMiddleware; 