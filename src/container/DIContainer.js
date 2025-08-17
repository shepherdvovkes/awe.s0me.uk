const databaseManager = require('../modules/database');
const cacheManager = require('../modules/cache');
const AIProcessorFactory = require('../factories/AIProcessorFactory');
const RepositoryFactory = require('../factories/RepositoryFactory');
const AIRequestContext = require('../context/AIRequestContext');

/**
 * Контейнер внедрения зависимостей
 */
class DIContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
    }

    /**
     * Регистрирует сервис
     * @param {string} name - Имя сервиса
     * @param {Function} factory - Фабричная функция
     * @param {boolean} singleton - Является ли синглтоном
     */
    register(name, factory, singleton = true) {
        this.services.set(name, { factory, singleton });
    }

    /**
     * Получает сервис
     * @param {string} name - Имя сервиса
     * @returns {Object} - Экземпляр сервиса
     */
    get(name) {
        const service = this.services.get(name);
        
        if (!service) {
            throw new Error(`Service '${name}' not registered`);
        }

        if (service.singleton) {
            if (!this.singletons.has(name)) {
                this.singletons.set(name, service.factory(this));
            }
            return this.singletons.get(name);
        } else {
            return service.factory(this);
        }
    }

    /**
     * Инициализирует контейнер с базовыми сервисами
     */
    initialize() {
        // Регистрируем базовые сервисы
        this.register('databaseManager', () => databaseManager, true);
        this.register('cacheManager', () => cacheManager, true);

        // Регистрируем репозитории
        this.register('userRepository', (container) => {
            const db = container.get('databaseManager');
            return RepositoryFactory.createUserRepository(db);
        }, true);

        this.register('motdRepository', (container) => {
            const db = container.get('databaseManager');
            return RepositoryFactory.createMOTDRepository(db);
        }, true);

        this.register('openaiRequestRepository', (container) => {
            const db = container.get('databaseManager');
            return RepositoryFactory.createOpenAIRequestRepository(db);
        }, true);

        // Регистрируем AI процессоры
        this.register('motdProcessor', (container) => {
            return AIProcessorFactory.createMOTDProcessor();
        }, true);

        this.register('legalProcessor', (container) => {
            return AIProcessorFactory.createLegalProcessor();
        }, true);

        this.register('commandProcessor', (container) => {
            return AIProcessorFactory.createCommandProcessor();
        }, true);

        // Регистрируем контекст стратегий
        this.register('aiRequestContext', (container) => {
            return new AIRequestContext();
        }, true);

        // Регистрируем сервисы
        this.register('aiService', (container) => {
            const AIService = require('../services/aiService');
            return new AIService(
                container.get('motdProcessor'),
                container.get('legalProcessor'),
                container.get('commandProcessor'),
                container.get('motdRepository'),
                container.get('openaiRequestRepository'),
                container.get('cacheManager'),
                container.get('aiRequestContext')
            );
        }, true);
    }

    /**
     * Получает все зарегистрированные сервисы
     * @returns {Array<string>} - Список имен сервисов
     */
    getRegisteredServices() {
        return Array.from(this.services.keys());
    }

    /**
     * Проверяет, зарегистрирован ли сервис
     * @param {string} name - Имя сервиса
     * @returns {boolean} - Зарегистрирован ли сервис
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Очищает контейнер
     */
    clear() {
        this.services.clear();
        this.singletons.clear();
    }
}

// Создаем единственный экземпляр контейнера
const container = new DIContainer();

module.exports = container; 