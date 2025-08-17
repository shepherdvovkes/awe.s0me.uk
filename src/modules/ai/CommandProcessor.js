const OpenAI = require('openai');
const config = require('../../config/app');

/**
 * Processor for handling unknown commands
 */
class CommandProcessor {
    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey
        });
    }

    /**
     * Processes unknown command
     * @param {string} command - Command
     * @param {Object} context - Processing context
     * @returns {Promise<Object>} - Processing result
     */
    async process(command, context = {}) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: config.openai.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful assistant for a retro terminal server. 
                        The user is asking about a command that doesn't exist in the system.
                        Provide a helpful response explaining what they might want to do instead.
                        Keep the response concise and retro-style.`
                    },
                    {
                        role: 'user',
                        content: `Unknown command: ${command}`
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            });

            return {
                success: true,
                response: completion.choices[0].message.content,
                command: command
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                command: command
            };
        }
    }

    /**
     * Checks OpenAI API availability
     * @returns {Promise<boolean>} - Whether API is available
     */
    async isAvailable() {
        try {
            await this.openai.chat.completions.create({
                model: config.openai.model,
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = CommandProcessor; 