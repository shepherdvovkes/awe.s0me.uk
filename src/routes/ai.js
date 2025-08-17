const express = require('express');
const Joi = require('joi');
const Validators = require('../utils/validators');
const { logError } = require('../utils/logger');
const SecurityMiddleware = require('../middleware/security');
const container = require('../container/DIContainer');

const router = express.Router();

// Validation schemas
const motdSchema = Joi.object({});

const commandSchema = Joi.object({
    command: Validators.commandSchema.required(),
    isAdmin: Validators.adminSchema
});

const legalDetectionSchema = Joi.object({
    query: Validators.querySchema.required()
});

const legalSearchSchema = Joi.object({
    query: Validators.querySchema.required(),
    language: Validators.languageSchema
});

const courtCaseSchema = Joi.object({
    query: Validators.querySchema.required()
});

const tccSchema = Joi.object({
    command: Validators.commandSchema.required()
});

const historySchema = Joi.object({
    limit: Validators.limitSchema
});

/**
 * MOTD endpoint
 */
router.post('/motd',
    SecurityMiddleware.aiRateLimiter,
    Validators.createValidationMiddleware(motdSchema),
    async(req, res) => {
        try {
            const aiService = container.get('aiService');
            const result = await aiService.generateMOTD();
            res.json(result);
        } catch (error) {
            logError('MOTD generation failed', {
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({ 
                error: 'MOTD generation failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Process unknown command endpoint
 */
router.post('/process-command',
    SecurityMiddleware.aiRateLimiter,
    Validators.createValidationMiddleware(commandSchema),
    async(req, res) => {
        // Handle request abortion
        req.on('aborted', () => {
            logInfo('Command request aborted by client', {
                command: req.validatedBody?.command,
                ip: req.ip
            });
        });
        
        try {
            const { command, isAdmin = false } = req.validatedBody;
            
            // Check if request was aborted
            if (req.aborted) {
                return res.status(499).json({
                    success: false,
                    error: 'Request aborted by client'
                });
            }
            
            const aiService = container.get('aiService');
            const result = await aiService.processUnknownCommand(command, isAdmin);
            
            // Check again before sending response
            if (req.aborted) {
                return res.status(499).json({
                    success: false,
                    error: 'Request aborted by client'
                });
            }
            
            res.json(result);
        } catch (error) {
            // Don't log if request was aborted
            if (!req.aborted) {
                logError('Command processing failed', {
                    command: req.validatedBody?.command,
                    isAdmin: req.validatedBody?.isAdmin,
                    error: error.message,
                    ip: req.ip
                });
                
                res.status(500).json({ 
                    error: 'Command processing failed',
                    details: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
);

/**
 * Legal request detection endpoint
 */
router.post('/detect-legal',
    SecurityMiddleware.aiRateLimiter,
    Validators.createValidationMiddleware(legalDetectionSchema),
    async(req, res) => {
        try {
            const { query } = req.validatedBody;
            const aiService = container.get('aiService');
            const result = await aiService.detectLegalRequest(query);
            res.json(result);
        } catch (error) {
            logError('Legal detection failed', {
                query: req.validatedBody?.query,
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({ 
                error: 'Legal detection failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Legal database search endpoint
 */
router.post('/legal-search',
    SecurityMiddleware.aiRateLimiter,
    Validators.createValidationMiddleware(legalSearchSchema),
    async(req, res) => {
        try {
            const { query, language = 'ru' } = req.validatedBody;
            const aiService = container.get('aiService');
            const result = await aiService.searchLegalDatabase(query, language);
            res.json(result);
        } catch (error) {
            logError('Legal search failed', {
                query: req.validatedBody?.query,
                language: req.validatedBody?.language,
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({ 
                error: 'Legal search failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Court case numbers endpoint
 */
router.post('/court-cases',
    SecurityMiddleware.aiRateLimiter,
    Validators.createValidationMiddleware(courtCaseSchema),
    async(req, res) => {
        try {
            const { query } = req.validatedBody;
            const aiService = container.get('aiService');
            const result = await aiService.processCourtCaseRequest(query);
            res.json(result);
        } catch (error) {
            logError('Court case processing failed', {
                query: req.validatedBody?.query,
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({ 
                error: 'Court case processing failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * TCC request endpoint
 */
router.post('/tcc',
    SecurityMiddleware.aiRateLimiter,
    Validators.createValidationMiddleware(tccSchema),
    async(req, res) => {
        try {
            const { command } = req.validatedBody;
            const aiService = container.get('aiService');
            const result = await aiService.processTCCRequest(command);
            res.json(result);
        } catch (error) {
            logError('TCC request processing failed', {
                command: req.validatedBody?.command,
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({ 
                error: 'TCC request processing failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * MOTD history endpoint
 */
router.get('/motd/history',
    Validators.createQueryValidationMiddleware(historySchema),
    async(req, res) => {
        try {
            const { limit = 20 } = req.validatedQuery;
            const aiService = container.get('aiService');
            const result = await aiService.getMOTDHistory(parseInt(limit));
            res.json(result);
        } catch (error) {
            logError('MOTD history failed', {
                limit: req.validatedQuery?.limit,
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({ 
                error: 'MOTD history failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * OpenAI requests history endpoint
 */
router.get('/openai/history',
    Validators.createQueryValidationMiddleware(historySchema),
    async(req, res) => {
        try {
            const { limit = 20 } = req.validatedQuery;
            const aiService = container.get('aiService');
            const result = await aiService.getOpenAIHistory(parseInt(limit));
            res.json(result);
        } catch (error) {
            logError('OpenAI history failed', {
                limit: req.validatedQuery?.limit,
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({ 
                error: 'OpenAI history failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * AI service status endpoint
 */
router.get('/status', async(req, res) => {
    try {
        const aiService = container.get('aiService');
        const result = await aiService.getServiceStatus();
        res.json(result);
    } catch (error) {
        logError('AI status check failed', {
            error: error.message,
            ip: req.ip
        });
        
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * AI service statistics endpoint
 */
router.get('/stats', async(req, res) => {
    try {
        const aiService = container.get('aiService');
        const result = await aiService.getServiceStats();
        res.json(result);
    } catch (error) {
        logError('AI stats failed', {
            error: error.message,
            ip: req.ip
        });
        
        res.status(500).json({ 
            error: 'AI stats failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Available AI strategies endpoint
 */
router.get('/strategies', async(req, res) => {
    try {
        const aiService = container.get('aiService');
        const result = await aiService.getAvailableStrategies();
        res.json(result);
    } catch (error) {
        logError('AI strategies failed', {
            error: error.message,
            ip: req.ip
        });
        
        res.status(500).json({ 
            error: 'AI strategies failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
