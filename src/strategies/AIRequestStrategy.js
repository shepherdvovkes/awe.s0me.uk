/**
 * Base strategy for AI request processing
 */
class AIRequestStrategy {
    constructor() {
        this.type = 'base';
    }

    /**
     * Processes AI request
     * @param {string} query - User query
     * @param {Object} context - Processing context
     * @returns {Promise<Object>} - Processing result
     */
    async process(query, context = {}) {
        throw new Error('Method process() must be implemented by subclass');
    }

    /**
     * Checks if service is available
     * @returns {Promise<boolean>} - Whether service is available
     */
    async isAvailable() {
        return true;
    }

    /**
     * Gets strategy type
     * @returns {string} - Strategy type
     */
    getType() {
        return this.type;
    }
}

module.exports = AIRequestStrategy; 