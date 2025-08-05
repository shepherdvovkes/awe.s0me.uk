const express = require('express');
const Joi = require('joi');
const AIService = require('../services/aiService');
const Validators = require('../utils/validators');
const { logError } = require('../utils/logger');
const SecurityMiddleware = require('../middleware/security');

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
            const result = await AIService.generateMOTD();
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
        try {
            const { command, isAdmin = false } = req.validatedBody;
            const result = await AIService.processUnknownCommand(command, isAdmin);
            res.json(result);
        } catch (error) {
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
            const result = await AIService.detectLegalRequest(query);
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
            const result = await AIService.searchLegalDatabase(query, language);
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
            const result = await AIService.processCourtCaseRequest(query);
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
            const result = await AIService.processTCCRequest(command);
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
            const result = await AIService.getMOTDHistory(parseInt(limit));
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
            const result = await AIService.getOpenAIHistory(parseInt(limit));
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
        const result = await AIService.getServiceStatus();
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
        const result = await AIService.getServiceStats();
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

module.exports = router;
