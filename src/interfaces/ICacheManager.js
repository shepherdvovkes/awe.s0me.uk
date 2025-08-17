/**
 * Interface for cache manager
 */
class ICacheManager {
    /**
     * Gets value from cache or sets it
     * @param {string} key - Cache key
     * @param {Function} fetchFunction - Function to get data
     * @param {number} ttl - Time to live in seconds
     * @returns {Promise<any>} - Value from cache or new value
     */
    async getOrSet(key, fetchFunction, ttl = 300) {
        throw new Error('Method getOrSet() must be implemented');
    }

    /**
     * Gets value from cache
     * @param {string} key - Cache key
     * @returns {any} - Value from cache or undefined
     */
    get(key) {
        throw new Error('Method get() must be implemented');
    }

    /**
     * Sets value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds
     */
    set(key, value, ttl = 300) {
        throw new Error('Method set() must be implemented');
    }

    /**
     * Removes value from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        throw new Error('Method delete() must be implemented');
    }

    /**
     * Clears entire cache
     */
    clear() {
        throw new Error('Method clear() must be implemented');
    }

    /**
     * Checks if key exists in cache
     * @param {string} key - Key to check
     * @returns {boolean} - Whether key exists
     */
    has(key) {
        throw new Error('Method has() must be implemented');
    }
}

module.exports = ICacheManager; 