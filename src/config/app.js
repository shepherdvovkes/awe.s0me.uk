require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
    },
    security: {
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 минут
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        commandTimeout: parseInt(process.env.COMMAND_TIMEOUT) || 10000,
        maxBufferSize: parseInt(process.env.MAX_BUFFER_SIZE) || 1024 * 1024 // 1MB
    },
    database: {
        path: process.env.DATABASE_PATH || './terminal_data.db',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10
    },
    cache: {
        ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 минут
        checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 60
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
        maxSize: process.env.LOG_MAX_SIZE || '10m'
    },
    zakon: {
        token: process.env.ZAKON_TOKEN,
        baseUrl: process.env.ZAKON_BASE_URL || 'https://court.searcher.api.zakononline.com.ua/api'
    }
};
