/**
 * Base interface for repositories
 */
class IRepository {
    /**
     * Saves data
     * @param {Object} data - Data to save
     * @returns {Promise<Object>} - Save result
     */
    async save(data) {
        throw new Error('Method save() must be implemented');
    }

    /**
     * Gets data by ID
     * @param {string} id - Record ID
     * @returns {Promise<Object>} - Found record
     */
    async getById(id) {
        throw new Error('Method getById() must be implemented');
    }

    /**
     * Gets all records with optional filtering
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - Array of records
     */
    async getAll(options = {}) {
        throw new Error('Method getAll() must be implemented');
    }

    /**
     * Updates data
     * @param {string} id - Record ID
     * @param {Object} data - Data to update
     * @returns {Promise<Object>} - Update result
     */
    async update(id, data) {
        throw new Error('Method update() must be implemented');
    }

    /**
     * Deletes record
     * @param {string} id - Record ID
     * @returns {Promise<Object>} - Delete result
     */
    async delete(id) {
        throw new Error('Method delete() must be implemented');
    }
}

module.exports = IRepository; 