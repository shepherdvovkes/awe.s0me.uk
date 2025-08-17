const sqlite3 = require('sqlite3').verbose();
const { logError, logInfo } = require('../utils/logger');
const config = require('../config/app');

/**
 * Менеджер базы данных
 */
class DatabaseManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Инициализирует подключение к базе данных
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(config.database.path, (err) => {
                if (err) {
                    logError('Database connection failed', err);
                    reject(err);
                } else {
                    logInfo('Connected to SQLite database', { path: config.database.path });
                    this.isInitialized = true;
                    this.initTables()
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

    /**
     * Инициализирует таблицы базы данных
     */
    async initTables() {
        const tables = [
            {
                name: 'motd_history',
                query: `CREATE TABLE IF NOT EXISTS motd_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message TEXT NOT NULL,
                    prompt TEXT NOT NULL,
                    language TEXT DEFAULT 'en',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'openai_requests',
                query: `CREATE TABLE IF NOT EXISTS openai_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    request_type TEXT NOT NULL,
                    prompt TEXT NOT NULL,
                    response TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'command_logs',
                query: `CREATE TABLE IF NOT EXISTS command_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    command TEXT NOT NULL,
                    args TEXT,
                    result TEXT,
                    duration INTEGER,
                    success BOOLEAN DEFAULT 1,
                    error_message TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'security_events',
                query: `CREATE TABLE IF NOT EXISTS security_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    details TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'zakon_online_searches',
                query: `CREATE TABLE IF NOT EXISTS zakon_online_searches (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query TEXT NOT NULL,
                    total_count INTEGER DEFAULT 0,
                    page INTEGER DEFAULT 1,
                    page_size INTEGER DEFAULT 10,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
            },
            {
                name: 'zakon_online_cases',
                query: `CREATE TABLE IF NOT EXISTS zakon_online_cases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    search_id INTEGER NOT NULL,
                    case_id TEXT NOT NULL,
                    court_name TEXT,
                    judgment_form TEXT,
                    justice_kind TEXT,
                    case_date TEXT,
                    case_number TEXT,
                    summary TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (search_id) REFERENCES zakon_online_searches(id) ON DELETE CASCADE
                )`
            },
            {
                name: 'zakon_online_full_texts',
                query: `CREATE TABLE IF NOT EXISTS zakon_online_full_texts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    case_id TEXT NOT NULL,
                    full_text TEXT,
                    highlights TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
            }
        ];

        for (const table of tables) {
            try {
                await this.runQuery(table.query);
                logInfo(`Table initialized: ${table.name}`);
            } catch (error) {
                logError(`Failed to initialize table: ${table.name}`, error);
                throw error;
            }
        }
    }

    /**
     * Выполняет SQL запрос
     * @param {string} sql - SQL запрос
     * @param {Array} params - Параметры запроса
     * @returns {Promise} - Результат запроса
     */
    async runQuery(sql, params = []) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    logError('Database query failed', { sql, params, error: err });
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }

    /**
     * Выполняет SQL запрос с возвратом всех строк
     * @param {string} sql - SQL запрос
     * @param {Array} params - Параметры запроса
     * @returns {Promise<Array>} - Массив результатов
     */
    async getAll(sql, params = []) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    logError('Database query failed', { sql, params, error: err });
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Выполняет SQL запрос с возвратом одной строки
     * @param {string} sql - SQL запрос
     * @param {Array} params - Параметры запроса
     * @returns {Promise<Object>} - Результат запроса
     */
    async get(sql, params = []) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    logError('Database query failed', { sql, params, error: err });
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Сохраняет MOTD в базу данных
     * @param {string} message - Сообщение MOTD
     * @param {string} prompt - Промпт для AI
     * @param {string} language - Язык
     * @returns {Promise} - Результат сохранения
     */
    async saveMOTD(message, prompt, language = 'en') {
        const sql = 'INSERT INTO motd_history (message, prompt, language) VALUES (?, ?, ?)';
        return await this.runQuery(sql, [message, prompt, language]);
    }

    /**
     * Получает историю MOTD
     * @param {number} limit - Количество записей
     * @returns {Promise<Array>} - История MOTD
     */
    async getMOTDHistory(limit = 20) {
        const sql = 'SELECT message, language, created_at FROM motd_history ORDER BY created_at DESC LIMIT ?';
        return await this.getAll(sql, [limit]);
    }

    /**
     * Сохраняет запрос к OpenAI
     * @param {string} requestType - Тип запроса
     * @param {string} prompt - Промпт
     * @param {string} response - Ответ
     * @returns {Promise} - Результат сохранения
     */
    async saveOpenAIRequest(requestType, prompt, response) {
        const sql = 'INSERT INTO openai_requests (request_type, prompt, response) VALUES (?, ?, ?)';
        return await this.runQuery(sql, [requestType, prompt, response]);
    }

    /**
     * Получает историю запросов OpenAI
     * @param {number} limit - Количество записей
     * @returns {Promise<Array>} - История запросов
     */
    async getOpenAIHistory(limit = 20) {
        const sql = 'SELECT request_type, prompt, response, created_at FROM openai_requests ORDER BY created_at DESC LIMIT ?';
        return await this.getAll(sql, [limit]);
    }

    /**
     * Ищет существующий ответ на запрос
     * @param {string} prompt - Промпт для поиска
     * @param {string} requestType - Тип запроса (опционально)
     * @returns {Promise<Object|null>} - Найденный ответ или null
     */
    async findExistingResponse(prompt, requestType = null) {
        let sql, params;
        
        if (requestType) {
            sql = 'SELECT request_type, prompt, response, created_at FROM openai_requests WHERE prompt = ? AND request_type = ? ORDER BY created_at DESC LIMIT 1';
            params = [prompt, requestType];
        } else {
            sql = 'SELECT request_type, prompt, response, created_at FROM openai_requests WHERE prompt = ? ORDER BY created_at DESC LIMIT 1';
            params = [prompt];
        }
        
        const result = await this.get(sql, params);
        return result;
    }

    /**
     * Сохраняет лог команды
     * @param {string} command - Команда
     * @param {Array} args - Аргументы
     * @param {string} result - Результат
     * @param {number} duration - Время выполнения
     * @param {boolean} success - Успешность выполнения
     * @param {string} errorMessage - Сообщение об ошибке
     * @returns {Promise} - Результат сохранения
     */
    async saveCommandLog(command, args, result, duration, success = true, errorMessage = null) {
        const sql = 'INSERT INTO command_logs (command, args, result, duration, success, error_message) VALUES (?, ?, ?, ?, ?, ?)';
        return await this.runQuery(sql, [
            command,
            JSON.stringify(args),
            result,
            duration,
            success ? 1 : 0,
            errorMessage
        ]);
    }

    /**
     * Сохраняет событие безопасности
     * @param {string} eventType - Тип события
     * @param {Object} details - Детали события
     * @param {string} ipAddress - IP адрес
     * @param {string} userAgent - User Agent
     * @returns {Promise} - Результат сохранения
     */
    async saveSecurityEvent(eventType, details, ipAddress = null, userAgent = null) {
        const sql = 'INSERT INTO security_events (event_type, details, ip_address, user_agent) VALUES (?, ?, ?, ?)';
        return await this.runQuery(sql, [
            eventType,
            JSON.stringify(details),
            ipAddress,
            userAgent
        ]);
    }

    /**
     * Получает статистику команд
     * @returns {Promise<Object>} - Статистика
     */
    async getCommandStats() {
        const sql = `
            SELECT 
                command,
                COUNT(*) as total_executions,
                AVG(duration) as avg_duration,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_executions,
                SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_executions
            FROM command_logs 
            GROUP BY command
            ORDER BY total_executions DESC
        `;
        return await this.getAll(sql);
    }

    /**
     * Получает последние события безопасности
     * @param {number} limit - Количество записей
     * @returns {Promise<Array>} - События безопасности
     */
    async getSecurityEvents(limit = 50) {
        const sql = 'SELECT event_type, details, ip_address, user_agent, created_at FROM security_events ORDER BY created_at DESC LIMIT ?';
        return await this.getAll(sql, [limit]);
    }

    /**
     * Закрывает соединение с базой данных
     */
    async close() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) {
                        logError('Failed to close database', err);
                        reject(err);
                    } else {
                        logInfo('Database connection closed');
                        this.isInitialized = false;
                        resolve();
                    }
                });
            });
        }
    }

    /**
     * Проверяет состояние базы данных
     * @returns {Promise<boolean>} - Работает ли база данных
     */
    async isHealthy() {
        try {
            await this.get('SELECT 1');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Получает статистику поисков "Закон Онлайн"
     * @returns {Promise<Object>} - Статистика поисков
     */
    async getZakonOnlineStats() {
        try {
            const stats = await this.get(`
                SELECT 
                    COUNT(*) as total_searches,
                    SUM(total_count) as total_cases_found,
                    AVG(total_count) as avg_cases_per_search,
                    MAX(created_at) as last_search_date
                FROM zakon_online_searches
            `);
            
            const recentSearches = await this.getAll(`
                SELECT query, total_count, created_at 
                FROM zakon_online_searches 
                ORDER BY created_at DESC 
                LIMIT 5
            `);
            
            return {
                ...stats,
                recentSearches
            };
        } catch (error) {
            logError('Error getting Zakon Online stats', error);
            throw error;
        }
    }

    /**
     * Получает топ поисковых запросов
     * @param {number} limit - Количество записей
     * @returns {Promise<Array>} - Топ запросов
     */
    async getTopSearches(limit = 10) {
        try {
            const sql = `
                SELECT 
                    query,
                    COUNT(*) as search_count,
                    AVG(total_count) as avg_results,
                    MAX(created_at) as last_used
                FROM zakon_online_searches
                GROUP BY query
                ORDER BY search_count DESC, avg_results DESC
                LIMIT ?
            `;
            
            return await this.getAll(sql, [limit]);
        } catch (error) {
            logError('Error getting top searches', error);
            throw error;
        }
    }

    /**
     * Очищает старые записи поисков
     * @param {number} daysOld - Количество дней
     * @returns {Promise<number>} - Количество удаленных записей
     */
    async cleanupOldSearches(daysOld = 30) {
        try {
            const result = await this.runQuery(`
                DELETE FROM zakon_online_searches 
                WHERE created_at < datetime('now', '-${daysOld} days')
            `);
            
            logInfo(`Cleaned up old searches older than ${daysOld} days`, { 
                deletedCount: result.changes 
            });
            
            return result.changes;
        } catch (error) {
            logError('Error cleaning up old searches', error);
            throw error;
        }
    }
}

// Создаем единственный экземпляр
const databaseManager = new DatabaseManager();

module.exports = databaseManager;
