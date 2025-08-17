const MOTDStrategy = require('../strategies/MOTDStrategy');
const LegalStrategy = require('../strategies/LegalStrategy');
const CommandStrategy = require('../strategies/CommandStrategy');

/**
 * Контекст для использования стратегий AI запросов
 */
class AIRequestContext {
    constructor() {
        this.strategies = new Map();
        this.defaultStrategy = null;
        this.initializeStrategies();
    }

    /**
     * Инициализирует стратегии
     */
    initializeStrategies() {
        this.strategies.set('motd', new MOTDStrategy());
        this.strategies.set('legal', new LegalStrategy());
        this.strategies.set('command', new CommandStrategy());
        
        // Устанавливаем команду как стратегию по умолчанию
        this.defaultStrategy = this.strategies.get('command');
    }

    /**
     * Устанавливает стратегию
     * @param {string} type - Тип стратегии
     * @param {Object} strategy - Стратегия
     */
    setStrategy(type, strategy) {
        this.strategies.set(type, strategy);
    }

    /**
     * Получает стратегию по типу
     * @param {string} type - Тип стратегии
     * @returns {Object} - Стратегия
     */
    getStrategy(type) {
        return this.strategies.get(type) || this.defaultStrategy;
    }

    /**
     * Обрабатывает запрос с использованием соответствующей стратегии
     * @param {string} type - Тип запроса
     * @param {string} query - Запрос
     * @param {Object} options - Опции
     * @returns {Promise<Object>} - Результат обработки
     */
    async processRequest(type, query, options = {}) {
        const strategy = this.getStrategy(type);
        
        if (!strategy) {
            throw new Error(`No strategy found for type: ${type}`);
        }

        return await strategy.process(query, options);
    }

    /**
     * Проверяет доступность стратегии
     * @param {string} type - Тип стратегии
     * @returns {Promise<boolean>} - Доступна ли стратегия
     */
    async isStrategyAvailable(type) {
        const strategy = this.getStrategy(type);
        
        if (!strategy) {
            return false;
        }

        return await strategy.isAvailable();
    }

    /**
     * Получает все доступные типы стратегий
     * @returns {Array<string>} - Список типов
     */
    getAvailableTypes() {
        return Array.from(this.strategies.keys());
    }

    /**
     * Получает стратегию MOTD
     * @returns {Object} - Стратегия MOTD
     */
    getMOTDStrategy() {
        return this.strategies.get('motd');
    }

    /**
     * Получает стратегию юридических запросов
     * @returns {Object} - Стратегия юридических запросов
     */
    getLegalStrategy() {
        return this.strategies.get('legal');
    }

    /**
     * Получает стратегию команд
     * @returns {Object} - Стратегия команд
     */
    getCommandStrategy() {
        return this.strategies.get('command');
    }
}

module.exports = AIRequestContext; 