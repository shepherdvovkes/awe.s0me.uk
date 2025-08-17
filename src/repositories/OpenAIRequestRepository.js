const IRepository = require('../interfaces/IRepository');
const { logError, logInfo } = require('../utils/logger');

/**
 * Repository for OpenAI request data
 */
class OpenAIRequestRepository extends IRepository {
    constructor(database) {
        super();
        this.database = database;
        this.tableName = 'openai_requests';
    }

    /**
     * Saves OpenAI request
     * @param {Object} requestData - Request data
     * @returns {Promise<Object>} - Save result
     */
    async save(requestData) {
        try {
            const sql = `
                INSERT INTO ${this.tableName} (
                    query, 
                    response, 
                    model, 
                    tokens_used, 
                    cost, 
                    user_ip, 
                    session_id, 
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;
            
            const params = [
                requestData.query,
                requestData.response,
                requestData.model || 'gpt-3.5-turbo',
                requestData.tokensUsed || 0,
                requestData.cost || 0,
                requestData.userIp || '',
                requestData.sessionId || ''
            ];

            const result = await this.database.runQuery(sql, params);
            
            return {
                success: true,
                id: result.lastID,
                query: requestData.query
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Gets request by ID
     * @param {string} id - Request ID
     * @returns {Promise<Object>} - Found request
     */
    async getById(id) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
            const result = await this.database.get(sql, [id]);
            
            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Gets all requests with optional filtering
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - Array of requests
     */
    async getAll(options = {}) {
        try {
            const {
                limit = 50,
                offset = 0,
                model = null,
                userIp = null,
                orderBy = 'created_at DESC'
            } = options;

            let sql = `SELECT * FROM ${this.tableName}`;
            const params = [];
            const conditions = [];

            if (model) {
                conditions.push('model = ?');
                params.push(model);
            }

            if (userIp) {
                conditions.push('user_ip = ?');
                params.push(userIp);
            }

            if (conditions.length > 0) {
                sql += ` WHERE ${conditions.join(' AND ')}`;
            }

            sql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const results = await this.database.getAll(sql, params);
            
            return {
                success: true,
                data: results,
                count: results.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Updates request data
     * @param {string} id - Request ID
     * @param {Object} data - Data to update
     * @returns {Promise<Object>} - Update result
     */
    async update(id, data) {
        try {
            const updateFields = [];
            const params = [];

            if (data.response !== undefined) {
                updateFields.push('response = ?');
                params.push(data.response);
            }

            if (data.tokensUsed !== undefined) {
                updateFields.push('tokens_used = ?');
                params.push(data.tokensUsed);
            }

            if (data.cost !== undefined) {
                updateFields.push('cost = ?');
                params.push(data.cost);
            }

            if (updateFields.length === 0) {
                return {
                    success: false,
                    error: 'No fields to update'
                };
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);

            const sql = `UPDATE ${this.tableName} SET ${updateFields.join(', ')} WHERE id = ?`;
            const result = await this.database.runQuery(sql, params);
            
            return {
                success: true,
                affectedRows: result.changes
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Deletes request record
     * @param {string} id - Request ID
     * @returns {Promise<Object>} - Delete result
     */
    async delete(id) {
        try {
            const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const result = await this.database.runQuery(sql, [id]);
            
            return {
                success: true,
                affectedRows: result.changes
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Gets request statistics
     * @returns {Promise<Object>} - Statistics
     */
    async getStatistics() {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_requests,
                    COUNT(DISTINCT user_ip) as unique_users,
                    COUNT(DISTINCT model) as models_used,
                    SUM(tokens_used) as total_tokens,
                    SUM(cost) as total_cost,
                    MAX(created_at) as last_request_date
                FROM ${this.tableName}
            `;
            
            const result = await this.database.get(sql);
            
            return {
                success: true,
                statistics: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Gets recent requests
     * @param {number} limit - Number of requests to get
     * @returns {Promise<Object>} - Recent requests
     */
    async getRecentRequests(limit = 10) {
        try {
            const sql = `
                SELECT * FROM ${this.tableName} 
                ORDER BY created_at DESC 
                LIMIT ?
            `;
            
            const results = await this.database.getAll(sql, [limit]);
            
            return {
                success: true,
                requests: results
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = OpenAIRequestRepository; 