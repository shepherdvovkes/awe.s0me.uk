const OpenAI = require('openai');
const config = require('../../config/app');

/**
 * Processor for legal request detection and processing
 */
class LegalProcessor {
    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey
        });
    }

    /**
     * Detects if request is legal-related
     * @param {string} query - User query
     * @param {Object} context - Processing context
     * @returns {Promise<Object>} - Detection result
     */
    async detectLegalRequest(query, context = {}) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: config.openai.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are a legal request detector. 
                        Determine if the user's query is related to legal matters, court cases, or Ukrainian law.
                        Respond with JSON: {"isLegal": true/false, "confidence": 0-1, "reason": "explanation"}`
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                max_tokens: 200,
                temperature: 0.3
            });

            const response = completion.choices[0].message.content;
            const result = JSON.parse(response);

            return {
                success: true,
                isLegal: result.isLegal,
                confidence: result.confidence,
                reason: result.reason,
                query: query
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                query: query
            };
        }
    }

    /**
     * Extracts search query from legal request
     * @param {string} query - Legal request
     * @param {Object} context - Processing context
     * @returns {Promise<Object>} - Extraction result
     */
    async extractSearchQuery(query, context = {}) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: config.openai.model,
                messages: [
                    {
                        role: 'system',
                        content: `Extract a search query for Ukrainian legal database from the user's request.
                        Focus on key legal terms, court cases, or legal issues mentioned.
                        Respond with JSON: {"searchQuery": "extracted query", "confidence": 0-1}`
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                max_tokens: 150,
                temperature: 0.3
            });

            const response = completion.choices[0].message.content;
            const result = JSON.parse(response);

            return {
                success: true,
                searchQuery: result.searchQuery,
                confidence: result.confidence,
                originalQuery: query
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                originalQuery: query
            };
        }
    }

    /**
     * Processes legal request
     * @param {string} query - Legal request
     * @param {Object} context - Processing context
     * @returns {Promise<Object>} - Processing result
     */
    async process(query, context = {}) {
        try {
            // First detect if it's a legal request
            const detection = await this.detectLegalRequest(query, context);
            
            if (!detection.success) {
                return detection;
            }

            if (!detection.isLegal) {
                return {
                    success: true,
                    isLegal: false,
                    message: 'This request does not appear to be legal-related.',
                    query: query
                };
            }

            // Extract search query
            const extraction = await this.extractSearchQuery(query, context);
            
            if (!extraction.success) {
                return extraction;
            }

            return {
                success: true,
                isLegal: true,
                searchQuery: extraction.searchQuery,
                confidence: extraction.confidence,
                originalQuery: query
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                query: query
            };
        }
    }
}

module.exports = LegalProcessor; 