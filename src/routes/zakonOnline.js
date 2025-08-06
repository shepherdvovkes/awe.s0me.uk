const express = require('express');
const router = express.Router();
const ZakonOnlineService = require('../services/zakonOnlineService');
const { logError, logInfo } = require('../utils/logger');
const databaseManager = require('../modules/database');

/**
 * GET /api/zakon-online/search
 * Поиск в базе "Закон Онлайн"
 */
router.get('/search', async (req, res) => {
    try {
        const { query, page = 1, pageSize = 10, courtId, judgmentFormId, justiceKindId } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter is required'
            });
        }

        const zakonService = new ZakonOnlineService();
        await zakonService.initialize();

        const searchResults = await zakonService.performFullSearch(query, {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            courtId: courtId || null,
            judgmentFormId: judgmentFormId || null,
            justiceKindId: justiceKindId || null,
            saveToDatabase: true
        });

        logInfo('Zakon Online search completed', { 
            query, 
            totalCount: searchResults.totalCount,
            success: searchResults.success 
        });

        res.json({
            success: true,
            data: searchResults
        });

    } catch (error) {
        logError('Zakon Online search error', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/zakon-online/courts
 * Получение списка судов
 */
router.get('/courts', async (req, res) => {
    try {
        const zakonService = new ZakonOnlineService();
        await zakonService.initialize();

        const courts = await zakonService.getCourts();

        res.json({
            success: true,
            data: courts
        });

    } catch (error) {
        logError('Error getting courts', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/zakon-online/judgment-forms
 * Получение форм решений
 */
router.get('/judgment-forms', async (req, res) => {
    try {
        const zakonService = new ZakonOnlineService();
        await zakonService.initialize();

        const forms = await zakonService.getJudgmentForms();

        res.json({
            success: true,
            data: forms
        });

    } catch (error) {
        logError('Error getting judgment forms', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/zakon-online/justice-kinds
 * Получение видов правосудия
 */
router.get('/justice-kinds', async (req, res) => {
    try {
        const zakonService = new ZakonOnlineService();
        await zakonService.initialize();

        const kinds = await zakonService.getJusticeKinds();

        res.json({
            success: true,
            data: kinds
        });

    } catch (error) {
        logError('Error getting justice kinds', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/zakon-online/history
 * Получение истории поисков
 */
router.get('/history', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        const zakonService = new ZakonOnlineService();
        await zakonService.initialize();

        const history = await zakonService.getSearchHistory(parseInt(limit));

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        logError('Error getting search history', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/zakon-online/search/:id
 * Получение деталей конкретного поиска
 */
router.get('/search/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const zakonService = new ZakonOnlineService();
        await zakonService.initialize();

        const details = await zakonService.getSearchDetails(parseInt(id));

        res.json({
            success: true,
            data: details
        });

    } catch (error) {
        logError('Error getting search details', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/zakon-online/stats
 * Получение статистики поисков
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await databaseManager.getZakonOnlineStats();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logError('Error getting Zakon Online stats', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/zakon-online/top-searches
 * Получение топ поисковых запросов
 */
router.get('/top-searches', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const topSearches = await databaseManager.getTopSearches(parseInt(limit));

        res.json({
            success: true,
            data: topSearches
        });

    } catch (error) {
        logError('Error getting top searches', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/zakon-online/cleanup
 * Очистка старых записей поисков
 */
router.post('/cleanup', async (req, res) => {
    try {
        const { daysOld = 30 } = req.body;
        
        const deletedCount = await databaseManager.cleanupOldSearches(parseInt(daysOld));

        res.json({
            success: true,
            message: `Cleaned up ${deletedCount} old searches`,
            deletedCount
        });

    } catch (error) {
        logError('Error cleaning up old searches', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 