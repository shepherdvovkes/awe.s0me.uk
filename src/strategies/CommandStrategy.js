const OpenAI = require('openai');
const config = require('../config/app');

/**
 * Strategy for command processing
 */
class CommandStrategy {
    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey
        });
    }

    /**
     * Processes command request
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
                        content: `You are a helpful assistant for a retro terminal server.
                        The user has entered a command that doesn't exist in the system.
                        Provide a helpful response that explains what they might have meant or suggest alternatives.
                        Keep responses concise and in the style of a 1970s computer terminal.
                        Do not use HTML tags or emojis in your response.`
                    },
                    {
                        role: 'user',
                        content: `Unknown command: ${query}`
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            });

            const response = completion.choices[0].message.content.trim();

            return {
                success: true,
                response: response,
                command: query
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                command: query
            };
        }
    }
}

module.exports = CommandStrategy; 