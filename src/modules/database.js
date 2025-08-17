const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { logInfo, logError } = require('../utils/logger');

/**
 * Database management module
 */
class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, '../../database.sqlite');
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Initializes database connection
     * @returns {Promise} - Initialization result
     */
    async initialize() {
        try {
            this.db = new sqlite3.Database(this.dbPath);
            
            await this.createTables();
            this.isInitialized = true;
            
            logInfo('Database initialized successfully');
            return { success: true };
        } catch (error) {
            logError('Database initialization failed', error);
            throw error;
        }
    }

    /**
     * Creates database tables
     * @returns {Promise} - Creation result
     */
    async createTables() {
        const tables = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT,
                role TEXT DEFAULT 'user',
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // MOTD history table
            `CREATE TABLE IF NOT EXISTS motd_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'default',
                user_ip TEXT,
                session_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // OpenAI requests table
            `CREATE TABLE IF NOT EXISTS openai_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                response TEXT,
                model TEXT DEFAULT 'gpt-3.5-turbo',
                tokens_used INTEGER DEFAULT 0,
                cost REAL DEFAULT 0,
                user_ip TEXT,
                session_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Command logs table
            `CREATE TABLE IF NOT EXISTS command_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                command TEXT NOT NULL,
                result TEXT,
                user_ip TEXT,
                session_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Security events table
            `CREATE TABLE IF NOT EXISTS security_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                description TEXT,
                user_ip TEXT,
                session_id TEXT,
                severity TEXT DEFAULT 'info',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Zakon Online searches table
            `CREATE TABLE IF NOT EXISTS zakon_online_searches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                total_count INTEGER DEFAULT 0,
                page INTEGER DEFAULT 1,
                page_size INTEGER DEFAULT 10,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Zakon Online cases table
            `CREATE TABLE IF NOT EXISTS zakon_online_cases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                search_id INTEGER,
                case_id TEXT,
                court_name TEXT,
                judgment_form TEXT,
                justice_kind TEXT,
                case_date TEXT,
                case_number TEXT,
                summary TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (search_id) REFERENCES zakon_online_searches(id)
            )`,

            // Zakon Online full texts table
            `CREATE TABLE IF NOT EXISTS zakon_online_full_texts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id TEXT,
                full_text TEXT,
                highlights TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            await this.runQuery(table);
        }

        logInfo('Database tables created successfully');
    }

    /**
     * Runs SQL query
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise} - Query result
     */
    async runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(error) {
                if (error) {
                    logError('Database query failed', { sql, error: error.message });
                    reject(error);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Gets single record
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} - Query result
     */
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (error, row) => {
                if (error) {
                    logError('Database get failed', { sql, error: error.message });
                    reject(error);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Gets multiple records
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>} - Query results
     */
    async getAll(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (error, rows) => {
                if (error) {
                    logError('Database getAll failed', { sql, error: error.message });
                    reject(error);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Saves MOTD to database
     * @param {Object} motdData - MOTD data
     * @returns {Promise} - Save result
     */
    async saveMOTD(motdData) {
        try {
            const sql = `
                INSERT INTO motd_history (message, type, user_ip, session_id)
                VALUES (?, ?, ?, ?)
            `;
            
            const result = await this.runQuery(sql, [
                motdData.message,
                motdData.type || 'default',
                motdData.userIp || '',
                motdData.sessionId || ''
            ]);

            logInfo('MOTD saved to database', { id: result.lastID });
            return { success: true, id: result.lastID };
        } catch (error) {
            logError('Failed to save MOTD', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Saves OpenAI request
     * @param {Object} requestData - Request data
     * @returns {Promise} - Save result
     */
    async saveOpenAIRequest(requestData) {
        try {
            const sql = `
                INSERT INTO openai_requests (query, response, model, tokens_used, cost, user_ip, session_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await this.runQuery(sql, [
                requestData.query,
                requestData.response,
                requestData.model || 'gpt-3.5-turbo',
                requestData.tokensUsed || 0,
                requestData.cost || 0,
                requestData.userIp || '',
                requestData.sessionId || ''
            ]);

            logInfo('OpenAI request saved to database', { id: result.lastID });
            return { success: true, id: result.lastID };
        } catch (error) {
            logError('Failed to save OpenAI request', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Saves command log
     * @param {string} command - Command name
     * @param {string} result - Command result
     * @param {Object} options - Additional options
     * @returns {Promise} - Save result
     */
    async saveCommandLog(command, result, options = {}) {
        try {
            const sql = `
                INSERT INTO command_logs (command, result, user_ip, session_id)
                VALUES (?, ?, ?, ?)
            `;
            
            const result = await this.runQuery(sql, [
                command,
                result,
                options.userIp || '',
                options.sessionId || ''
            ]);

            logInfo('Command log saved to database', { id: result.lastID });
            return { success: true, id: result.lastID };
        } catch (error) {
            logError('Failed to save command log', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Saves security event
     * @param {string} eventType - Event type
     * @param {string} description - Event description
     * @param {Object} options - Additional options
     * @returns {Promise} - Save result
     */
    async saveSecurityEvent(eventType, description, options = {}) {
        try {
            const sql = `
                INSERT INTO security_events (event_type, description, user_ip, session_id, severity)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const result = await this.runQuery(sql, [
                eventType,
                description,
                options.userIp || '',
                options.sessionId || '',
                options.severity || 'info'
            ]);

            logInfo('Security event saved to database', { id: result.lastID });
            return { success: true, id: result.lastID };
        } catch (error) {
            logError('Failed to save security event', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Creates user
     * @param {Object} userData - User data
     * @returns {Promise} - Creation result
     */
    async createUser(userData) {
        try {
            const sql = `
                INSERT INTO users (username, password_hash, email, role, is_active)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const result = await this.runQuery(sql, [
                userData.username,
                userData.passwordHash,
                userData.email || '',
                userData.role || 'user',
                userData.isActive !== false ? 1 : 0
            ]);

            logInfo('User created successfully', { id: result.lastID });
            return { success: true, id: result.lastID };
        } catch (error) {
            logError('Failed to create user', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Updates user
     * @param {number} userId - User ID
     * @param {Object} userData - User data
     * @returns {Promise} - Update result
     */
    async updateUser(userId, userData) {
        try {
            const updateFields = [];
            const params = [];

            if (userData.username !== undefined) {
                updateFields.push('username = ?');
                params.push(userData.username);
            }

            if (userData.email !== undefined) {
                updateFields.push('email = ?');
                params.push(userData.email);
            }

            if (userData.passwordHash !== undefined) {
                updateFields.push('password_hash = ?');
                params.push(userData.passwordHash);
            }

            if (userData.role !== undefined) {
                updateFields.push('role = ?');
                params.push(userData.role);
            }

            if (userData.isActive !== undefined) {
                updateFields.push('is_active = ?');
                params.push(userData.isActive ? 1 : 0);
            }

            if (updateFields.length === 0) {
                return { success: false, error: 'No fields to update' };
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            params.push(userId);

            const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
            const result = await this.runQuery(sql, params);

            logInfo('User updated successfully', { userId });
            return { success: true, affectedRows: result.changes };
        } catch (error) {
            logError('Failed to update user', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deletes user
     * @param {number} userId - User ID
     * @returns {Promise} - Delete result
     */
    async deleteUser(userId) {
        try {
            const sql = 'DELETE FROM users WHERE id = ?';
            const result = await this.runQuery(sql, [userId]);

            logInfo('User deleted successfully', { userId });
            return { success: true, affectedRows: result.changes };
        } catch (error) {
            logError('Failed to delete user', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Closes database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            logInfo('Database connection closed');
        }
    }
}

module.exports = DatabaseManager;
