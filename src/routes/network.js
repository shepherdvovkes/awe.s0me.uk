const express = require('express');
const CommandExecutor = require('../modules/commandExecutor');
const OutputFormatter = require('../utils/formatters');
const cacheManager = require('../modules/cache');
const { logInfo, logError } = require('../utils/logger');
const SecurityMiddleware = require('../middleware/security');

const router = express.Router();

/**
 * Ping endpoint
 */
router.post('/ping',
    SecurityMiddleware.rateLimiter,
    SecurityMiddleware.inputValidation,
    async(req, res) => {
        try {
            const { hostname } = req.body;

            if (!hostname) {
                return res.status(400).json({ error: 'Hostname is required' });
            }

            const cacheKey = cacheManager.createNetworkKey(hostname, 'ping');

            const result = await cacheManager.getOrSet(cacheKey, async() => {
                const output = await CommandExecutor.ping(hostname);
                return OutputFormatter.formatPingOutput(output);
            }, 300); // 5 минут кэш

            res.json({ output: result });

        } catch (error) {
            logError('Ping command failed', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * Traceroute endpoint
 */
router.post('/traceroute',
    SecurityMiddleware.rateLimiter,
    SecurityMiddleware.inputValidation,
    async(req, res) => {
        try {
            const { hostname } = req.body;

            if (!hostname) {
                return res.status(400).json({ error: 'Hostname is required' });
            }

            const cacheKey = cacheManager.createNetworkKey(hostname, 'traceroute');

            const result = await cacheManager.getOrSet(cacheKey, async() => {
                const output = await CommandExecutor.traceroute(hostname);
                return OutputFormatter.formatOutput(output);
            }, 600); // 10 минут кэш

            res.json({ output: result });

        } catch (error) {
            logError('Traceroute command failed', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * Nslookup endpoint
 */
router.post('/nslookup',
    SecurityMiddleware.rateLimiter,
    SecurityMiddleware.inputValidation,
    async(req, res) => {
        try {
            const { hostname } = req.body;

            if (!hostname) {
                return res.status(400).json({ error: 'Hostname is required' });
            }

            const cacheKey = cacheManager.createNetworkKey(hostname, 'nslookup');

            const result = await cacheManager.getOrSet(cacheKey, async() => {
                const output = await CommandExecutor.nslookup(hostname);
                return OutputFormatter.formatOutput(output);
            }, 1800); // 30 минут кэш

            res.json({ output: result });

        } catch (error) {
            logError('Nslookup command failed', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * Netstat endpoint
 */
router.post('/netstat',
    SecurityMiddleware.rateLimiter,
    SecurityMiddleware.inputValidation,
    async(req, res) => {
        try {
            const { args = [] } = req.body;

            const cacheKey = cacheManager.createCommandKey('netstat', args);

            const result = await cacheManager.getOrSet(cacheKey, async() => {
                const output = await CommandExecutor.netstat(args);
                return OutputFormatter.formatOutput(output);
            }, 60); // 1 минута кэш

            res.json({ output: result });

        } catch (error) {
            logError('Netstat command failed', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * Whois endpoint
 */
router.post('/whois',
    SecurityMiddleware.rateLimiter,
    SecurityMiddleware.inputValidation,
    async(req, res) => {
        try {
            const { domain } = req.body;

            if (!domain) {
                return res.status(400).json({ error: 'Domain is required' });
            }

            const cacheKey = cacheManager.createNetworkKey(domain, 'whois');

            const result = await cacheManager.getOrSet(cacheKey, async() => {
                const output = await CommandExecutor.whois(domain);
                return OutputFormatter.formatOutput(output);
            }, 3600); // 1 час кэш

            res.json({ output: result });

        } catch (error) {
            logError('Whois command failed', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * System info endpoint
 */
router.get('/system', async(req, res) => {
    try {
        const systemInfo = CommandExecutor.getSystemInfo();
        const formattedInfo = OutputFormatter.formatSystemInfo(systemInfo);

        res.json({
            info: systemInfo,
            formatted: formattedInfo
        });

    } catch (error) {
        logError('System info failed', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Available commands endpoint
 */
router.get('/commands', async(req, res) => {
    try {
        const availableCommands = await CommandExecutor.getAvailableCommands();

        res.json({
            commands: availableCommands,
            total: availableCommands.length
        });

    } catch (error) {
        logError('Available commands failed', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Health check endpoint
 */
router.get('/health', async(req, res) => {
    try {
        const health = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cache: cacheManager.getStats()
        };

        res.json(health);

    } catch (error) {
        logError('Health check failed', error);
        res.status(500).json({
            status: 'ERROR',
            error: error.message
        });
    }
});

module.exports = router;
