const MOTDProcessor = require('../modules/ai/MOTDProcessor');
const LegalProcessor = require('../modules/ai/LegalProcessor');
const CommandProcessor = require('../modules/ai/CommandProcessor');

/**
 * Фабрика для создания AI процессоров
 */
class AIProcessorFactory {
    /**
     * Создает процессор для MOTD
     * @returns {MOTDProcessor} - Процессор MOTD
     */
    static createMOTDProcessor() {
        return new MOTDProcessor();
    }

    /**
     * Создает процессор для юридических запросов
     * @returns {LegalProcessor} - Процессор юридических запросов
     */
    static createLegalProcessor() {
        return new LegalProcessor();
    }

    /**
     * Создает процессор для команд
     * @returns {CommandProcessor} - Процессор команд
     */
    static createCommandProcessor() {
        return new CommandProcessor();
    }

    /**
     * Создает процессор по типу
     * @param {string} type - Тип процессора
     * @returns {Object} - Процессор
     */
    static createProcessor(type) {
        switch (type) {
            case 'motd':
                return this.createMOTDProcessor();
            case 'legal':
                return this.createLegalProcessor();
            case 'command':
                return this.createCommandProcessor();
            default:
                throw new Error(`Unknown processor type: ${type}`);
        }
    }

    /**
     * Получает список доступных типов процессоров
     * @returns {Array<string>} - Список типов
     */
    static getAvailableTypes() {
        return ['motd', 'legal', 'command'];
    }
}

module.exports = AIProcessorFactory; 