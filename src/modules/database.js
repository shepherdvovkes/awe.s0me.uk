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
}

// Создаем единственный экземпляр
const databaseManager = new DatabaseManager();

module.exports = databaseManager;
