require('dotenv').config();

/**
 * Application configuration with validation
 */
class AppConfig {
    constructor() {
        this.validateRequiredEnvVars();
    }

    /**
     * Validates required environment variables
     */
    validateRequiredEnvVars() {
        const required = ['OPENAI_API_KEY'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            console.warn(`Warning: Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    get port() {
        return parseInt(process.env.PORT) || 3000;
    }

    get nodeEnv() {
        return process.env.NODE_ENV || 'development';
    }

    get isProduction() {
        return this.nodeEnv === 'production';
    }

    get isDevelopment() {
        return this.nodeEnv === 'development';
    }

    get openai() {
        return {
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
            timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000
        };
    }

    get security() {
        return {
            allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
            rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
            rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
            aiRateLimitWindow: parseInt(process.env.AI_RATE_LIMIT_WINDOW) || 60000, // 1 minute
            aiRateLimitMax: parseInt(process.env.AI_RATE_LIMIT_MAX) || 10,
            commandTimeout: parseInt(process.env.COMMAND_TIMEOUT) || 10000,
            maxBufferSize: parseInt(process.env.MAX_BUFFER_SIZE) || 1024 * 1024, // 1MB
            maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE) || 1024 * 1024, // 1MB
            enableCors: process.env.ENABLE_CORS !== 'false',
            enableHelmet: process.env.ENABLE_HELMET !== 'false'
        };
    }

    get database() {
        return {
            path: process.env.DATABASE_PATH || './terminal_data.db',
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
            timeout: parseInt(process.env.DB_TIMEOUT) || 30000,
            enableWAL: process.env.DB_ENABLE_WAL !== 'false'
        };
    }

    get cache() {
        return {
            ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
            checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 60,
            maxKeys: parseInt(process.env.CACHE_MAX_KEYS) || 1000,
            enableStats: process.env.CACHE_ENABLE_STATS !== 'false'
        };
    }

    get logging() {
        return {
            level: process.env.LOG_LEVEL || 'info',
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
            maxSize: process.env.LOG_MAX_SIZE || '10m',
            enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
            enableFile: process.env.LOG_ENABLE_FILE !== 'false',
            logDir: process.env.LOG_DIR || 'logs'
        };
    }

    get zakon() {
        return {
            token: process.env.ZAKON_TOKEN,
            baseUrl: process.env.ZAKON_BASE_URL || 'https://court.searcher.api.zakononline.com.ua/api',
            timeout: parseInt(process.env.ZAKON_TIMEOUT) || 10000,
            maxRetries: parseInt(process.env.ZAKON_MAX_RETRIES) || 3
        };
    }

    get commands() {
        return {
            ping: {
                count: parseInt(process.env.PING_COUNT) || 4,
                timeout: parseInt(process.env.PING_TIMEOUT) || 5000
            },
            traceroute: {
                maxHops: parseInt(process.env.TRACEROUTE_MAX_HOPS) || 30,
                timeout: parseInt(process.env.TRACEROUTE_TIMEOUT) || 5000
            },
            nslookup: {
                timeout: parseInt(process.env.NSLOOKUP_TIMEOUT) || 10000
            },
            whois: {
                timeout: parseInt(process.env.WHOIS_TIMEOUT) || 10000
            }
        };
    }

    get ai() {
        return {
            motd: {
                languages: ['en', 'ru', 'ja', 'fr', 'uk'],
                maxTokens: parseInt(process.env.MOTD_MAX_TOKENS) || 100,
                temperature: parseFloat(process.env.MOTD_TEMPERATURE) || 0.9,
                cacheTTL: parseInt(process.env.MOTD_CACHE_TTL) || 300
            },
            legal: {
                maxTokens: parseInt(process.env.LEGAL_MAX_TOKENS) || 800,
                temperature: parseFloat(process.env.LEGAL_TEMPERATURE) || 0.3,
                cacheTTL: parseInt(process.env.LEGAL_CACHE_TTL) || 1800
            },
            unknownCommand: {
                maxTokens: parseInt(process.env.UNKNOWN_CMD_MAX_TOKENS) || 500,
                temperature: parseFloat(process.env.UNKNOWN_CMD_TEMPERATURE) || 0.7,
                cacheTTL: parseInt(process.env.UNKNOWN_CMD_CACHE_TTL) || 600
            }
        };
    }

    /**
     * Validates the configuration
     */
    validate() {
        const errors = [];

        if (this.port < 1 || this.port > 65535) {
            errors.push('PORT must be between 1 and 65535');
        }

        if (this.security.rateLimitMax < 1) {
            errors.push('RATE_LIMIT_MAX must be at least 1');
        }

        if (this.security.commandTimeout < 1000) {
            errors.push('COMMAND_TIMEOUT must be at least 1000ms');
        }

        if (this.cache.ttl < 1) {
            errors.push('CACHE_TTL must be at least 1 second');
        }

        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
    }

    /**
     * Gets all configuration as a plain object
     */
    toObject() {
        return {
            port: this.port,
            nodeEnv: this.nodeEnv,
            isProduction: this.isProduction,
            isDevelopment: this.isDevelopment,
            openai: this.openai,
            security: this.security,
            database: this.database,
            cache: this.cache,
            logging: this.logging,
            zakon: this.zakon,
            commands: this.commands,
            ai: this.ai
        };
    }
}

// Create and validate configuration
const config = new AppConfig();

// Validate configuration in development
if (config.isDevelopment) {
    try {
        config.validate();
    } catch (error) {
        console.warn(`Configuration warning: ${error.message}`);
    }
}

module.exports = config;
