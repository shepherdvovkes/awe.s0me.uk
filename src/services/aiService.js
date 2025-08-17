const AIProcessor = require('../modules/aiProcessor');
const databaseManager = require('../modules/database');
const OutputFormatter = require('../utils/formatters');
const { logInfo, logError } = require('../utils/logger');
const config = require('../config/app');

/**
 * AI service for handling AI-related operations
 */
class AIService {
    /**
     * Generates MOTD with multilingual support
     * @returns {Promise<Object>} - MOTD result
     */
    static async generateMOTD() {
        try {
            const aiProcessor = new AIProcessor();

            // Check OpenAI availability
            if (!await aiProcessor.isOpenAIAvailable()) {
                throw new Error('AI service is currently unavailable');
            }

            // Get previous MOTDs to avoid repetition
            const previousMotds = await databaseManager.getMOTDHistory(5);
            const previousMessages = previousMotds.map(item => item.message);

            // Generate multilingual MOTD with previous messages to avoid repetition
            const multilingualMotds = await aiProcessor.generateMultilingualMOTD(previousMessages);

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
     * Intelligently processes any command or request
     * @param {string} command - Command or request to process
     * @param {boolean} isAdmin - Whether user is admin
     * @returns {Promise<Object>} - Processing result with type information
     */
    static async intelligentlyProcessCommand(command, isAdmin = false) {
        try {
            const aiProcessor = new AIProcessor();

            // Check OpenAI availability
            if (!await aiProcessor.isOpenAIAvailable()) {
                throw new Error('AI service is currently unavailable');
            }

            const result = await aiProcessor.intelligentlyProcessCommand(command, isAdmin);

            return {
                success: true,
                type: result.type,
                output: result.response,
                cached: result.cached,
                source: result.source,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Intelligent command processing service failed', { 
                command, 
                isAdmin, 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * Processes unknown command (legacy method)
     * @param {string} command - Command to process
     * @param {boolean} isAdmin - Whether user is admin
     * @returns {Promise<Object>} - Processing result
     */
    static async processUnknownCommand(command, isAdmin = false) {
        try {
            const aiProcessor = new AIProcessor();

            // Check OpenAI availability
            if (!await aiProcessor.isOpenAIAvailable()) {
                throw new Error('AI service is currently unavailable');
            }

            const response = await aiProcessor.processUnknownCommand(command, isAdmin);

            return {
                success: true,
                output: response,
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
    static async detectLegalRequest(query) {
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
     * Searches legal database
     * @param {string} query - Legal query
     * @param {string} language - Language
     * @returns {Promise<Object>} - Search result
     */
    static async searchLegalDatabase(query, language = 'ru') {
        try {
            const aiProcessor = new AIProcessor();

            // Check OpenAI availability
            if (!await aiProcessor.isOpenAIAvailable()) {
                throw new Error('AI service is currently unavailable');
            }

            const response = await aiProcessor.processLegalRequest(query, language);

            return {
                success: true,
                output: response,
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
     * Processes court case requests
     * @param {string} query - Court case query
     * @returns {Promise<Object>} - Processing result
     */
    static async processCourtCaseRequest(query) {
        try {
            const aiProcessor = new AIProcessor();

            // Check OpenAI availability
            if (!await aiProcessor.isOpenAIAvailable()) {
                throw new Error('AI service is currently unavailable');
            }

            const response = await aiProcessor.processCourtCaseRequest(query);

            return {
                success: true,
                output: response,
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
     * Processes TCC requests
     * @param {string} command - TCC command
     * @returns {Promise<Object>} - Processing result
     */
    static async processTCCRequest(command) {
        try {
            const aiProcessor = new AIProcessor();

            // Check OpenAI availability
            if (!await aiProcessor.isOpenAIAvailable()) {
                throw new Error('AI service is currently unavailable');
            }

            const response = await aiProcessor.processTCCRequest(command);

            return {
                success: true,
                output: response,
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
    static async getMOTDHistory(limit = 20) {
        try {
            const history = await databaseManager.getMOTDHistory(parseInt(limit));

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
    static async getOpenAIHistory(limit = 20) {
        try {
            const history = await databaseManager.getOpenAIHistory(parseInt(limit));

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
    static async getServiceStatus() {
        try {
            const aiProcessor = new AIProcessor();
            const isAvailable = await aiProcessor.isOpenAIAvailable();

            return {
                success: true,
                status: isAvailable ? 'available' : 'unavailable',
                timestamp: new Date().toISOString(),
                model: config.openai.model,
                environment: config.nodeEnv
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
    static async getServiceStats() {
        try {
            const [motdHistory, openaiHistory] = await Promise.all([
                databaseManager.getMOTDHistory(100),
                databaseManager.getOpenAIHistory(100)
            ]);

            const stats = {
                motd: {
                    total: motdHistory.length,
                    languages: motdHistory.reduce((acc, item) => {
                        acc[item.language] = (acc[item.language] || 0) + 1;
                        return acc;
                    }, {})
                },
                openai: {
                    total: openaiHistory.length,
                    types: openaiHistory.reduce((acc, item) => {
                        acc[item.request_type] = (acc[item.request_type] || 0) + 1;
                        return acc;
                    }, {})
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
}

module.exports = AIService; 