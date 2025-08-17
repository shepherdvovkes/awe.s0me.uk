const OpenAI = require('openai');
const config = require('../config/app');

/**
 * Strategy for MOTD (Message of the Day) generation
 */
class MOTDStrategy {
    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey
        });
    }

    /**
     * Processes MOTD generation request
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
                        content: `You are a retro terminal MOTD (Message of the Day) generator.
                        Create a brief, entertaining message that would appear when users log into a classic UNIX system.
                        The message should be:
                        - Retro/classic computer style
                        - Brief (1-2 lines)
                        - Slightly humorous or informative
                        - No HTML tags or emojis
                        - ASCII art is acceptable
                        
                        Examples:
                        "Welcome to the retro terminal! Type 'help' for available commands."
                        "System status: All circuits operational. Coffee level: Critical."
                        "Greetings, user! The mainframe is at your service."`
                    },
                    {
                        role: 'user',
                        content: query || 'Generate a MOTD'
                    }
                ],
                max_tokens: 100,
                temperature: 0.8
            });

            const motdMessage = completion.choices[0].message.content.trim();

            return {
                success: true,
                message: motdMessage,
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
}

module.exports = MOTDStrategy; 