const IRepository = require('../interfaces/IRepository');
const { logError, logInfo } = require('../utils/logger');

/**
 * Repository for MOTD (Message of the Day) data
 */
class MOTDRepository extends IRepository {
    constructor(database) {
        super();
        this.database = database;
        this.tableName = 'motd_history';
    }

    /**
     * Saves MOTD to database
     * @param {Object} motdData - MOTD data
     * @returns {Promise<Object>} - Save result
     */
    async save(motdData) {
        try {
            const sql = `
                INSERT INTO ${this.tableName} (
                    message, 
                    type, 
                    created_at, 
                    user_ip, 
                    session_id
                ) VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)
            `;
            
            const params = [
                motdData.message,
                motdData.type || 'default',
                motdData.userIp || '',
                motdData.sessionId || ''
            ];

            const result = await this.database.runQuery(sql, params);
            
            return {
                success: true,
                id: result.lastID,
                message: motdData.message
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Gets MOTD by ID
     * @param {string} id - MOTD ID
     * @returns {Promise<Object>} - Found MOTD
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
     * Gets all MOTD records with optional filtering
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - Array of MOTD records
     */
    async getAll(options = {}) {
        try {
            const {
                limit = 50,
                offset = 0,
                type = null,
                userIp = null,
                orderBy = 'created_at DESC'
            } = options;

            let sql = `SELECT * FROM ${this.tableName}`;
            const params = [];
            const conditions = [];

            if (type) {
                conditions.push('type = ?');
                params.push(type);
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
     * Updates MOTD data
     * @param {string} id - MOTD ID
     * @param {Object} data - Data to update
     * @returns {Promise<Object>} - Update result
     */
    async update(id, data) {
        try {
            const updateFields = [];
            const params = [];

            if (data.message !== undefined) {
                updateFields.push('message = ?');
                params.push(data.message);
            }

            if (data.type !== undefined) {
                updateFields.push('type = ?');
                params.push(data.type);
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
     * Deletes MOTD record
     * @param {string} id - MOTD ID
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
     * Gets MOTD statistics
     * @returns {Promise<Object>} - Statistics
     */
    async getStatistics() {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_messages,
                    COUNT(DISTINCT user_ip) as unique_users,
                    COUNT(DISTINCT type) as message_types,
                    MAX(created_at) as last_message_date
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
     * Gets recent MOTD messages
     * @param {number} limit - Number of messages to get
     * @returns {Promise<Object>} - Recent messages
     */
    async getRecentMessages(limit = 10) {
        try {
            const sql = `
                SELECT * FROM ${this.tableName} 
                ORDER BY created_at DESC 
                LIMIT ?
            `;
            
            const results = await this.database.getAll(sql, [limit]);
            
            return {
                success: true,
                messages: results
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = MOTDRepository; 