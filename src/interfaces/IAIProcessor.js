/**
 * Interface for AI processor
 */
class IAIProcessor {
    /**
     * Processes request
     * @param {string} query - Query to process
     * @param {Object} context - Processing context
     * @returns {Promise<Object>} - Processing result
     */
    async process(query, context = {}) {
        throw new Error('Method process() must be implemented');
    }
}

module.exports = IAIProcessor; 