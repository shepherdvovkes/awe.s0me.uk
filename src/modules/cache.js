const NodeCache = require('node-cache');
const { logInfo, logWarning } = require('../utils/logger');
const config = require('../config/app');

/**
 * Менеджер кэширования
 */
class CacheManager {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: config.cache.ttl,
            checkperiod: config.cache.checkPeriod,
            useClones: false,
            deleteOnExpire: true
        });

        // Слушатели событий кэша
        this.cache.on('expired', (key, value) => {
            logInfo('Cache entry expired', { key });
        });

        this.cache.on('flush', () => {
            logInfo('Cache flushed');
        });

        this.cache.on('del', (key, value) => {
            logInfo('Cache entry deleted', { key });
        });
    }

    /**
     * Получает значение из кэша или устанавливает его
     * @param {string} key - Ключ кэша
     * @param {Function} fetchFunction - Функция для получения данных
     * @param {number} ttl - Время жизни в секундах
     * @returns {Promise<any>} - Значение из кэша или новое значение
     */
    async getOrSet(key, fetchFunction, ttl = config.cache.ttl) {
        try {
            const cached = this.cache.get(key);
            if (cached !== undefined) {
                logInfo('Cache hit', { key });
                return cached;
            }

            logInfo('Cache miss, fetching data', { key });
            const data = await fetchFunction();

            if (data !== undefined && data !== null) {
                this.cache.set(key, data, ttl);
                logInfo('Data cached', { key, ttl });
            }

            return data;
        } catch (error) {
            logWarning('Cache operation failed', { key, error: error.message });
            throw error;
        }
    }

    /**
     * Получает значение из кэша
     * @param {string} key - Ключ кэша
     * @returns {any} - Значение из кэша или undefined
     */
    get(key) {
        return this.cache.get(key);
    }

    /**
     * Устанавливает значение в кэш
     * @param {string} key - Ключ кэша
     * @param {any} value - Значение для кэширования
     * @param {number} ttl - Время жизни в секундах
     */
    set(key, value, ttl = config.cache.ttl) {
        this.cache.set(key, value, ttl);
        logInfo('Value cached', { key, ttl });
    }

    /**
     * Удаляет значение из кэша
     * @param {string} key - Ключ кэша
     */
    delete(key) {
        this.cache.del(key);
        logInfo('Cache entry deleted', { key });
    }

    /**
     * Очищает весь кэш
     */
    flush() {
        this.cache.flushAll();
        logInfo('Cache flushed');
    }

    /**
     * Получает статистику кэша
     * @returns {Object} - Статистика кэша
     */
    getStats() {
        return this.cache.getStats();
    }

    /**
     * Получает все ключи в кэше
     * @returns {Array} - Массив ключей
     */
    getKeys() {
        return this.cache.keys();
    }

    /**
     * Проверяет, существует ли ключ в кэше
     * @param {string} key - Ключ для проверки
     * @returns {boolean} - Существует ли ключ
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Получает время жизни ключа
     * @param {string} key - Ключ
     * @returns {number} - Время жизни в секундах
     */
    getTtl(key) {
        return this.cache.getTtl(key);
    }

    /**
     * Устанавливает время жизни для ключа
     * @param {string} key - Ключ
     * @param {number} ttl - Время жизни в секундах
     */
    setTtl(key, ttl) {
        this.cache.ttl(key, ttl);
    }

    /**
     * Создает ключ кэша для команды
     * @param {string} command - Команда
     * @param {Array} args - Аргументы
     * @returns {string} - Ключ кэша
     */
    static createCommandKey(command, args = []) {
        return `cmd_${command}_${args.join('_')}`;
    }

    /**
     * Создает ключ кэша для MOTD
     * @param {string} language - Язык
     * @returns {string} - Ключ кэша
     */
    static createMOTDKey(language = 'en') {
        return `motd_${language}_${Math.floor(Date.now() / (5 * 60 * 1000))}`; // 5 минут
    }

    /**
     * Создает ключ кэша для AI запроса
     * @param {string} prompt - Промпт
     * @param {string} type - Тип запроса
     * @returns {string} - Ключ кэша
     */
    static createAIKey(prompt, type = 'general') {
        const hash = require('crypto').createHash('md5').update(prompt).digest('hex');
        return `ai_${type}_${hash}`;
    }

    /**
     * Создает ключ кэша для сетевого запроса
     * @param {string} hostname - Hostname
     * @param {string} command - Команда
     * @returns {string} - Ключ кэша
     */
    static createNetworkKey(hostname, command) {
        const hash = require('crypto').createHash('md5').update(hostname).digest('hex');
        return `network_${command}_${hash}`;
    }
}

// Создаем единственный экземпляр
const cacheManager = new CacheManager();

module.exports = cacheManager;
