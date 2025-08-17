const OutputFormatter = require('../utils/formatters');
const { logInfo, logError } = require('../utils/logger');
const config = require('../config/app');

/**
 * AI service for handling AI-related operations with dependency injection and strategy pattern
 */
class AIService {
    /**
     * Конструктор с внедрением зависимостей
     * @param {Object} motdProcessor - Процессор MOTD
     * @param {Object} legalProcessor - Процессор юридических запросов
     * @param {Object} commandProcessor - Процессор команд
     * @param {Object} motdRepository - Репозиторий MOTD
     * @param {Object} openaiRequestRepository - Репозиторий OpenAI запросов
     * @param {Object} cacheManager - Менеджер кэша
     * @param {Object} aiRequestContext - Контекст стратегий
     */
    constructor(motdProcessor, legalProcessor, commandProcessor, motdRepository, openaiRequestRepository, cacheManager, aiRequestContext) {
        this.motdProcessor = motdProcessor;
        this.legalProcessor = legalProcessor;
        this.commandProcessor = commandProcessor;
        this.motdRepository = motdRepository;
        this.openaiRequestRepository = openaiRequestRepository;
        this.cacheManager = cacheManager;
        this.aiRequestContext = aiRequestContext;
    }

    /**
     * Generates MOTD with multilingual support
     * @returns {Promise<Object>} - MOTD result
     */
    async generateMOTD() {
        try {
            // Check OpenAI availability
            if (!await this.motdProcessor.isAvailable()) {
                throw new Error('AI service is currently unavailable');
            }

            // Get previous MOTDs to avoid repetition
            const previousMessages = await this.motdRepository.getRecentMOTDs(5);

            // Generate multilingual MOTD with previous messages to avoid repetition
            const multilingualMotds = await this.motdProcessor.generateMultilingualMOTD(previousMessages);

            // Save MOTDs to database
            for (const motd of multilingualMotds) {
                await this.motdRepository.save({
                    message: motd.message,
                    prompt: motd.prompt,
                    language: motd.code
                });
            }

            // Format output
            const formattedOutput = OutputFormatter.formatMOTD(multilingualMotds);

            return {
                success: true,
                output: formattedOutput,
                multilingual: multilingualMotds,
                cached: false,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('MOTD generation service failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Processes unknown command using strategy pattern
     * @param {string} command - Command to process
     * @param {boolean} isAdmin - Whether user is admin
     * @returns {Promise<Object>} - Processing result
     */
    async processUnknownCommand(command, isAdmin = false) {
        try {
            // Check OpenAI availability
            if (!await this.commandProcessor.isAvailable()) {
                throw new Error('AI service is currently unavailable');
            }

            const result = await this.aiRequestContext.processRequest('command', command, { isAdmin });

            // Save to database
            await this.openaiRequestRepository.save({
                requestType: 'unknown_command',
                prompt: command,
                response: result.response
            });

            return {
                success: true,
                output: result.response,
                cached: false,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Command processing service failed', { 
                command, 
                isAdmin, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * Detects legal requests
     * @param {string} query - Query to analyze
     * @returns {Promise<Object>} - Detection result
     */
    async detectLegalRequest(query) {
        try {
            // Simple legal request detection
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

            return {
                success: true,
                isLegal,
                confidence: isLegal ? 0.8 : 0.2,
                language: detectedLanguage,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Legal detection service failed', { query, error: error.message });
            throw error;
        }
    }

    /**
     * Searches legal database using strategy pattern
     * @param {string} query - Legal query
     * @param {string} language - Language
     * @returns {Promise<Object>} - Search result
     */
    async searchLegalDatabase(query, language = 'ru') {
        try {
            // Check OpenAI availability
            if (!await this.legalProcessor.isAvailable()) {
                throw new Error('AI service is currently unavailable');
            }

            const result = await this.aiRequestContext.processRequest('legal', query, { language });

            // Save to database
            await this.openaiRequestRepository.save({
                requestType: 'legal_request',
                prompt: query,
                response: result.response
            });

            return {
                success: true,
                output: result.response,
                cached: false,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Legal search service failed', { 
                query, 
                language, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * Processes court case requests using strategy pattern
     * @param {string} query - Court case query
     * @returns {Promise<Object>} - Processing result
     */
    async processCourtCaseRequest(query) {
        try {
            // Check OpenAI availability
            if (!await this.legalProcessor.isAvailable()) {
                throw new Error('AI service is currently unavailable');
            }

            const legalStrategy = this.aiRequestContext.getLegalStrategy();
            const result = await legalStrategy.processCourtCaseRequest(query);

            // Save to database
            await this.openaiRequestRepository.save({
                requestType: 'court_case_numbers_request',
                prompt: query,
                response: result.response
            });

            return {
                success: true,
                output: result.response,
                cached: false,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Court case processing service failed', { 
                query, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * Processes TCC requests using strategy pattern
     * @param {string} command - TCC command
     * @returns {Promise<Object>} - Processing result
     */
    async processTCCRequest(command) {
        try {
            // Check OpenAI availability
            if (!await this.legalProcessor.isAvailable()) {
                throw new Error('AI service is currently unavailable');
            }

            const legalStrategy = this.aiRequestContext.getLegalStrategy();
            const result = await legalStrategy.processTCCRequest(command);

            // Save to database
            await this.openaiRequestRepository.save({
                requestType: 'tcc_request',
                prompt: command,
                response: result.response
            });

            return {
                success: true,
                output: result.response,
                cached: false,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('TCC request processing service failed', { 
                command, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * Gets MOTD history
     * @param {number} limit - Number of records to return
     * @returns {Promise<Object>} - MOTD history
     */
    async getMOTDHistory(limit = 20) {
        try {
            const history = await this.motdRepository.getAll({ limit });

            return {
                success: true,
                history,
                formatted: OutputFormatter.formatMOTDHistory(history),
                total: history.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('MOTD history service failed', { limit, error: error.message });
            throw error;
        }
    }

    /**
     * Gets OpenAI requests history
     * @param {number} limit - Number of records to return
     * @returns {Promise<Object>} - OpenAI history
     */
    async getOpenAIHistory(limit = 20) {
        try {
            const history = await this.openaiRequestRepository.getAll({ limit });

            return {
                success: true,
                history,
                total: history.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('OpenAI history service failed', { limit, error: error.message });
            throw error;
        }
    }

    /**
     * Gets AI service status
     * @returns {Promise<Object>} - Service status
     */
    async getServiceStatus() {
        try {
            const isAvailable = await this.motdProcessor.isAvailable();

            return {
                success: true,
                status: isAvailable ? 'available' : 'unavailable',
                timestamp: new Date().toISOString(),
                model: config.openai.model,
                environment: config.nodeEnv,
                availableStrategies: this.aiRequestContext.getAvailableTypes()
            };
        } catch (error) {
            logError('AI service status failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Gets AI service statistics
     * @returns {Promise<Object>} - Service statistics
     */
    async getServiceStats() {
        try {
            const [motdStats, openaiStats] = await Promise.all([
                this.motdRepository.getMOTDStats(),
                this.openaiRequestRepository.getRequestStats()
            ]);

            const stats = {
                motd: {
                    total: motdStats.reduce((sum, item) => sum + item.total_count, 0),
                    languages: motdStats.reduce((acc, item) => {
                        acc[item.language] = item.total_count;
                        return acc;
                    }, {})
                },
                openai: {
                    total: openaiStats.reduce((sum, item) => sum + item.total_count, 0),
                    types: openaiStats.reduce((acc, item) => {
                        acc[item.request_type] = item.total_count;
                        return acc;
                    }, {})
                },
                strategies: {
                    available: this.aiRequestContext.getAvailableTypes(),
                    count: this.aiRequestContext.getAvailableTypes().length
                },
                timestamp: new Date().toISOString()
            };

            return {
                success: true,
                ...stats
            };
        } catch (error) {
            logError('AI service stats failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Gets available AI strategies
     * @returns {Promise<Object>} - Available strategies
     */
    async getAvailableStrategies() {
        try {
            const strategies = this.aiRequestContext.getAvailableTypes();
            const availability = {};

            for (const strategy of strategies) {
                availability[strategy] = await this.aiRequestContext.isStrategyAvailable(strategy);
            }

            return {
                success: true,
                strategies,
                availability,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Failed to get available strategies', { error: error.message });
            throw error;
        }
    }
}

module.exports = AIService; 