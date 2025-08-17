const express = require('express');
const Joi = require('joi');
const NetworkService = require('../services/networkService');
const Validators = require('../utils/validators');
const { logError } = require('../utils/logger');
const SecurityMiddleware = require('../middleware/security');

const router = express.Router();

// Validation schemas
const hostnameSchema = Joi.object({
    hostname: Validators.hostnameSchema.required()
});

const domainSchema = Joi.object({
    domain: Validators.domainSchema.required()
});

const netstatSchema = Joi.object({
    args: Validators.argsSchema.default([])
});



/**
 * Ping endpoint
 */
router.post('/ping',
    SecurityMiddleware.rateLimiter,
    Validators.createValidationMiddleware(hostnameSchema),
    async(req, res) => {
        // Handle request abortion
        req.on('aborted', () => {
            logInfo('Ping request aborted by client', {
                hostname: req.validatedBody?.hostname,
                ip: req.ip
            });
        });
        
        try {
            const { hostname } = req.validatedBody;
            
            // Check if request was aborted
            if (req.aborted) {
                return res.status(499).json({
                    success: false,
                    error: 'Request aborted by client'
                });
            }
            
            const result = await NetworkService.ping(hostname);
            
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
                logError('Ping command failed', {
                    hostname: req.validatedBody?.hostname,
                    error: error.message,
                    ip: req.ip
                });
                
                res.status(500).json({ 
                    error: 'Ping command failed',
                    details: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
);

/**
 * Traceroute endpoint
 */
router.post('/traceroute',
    SecurityMiddleware.rateLimiter,
    Validators.createValidationMiddleware(hostnameSchema),
    async(req, res) => {
        // Handle request abortion
        req.on('aborted', () => {
            logInfo('Traceroute request aborted by client', {
                hostname: req.validatedBody?.hostname,
                ip: req.ip
            });
        });
        
        try {
            const { hostname } = req.validatedBody;
            
            // Check if request was aborted
            if (req.aborted) {
                return res.status(499).json({
                    success: false,
                    error: 'Request aborted by client'
                });
            }
            
            const result = await NetworkService.traceroute(hostname);
            
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
                logError('Traceroute command failed', {
                    hostname: req.validatedBody?.hostname,
                    error: error.message,
                    ip: req.ip
                });
                
                res.status(500).json({ 
                    error: 'Traceroute command failed',
                    details: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
);

/**
 * Nslookup endpoint
 */
router.post('/nslookup',
    SecurityMiddleware.rateLimiter,
    Validators.createValidationMiddleware(hostnameSchema),
    async(req, res) => {
        try {
            const { hostname } = req.validatedBody;
            const result = await NetworkService.nslookup(hostname);
            res.json(result);
        } catch (error) {
            logError('Nslookup command failed', {
                hostname: req.validatedBody?.hostname,
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({ 
                error: 'Nslookup command failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Netstat endpoint
 */
router.post('/netstat',
    SecurityMiddleware.rateLimiter,
    Validators.createValidationMiddleware(netstatSchema),
    async(req, res) => {
        try {
            const { args = [] } = req.validatedBody;
            const result = await NetworkService.netstat(args);
            res.json(result);
        } catch (error) {
            logError('Netstat command failed', {
                args: req.validatedBody?.args,
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({ 
                error: 'Netstat command failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Whois endpoint
 */
router.post('/whois',
    SecurityMiddleware.rateLimiter,
    Validators.createValidationMiddleware(domainSchema),
    async(req, res) => {
        try {
            const { domain } = req.validatedBody;
            const result = await NetworkService.whois(domain);
            res.json(result);
        } catch (error) {
            logError('Whois command failed', {
                domain: req.validatedBody?.domain,
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({ 
                error: 'Whois command failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * System info endpoint
 */
router.get('/system', async(req, res) => {
    try {
        const result = await NetworkService.getSystemInfo();
        res.json(result);
    } catch (error) {
        logError('System info failed', {
            error: error.message,
            ip: req.ip
        });
        
        res.status(500).json({ 
            error: 'System info failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Available commands endpoint
 */
router.get('/commands', async(req, res) => {
    try {
        const result = await NetworkService.getAvailableCommands();
        res.json(result);
    } catch (error) {
        logError('Available commands failed', {
            error: error.message,
            ip: req.ip
        });
        
        res.status(500).json({ 
            error: 'Available commands failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Health check endpoint
 */
router.get('/health', async(req, res) => {
    try {
        const result = await NetworkService.getHealthStatus();
        res.json(result);
    } catch (error) {
        logError('Health check failed', {
            error: error.message,
            ip: req.ip
        });
        
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Command test endpoint
 */
router.post('/test-command',
    SecurityMiddleware.rateLimiter,
    Validators.createValidationMiddleware(Joi.object({
        command: Validators.commandSchema.required()
    })),
    async(req, res) => {
        try {
            const { command } = req.validatedBody;
            const result = await NetworkService.testCommand(command);
            res.json(result);
        } catch (error) {
            logError('Command test failed', {
                command: req.validatedBody?.command,
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({ 
                error: 'Command test failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * Cache management endpoint
 */
router.get('/cache/stats', async(req, res) => {
    try {
        const result = await NetworkService.getCacheStats();
        res.json(result);
    } catch (error) {
        logError('Cache stats failed', {
            error: error.message,
            ip: req.ip
        });
        
        res.status(500).json({ 
            error: 'Cache stats failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Clear cache endpoint
 */
router.post('/cache/clear',
    SecurityMiddleware.rateLimiter,
    async(req, res) => {
        try {
            const result = await NetworkService.clearCache();
            res.json(result);
        } catch (error) {
            logError('Cache clear failed', {
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({ 
                error: 'Cache clear failed',
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
);

module.exports = router;
