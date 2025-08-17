const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/app');
const { logger } = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const security = require('./middleware/security');

// Import routes
const aiRoutes = require('./routes/ai');
const dockerRoutes = require('./routes/docker');
const networkRoutes = require('./routes/network');
const zakonRoutes = require('./routes/zakonOnline');

const app = express();
const PORT = process.env.PORT || 3000;

// Production middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://awe.s0me.uk", "https://www.awe.s0me.uk", "wss://awe.s0me.uk", "wss://www.awe.s0me.uk"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Trust proxy for nginx
app.set('trust proxy', 1);

// CORS configuration for production
const corsOptions = {
    origin: [
        'https://awe.s0me.uk',
        'https://www.awe.s0me.uk'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// AI-specific rate limiting
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 AI requests per minute
    message: 'Too many AI requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/process-command', aiLimiter);
app.use('/api/motd', aiLimiter);
app.use('/api/detect-legal', aiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(security.inputValidation);
app.use(security.requestLogger);

// Static file serving
app.use(express.static(path.join(__dirname, '../'), {
    maxAge: '1y',
    etag: true,
    lastModified: true
}));

// API Routes
app.use('/api', aiRoutes);
app.use('/api/docker', dockerRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/zakon-online', zakonRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cache: req.app.locals.cache ? req.app.locals.cache.getStats() : null,
        environment: process.env.NODE_ENV || 'development',
        version: process.version
    });
});

// System information endpoint
app.get('/api/system', (req, res) => {
    const os = require('os');
    res.json({
        success: true,
        info: {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            pid: process.pid,
            cwd: process.cwd(),
            env: process.env.NODE_ENV || 'development',
            os: {
                uname: os.type() + ' ' + os.hostname() + ' ' + os.release() + ' ' + os.arch()
            },
            cpu: {
                cores: os.cpus().length
            },
            memory: null
        },
        formatted: `Platform: ${os.platform()}\nArchitecture: ${os.arch()}\nNode Version: ${process.version}\nUptime: ${Math.floor(process.uptime() / 60)} minutes\n`,
        timestamp: new Date().toISOString()
    });
});

// Root route - serve the retro terminal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../retro_terminal_site.html'));
});

// 404 handler
app.use('*', (req, res) => {
    logger.error('Route not found', { 
        method: req.method, 
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Production Retro Terminal Server running on http://0.0.0.0:${PORT}`);
    logger.info(`📡 Server will be accessible via nginx at https://awe.s0me.uk`);
    logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
