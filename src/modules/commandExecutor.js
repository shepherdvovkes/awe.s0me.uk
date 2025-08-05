const { exec } = require('child_process');
const SecurityManager = require('./security');
const { logCommand, logError } = require('../utils/logger');
const config = require('../config/app');

/**
 * Безопасный исполнитель команд
 */
class CommandExecutor {
    /**
     * Выполняет команду с проверками безопасности
     * @param {string} command - Команда для выполнения
     * @param {Array} args - Аргументы команды
     * @returns {Promise<string>} - Результат выполнения команды
     */
    static async execute(command, args = []) {
        const startTime = Date.now();

        try {
            // Проверяем безопасность команды
            if (!SecurityManager.isCommandSafe(command, args)) {
                throw new Error('Command not allowed or invalid arguments');
            }

            // Создаем безопасную команду
            const safeCommand = SecurityManager.createSafeCommand(command, args);

            // Выполняем команду
            const result = await this._executeCommand(safeCommand.fullCommand);

            const duration = Date.now() - startTime;

            // Логируем успешное выполнение
            logCommand(command, args, result, duration);

            return result;

        } catch (error) {
            const duration = Date.now() - startTime;

            // Логируем ошибку
            logError('Command execution failed', error);

            throw new Error(`Command execution failed: ${error.message}`);
        }
    }

    /**
     * Внутренний метод для выполнения команды
     * @param {string} fullCommand - Полная команда для выполнения
     * @returns {Promise<string>} - Результат выполнения
     */
    static _executeCommand(fullCommand) {
        return new Promise((resolve, reject) => {
            exec(fullCommand, {
                timeout: config.security.commandTimeout,
                maxBuffer: config.security.maxBufferSize
            }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Command failed: ${error.message}`));
                } else {
                    // Возвращаем stdout или stderr
                    resolve(stdout || stderr || '');
                }
            });
        });
    }

    /**
     * Выполняет ping команду
     * @param {string} hostname - Hostname для ping
     * @returns {Promise<string>} - Результат ping
     */
    static async ping(hostname) {
        if (!SecurityManager.validateHostname(hostname) && !SecurityManager.validateIP(hostname)) {
            throw new Error('Invalid hostname or IP address');
        }

        return await this.execute('ping', [hostname]);
    }

    /**
     * Выполняет traceroute команду
     * @param {string} hostname - Hostname для traceroute
     * @returns {Promise<string>} - Результат traceroute
     */
    static async traceroute(hostname) {
        if (!SecurityManager.validateHostname(hostname) && !SecurityManager.validateIP(hostname)) {
            throw new Error('Invalid hostname or IP address');
        }

        return await this.execute('traceroute', [hostname]);
    }

    /**
     * Выполняет nslookup команду
     * @param {string} hostname - Hostname для nslookup
     * @returns {Promise<string>} - Результат nslookup
     */
    static async nslookup(hostname) {
        if (!SecurityManager.validateHostname(hostname) && !SecurityManager.validateIP(hostname)) {
            throw new Error('Invalid hostname or IP address');
        }

        return await this.execute('nslookup', [hostname]);
    }

    /**
     * Выполняет netstat команду
     * @param {Array} args - Дополнительные аргументы
     * @returns {Promise<string>} - Результат netstat
     */
    static async netstat(args = []) {
        return await this.execute('netstat', args);
    }

    /**
     * Выполняет whois команду
     * @param {string} domain - Domain для whois
     * @returns {Promise<string>} - Результат whois
     */
    static async whois(domain) {
        if (!SecurityManager.validateDomain(domain)) {
            throw new Error('Invalid domain');
        }

        return await this.execute('whois', [domain]);
    }

    /**
     * Получает информацию о системе
     * @returns {Object} - Информация о системе
     */
    static getSystemInfo() {
        return {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            pid: process.pid
        };
    }

    /**
     * Проверяет доступность команды в системе
     * @param {string} command - Команда для проверки
     * @returns {Promise<boolean>} - Доступна ли команда
     */
    static async isCommandAvailable(command) {
        try {
            await this._executeCommand(`which ${command}`);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Получает список доступных команд
     * @returns {Promise<Array>} - Список доступных команд
     */
    static async getAvailableCommands() {
        const commands = Object.keys(SecurityManager.ALLOWED_COMMANDS);
        const availableCommands = [];

        for (const command of commands) {
            const isAvailable = await this.isCommandAvailable(command);
            if (isAvailable) {
                availableCommands.push(command);
            }
        }

        return availableCommands;
    }
}

module.exports = CommandExecutor;
