const IRepository = require('../interfaces/IRepository');
const { logError, logInfo } = require('../utils/logger');

/**
 * Repository for user data
 */
class UserRepository extends IRepository {
    constructor(database) {
        super();
        this.database = database;
        this.tableName = 'users';
    }

    /**
     * Creates new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} - Creation result
     */
    async save(userData) {
        try {
            const sql = `
                INSERT INTO ${this.tableName} (
                    username, 
                    password_hash, 
                    email, 
                    role, 
                    is_active, 
                    created_at
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;
            
            const params = [
                userData.username,
                userData.passwordHash,
                userData.email || '',
                userData.role || 'user',
                userData.isActive !== false ? 1 : 0
            ];

            const result = await this.database.runQuery(sql, params);
            
            return {
                success: true,
                id: result.lastID,
                username: userData.username
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Gets user by ID
     * @param {string} id - User ID
     * @returns {Promise<Object>} - Found user
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
     * Gets user by username
     * @param {string} username - Username
     * @returns {Promise<Object>} - Found user
     */
    async getByUsername(username) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE username = ?`;
            const result = await this.database.get(sql, [username]);
            
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
     * Gets user by email
     * @param {string} email - Email
     * @returns {Promise<Object>} - Found user
     */
    async getByEmail(email) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE email = ?`;
            const result = await this.database.get(sql, [email]);
            
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
     * Gets all users with optional filtering
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - Array of users
     */
    async getAll(options = {}) {
        try {
            const {
                limit = 50,
                offset = 0,
                role = null,
                isActive = null,
                orderBy = 'created_at DESC'
            } = options;

            let sql = `SELECT * FROM ${this.tableName}`;
            const params = [];
            const conditions = [];

            if (role) {
                conditions.push('role = ?');
                params.push(role);
            }

            if (isActive !== null) {
                conditions.push('is_active = ?');
                params.push(isActive ? 1 : 0);
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
     * Updates user data
     * @param {string} id - User ID
     * @param {Object} data - Data to update
     * @returns {Promise<Object>} - Update result
     */
    async update(id, data) {
        try {
            const updateFields = [];
            const params = [];

            if (data.username !== undefined) {
                updateFields.push('username = ?');
                params.push(data.username);
            }

            if (data.email !== undefined) {
                updateFields.push('email = ?');
                params.push(data.email);
            }

            if (data.passwordHash !== undefined) {
                updateFields.push('password_hash = ?');
                params.push(data.passwordHash);
            }

            if (data.role !== undefined) {
                updateFields.push('role = ?');
                params.push(data.role);
            }

            if (data.isActive !== undefined) {
                updateFields.push('is_active = ?');
                params.push(data.isActive ? 1 : 0);
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
     * Updates user data
     * @param {string} id - User ID
     * @param {Object} data - Data to update
     * @returns {Promise<Object>} - Update result
     */
    async updateUser(id, data) {
        return await this.update(id, data);
    }

    /**
     * Deletes user record
     * @param {string} id - User ID
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
     * Deletes user record
     * @param {string} id - User ID
     * @returns {Promise<Object>} - Delete result
     */
    async deleteUser(id) {
        return await this.delete(id);
    }

    /**
     * Gets user statistics
     * @returns {Promise<Object>} - Statistics
     */
    async getStatistics() {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
                    COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_users,
                    COUNT(DISTINCT role) as unique_roles,
                    MAX(created_at) as last_user_created
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
     * Gets users by role
     * @param {string} role - User role
     * @returns {Promise<Object>} - Users with role
     */
    async getUsersByRole(role) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE role = ? ORDER BY created_at DESC`;
            const results = await this.database.getAll(sql, [role]);
            
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
}

module.exports = UserRepository; 

module.exports = UserRepository; 