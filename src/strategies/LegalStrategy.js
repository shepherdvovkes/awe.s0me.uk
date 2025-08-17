const OpenAI = require('openai');
const config = require('../config/app');

/**
 * Strategy for legal request processing
 */
class LegalStrategy {
    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey
        });
    }

    /**
     * Processes legal request
     * @param {string} query - User query
     * @param {Object} context - Processing context
     * @returns {Promise<Object>} - Processing result
     */
    async process(query, context = {}) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: config.openai.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are a legal AI assistant specializing in Ukrainian law.
                        The user has asked a legal question. Provide accurate legal information and guidance.
                        Always recommend consulting with a qualified attorney for specific legal advice.
                        Keep responses professional and informative.
                        Do not use HTML tags or emojis in your response.`
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                max_tokens: 300,
                temperature: 0.3
            });

            const response = completion.choices[0].message.content.trim();

            return {
                success: true,
                response: response,
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
}

module.exports = LegalStrategy; 