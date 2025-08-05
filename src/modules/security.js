const { logSecurity } = require('../utils/logger');
const config = require('../config/app');

/**
 * Модуль безопасности для валидации команд и входных данных
 */
class SecurityManager {
    // Белый список разрешенных команд
    static ALLOWED_COMMANDS = {
        ping: {
            command: 'ping',
            args: ['-c', '4'],
            maxArgs: 2,
            validateHostname: true
        },
        traceroute: {
            command: 'traceroute',
            args: [],
            maxArgs: 1,
            validateHostname: true
        },
        nslookup: {
            command: 'nslookup',
            args: [],
            maxArgs: 1,
            validateHostname: true
        },
        netstat: {
            command: 'netstat',
            args: ['-an'],
            maxArgs: 3,
            validateHostname: false
        },
        whois: {
            command: 'whois',
            args: [],
            maxArgs: 1,
            validateDomain: true
        }
    };

    /**
     * Валидирует команду
     * @param {string} command - Команда для валидации
     * @returns {boolean} - Разрешена ли команда
     */
    static validateCommand(command) {
        if (!command || typeof command !== 'string') {
            return false;
        }

        const normalizedCommand = command.toLowerCase().trim();
        return Object.keys(this.ALLOWED_COMMANDS).includes(normalizedCommand);
    }

    /**
     * Валидирует аргументы команды
     * @param {string} command - Команда
     * @param {Array} args - Аргументы
     * @returns {boolean} - Валидны ли аргументы
     */
    static validateArgs(command, args = []) {
        const normalizedCommand = command.toLowerCase().trim();
        const commandConfig = this.ALLOWED_COMMANDS[normalizedCommand];

        if (!commandConfig) {
            return false;
        }

        // Проверяем количество аргументов
        if (args.length > commandConfig.maxArgs) {
            logSecurity('Too many arguments', { command, args, maxArgs: commandConfig.maxArgs });
            return false;
        }

        // Валидируем каждый аргумент
        for (const arg of args) {
            if (!this.sanitizeInput(arg)) {
                logSecurity('Invalid argument', { command, arg });
                return false;
            }
        }

        return true;
    }

    /**
     * Санитизирует входные данные
     * @param {string} input - Входные данные
     * @returns {string} - Санитизированные данные
     */
    static sanitizeInput(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // Удаляем потенциально опасные символы
        return input
            .replace(/[;&|`$(){}[\]<>]/g, '') // Удаляем shell метасимволы
            .replace(/\s+/g, ' ') // Нормализуем пробелы
            .trim();
    }

    /**
     * Валидирует hostname
     * @param {string} hostname - Hostname для валидации
     * @returns {boolean} - Валиден ли hostname
     */
    static validateHostname(hostname) {
        if (!hostname || typeof hostname !== 'string') {
            return false;
        }

        const sanitized = this.sanitizeInput(hostname);
        
        // Проверяем формат hostname
        const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!hostnameRegex.test(sanitized)) {
            logSecurity('Invalid hostname', { hostname: sanitized });
            return false;
        }

        // Проверяем длину
        if (sanitized.length > 253) {
            logSecurity('Hostname too long', { hostname: sanitized, length: sanitized.length });
            return false;
        }

        return true;
    }

    /**
     * Валидирует domain
     * @param {string} domain - Domain для валидации
     * @returns {boolean} - Валиден ли domain
     */
    static validateDomain(domain) {
        if (!domain || typeof domain !== 'string') {
            return false;
        }

        const sanitized = this.sanitizeInput(domain);
        
        // Проверяем формат domain
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
        
        if (!domainRegex.test(sanitized)) {
            logSecurity('Invalid domain', { domain: sanitized });
            return false;
        }

        // Проверяем длину
        if (sanitized.length > 253) {
            logSecurity('Domain too long', { domain: sanitized, length: sanitized.length });
            return false;
        }

        return true;
    }

    /**
     * Валидирует IP адрес
     * @param {string} ip - IP адрес для валидации
     * @returns {boolean} - Валиден ли IP адрес
     */
    static validateIP(ip) {
        if (!ip || typeof ip !== 'string') {
            return false;
        }

        const sanitized = this.sanitizeInput(ip);
        
        // Проверяем IPv4
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        
        if (ipv4Regex.test(sanitized)) {
            return true;
        }

        // Проверяем IPv6 (упрощенная проверка)
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        
        if (ipv6Regex.test(sanitized)) {
            return true;
        }

        logSecurity('Invalid IP address', { ip: sanitized });
        return false;
    }

    /**
     * Проверяет, не является ли команда потенциально опасной
     * @param {string} command - Команда для проверки
     * @param {Array} args - Аргументы команды
     * @returns {boolean} - Безопасна ли команда
     */
    static isCommandSafe(command, args = []) {
        const normalizedCommand = command.toLowerCase().trim();
        
        // Проверяем, разрешена ли команда
        if (!this.validateCommand(normalizedCommand)) {
            logSecurity('Command not allowed', { command: normalizedCommand });
            return false;
        }

        // Проверяем аргументы
        if (!this.validateArgs(normalizedCommand, args)) {
            logSecurity('Invalid arguments', { command: normalizedCommand, args });
            return false;
        }

        // Дополнительные проверки для специфических команд
        const commandConfig = this.ALLOWED_COMMANDS[normalizedCommand];
        
        if (commandConfig.validateHostname) {
            for (const arg of args) {
                if (!this.validateHostname(arg) && !this.validateIP(arg)) {
                    logSecurity('Invalid hostname in command', { command: normalizedCommand, arg });
                    return false;
                }
            }
        }

        if (commandConfig.validateDomain) {
            for (const arg of args) {
                if (!this.validateDomain(arg)) {
                    logSecurity('Invalid domain in command', { command: normalizedCommand, arg });
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Создает безопасную команду для выполнения
     * @param {string} command - Команда
     * @param {Array} args - Аргументы
     * @returns {Object} - Объект с командой и аргументами
     */
    static createSafeCommand(command, args = []) {
        const normalizedCommand = command.toLowerCase().trim();
        const commandConfig = this.ALLOWED_COMMANDS[normalizedCommand];

        if (!commandConfig) {
            throw new Error('Command not allowed');
        }

        // Санитизируем аргументы
        const sanitizedArgs = args.map(arg => this.sanitizeInput(arg));

        // Объединяем базовые аргументы команды с пользовательскими
        const finalArgs = [...commandConfig.args, ...sanitizedArgs];

        return {
            command: commandConfig.command,
            args: finalArgs,
            fullCommand: `${commandConfig.command} ${finalArgs.join(' ')}`
        };
    }
}

module.exports = SecurityManager; 