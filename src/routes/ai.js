const express = require('express');
const AIProcessor = require('../modules/aiProcessor');
const databaseManager = require('../modules/database');
const OutputFormatter = require('../utils/formatters');
const { logInfo, logError } = require('../utils/logger');
const SecurityMiddleware = require('../middleware/security');

const router = express.Router();

/**
 * MOTD endpoint
 */
router.post('/motd',
    SecurityMiddleware.aiRateLimiter,
    SecurityMiddleware.inputValidation,
    async(req, res) => {
        try {
            const aiProcessor = new AIProcessor();

            // Проверяем доступность OpenAI
            if (!await aiProcessor.isOpenAIAvailable()) {
                return res.status(503).json({
                    error: 'AI service is currently unavailable'
                });
            }

            // Получаем предыдущие MOTD для избежания повторений
            const previousMotds = await databaseManager.getMOTDHistory(5);
            const previousMessages = previousMotds.map(item => item.message);

            // Генерируем многоязычные MOTD
            const multilingualMotds = await aiProcessor.generateMultilingualMOTD();

            // Форматируем вывод
            const formattedOutput = OutputFormatter.formatMOTD(multilingualMotds);

            res.json({
                output: formattedOutput,
                multilingual: multilingualMotds
            });

        } catch (error) {
            logError('MOTD generation failed', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * Process unknown command endpoint
 */
router.post('/process-command',
    SecurityMiddleware.aiRateLimiter,
    SecurityMiddleware.inputValidation,
    async(req, res) => {
        try {
            const { command, isAdmin = false } = req.body;

            if (!command) {
                return res.status(400).json({ error: 'Command is required' });
            }

            const aiProcessor = new AIProcessor();

            // Проверяем доступность OpenAI
            if (!await aiProcessor.isOpenAIAvailable()) {
                return res.status(503).json({
                    error: 'AI service is currently unavailable'
                });
            }

            const response = await aiProcessor.processUnknownCommand(command, isAdmin);

            res.json({ output: response });

        } catch (error) {
            logError('Command processing failed', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * Legal request detection endpoint
 */
router.post('/detect-legal',
    SecurityMiddleware.aiRateLimiter,
    SecurityMiddleware.inputValidation,
    async(req, res) => {
        try {
            const { query } = req.body;

            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            // Простая детекция юридических запросов
            const legalKeywords = [
                'закон', 'право', 'юридический', 'адвокат', 'суд', 'позов', 'договор',
                'law', 'legal', 'attorney', 'lawyer', 'court', 'case', 'contract'
            ];

            const lowerQuery = query.toLowerCase();
            const isLegal = legalKeywords.some(keyword => lowerQuery.includes(keyword));

            let detectedLanguage = 'en';
            if ((/[а-яё]/i).test(query)) {
                detectedLanguage = 'ru';
            }

            res.json({
                isLegal,
                confidence: isLegal ? 0.8 : 0.2,
                language: detectedLanguage
            });

        } catch (error) {
            logError('Legal detection failed', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * Legal database search endpoint
 */
router.post('/legal-search',
    SecurityMiddleware.aiRateLimiter,
    SecurityMiddleware.inputValidation,
    async(req, res) => {
        try {
            const { query, language = 'ru' } = req.body;

            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            const aiProcessor = new AIProcessor();

            // Проверяем доступность OpenAI
            if (!await aiProcessor.isOpenAIAvailable()) {
                return res.status(503).json({
                    error: 'AI service is currently unavailable'
                });
            }

            const response = await aiProcessor.processLegalRequest(query, language);

            res.json({ output: response });

        } catch (error) {
            logError('Legal search failed', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * Court case numbers endpoint
 */
router.post('/court-cases',
    SecurityMiddleware.aiRateLimiter,
    SecurityMiddleware.inputValidation,
    async(req, res) => {
        try {
            const { query } = req.body;

            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            const aiProcessor = new AIProcessor();

            // Проверяем доступность OpenAI
            if (!await aiProcessor.isOpenAIAvailable()) {
                return res.status(503).json({
                    error: 'AI service is currently unavailable'
                });
            }

            const response = await aiProcessor.processCourtCaseRequest(query);

            res.json({ output: response });

        } catch (error) {
            logError('Court case processing failed', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * TCC request endpoint
 */
router.post('/tcc',
    SecurityMiddleware.aiRateLimiter,
    SecurityMiddleware.inputValidation,
    async(req, res) => {
        try {
            const { command } = req.body;

            if (!command) {
                return res.status(400).json({ error: 'Command is required' });
            }

            const aiProcessor = new AIProcessor();

            // Проверяем доступность OpenAI
            if (!await aiProcessor.isOpenAIAvailable()) {
                return res.status(503).json({
                    error: 'AI service is currently unavailable'
                });
            }

            const response = await aiProcessor.processTCCRequest(command);

            res.json({ output: response });

        } catch (error) {
            logError('TCC request processing failed', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * MOTD history endpoint
 */
router.get('/motd/history', async(req, res) => {
    try {
        const { limit = 20 } = req.query;
        const history = await databaseManager.getMOTDHistory(parseInt(limit));

        res.json({
            history,
            formatted: OutputFormatter.formatMOTDHistory(history)
        });

    } catch (error) {
        logError('MOTD history failed', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * OpenAI requests history endpoint
 */
router.get('/openai/history', async(req, res) => {
    try {
        const { limit = 20 } = req.query;
        const history = await databaseManager.getOpenAIHistory(parseInt(limit));

        res.json({ history });

    } catch (error) {
        logError('OpenAI history failed', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * AI service status endpoint
 */
router.get('/status', async(req, res) => {
    try {
        const aiProcessor = new AIProcessor();
        const isAvailable = await aiProcessor.isOpenAIAvailable();

        res.json({
            status: isAvailable ? 'available' : 'unavailable',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logError('AI status check failed', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

module.exports = router;
