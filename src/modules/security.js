const { logSecurity } = require('../utils/logger');
const Validators = require('../utils/validators');
const config = require('../config/app');

/**
 * Security manager for command validation and sanitization
 */
class SecurityManager {
    // Whitelist of allowed commands with configuration
    static ALLOWED_COMMANDS = {
        ping: {
            command: 'ping',
            args: ['-c', config.commands.ping.count.toString()],
            maxArgs: 2,
            validateHostname: true,
            timeout: config.commands.ping.timeout
        },
        traceroute: {
            command: 'traceroute',
            args: ['-m', config.commands.traceroute.maxHops.toString()],
            maxArgs: 1,
            validateHostname: true,
            timeout: config.commands.traceroute.timeout
        },
        nslookup: {
            command: 'nslookup',
            args: [],
            maxArgs: 1,
            validateHostname: true,
            timeout: config.commands.nslookup.timeout
        },
        netstat: {
            command: 'netstat',
            args: ['-an'],
            maxArgs: 3,
            validateHostname: false,
            timeout: config.security.commandTimeout
        },
        whois: {
            command: 'whois',
            args: [],
            maxArgs: 1,
            validateDomain: true,
            timeout: config.commands.whois.timeout
        }
    };

    /**
     * Validates a command
     * @param {string} command - Command to validate
     * @returns {boolean} - Whether the command is allowed
     */
    static validateCommand(command) {
        const validation = Validators.validateCommand(command);
        if (!validation.isValid) {
            logSecurity('Command validation failed', { command, error: validation.error });
            return false;
        }

        const normalizedCommand = command.toLowerCase().trim();
        const isAllowed = Object.keys(this.ALLOWED_COMMANDS).includes(normalizedCommand);
        
        if (!isAllowed) {
            logSecurity('Command not in whitelist', { command: normalizedCommand });
        }
        
        return isAllowed;
    }

    /**
     * Validates command arguments
     * @param {string} command - Command
     * @param {Array} args - Arguments
     * @returns {boolean} - Whether arguments are valid
     */
    static validateArgs(command, args = []) {
        const normalizedCommand = command.toLowerCase().trim();
        const commandConfig = this.ALLOWED_COMMANDS[normalizedCommand];

        if (!commandConfig) {
            logSecurity('Command not found in configuration', { command: normalizedCommand });
            return false;
        }

        // Validate arguments array
        const argsValidation = Validators.validateArgs(args);
        if (!argsValidation.isValid) {
            logSecurity('Arguments validation failed', { command, args, error: argsValidation.error });
            return false;
        }

        // Check argument count
        if (args.length > commandConfig.maxArgs) {
            logSecurity('Too many arguments', { 
                command, 
                args, 
                maxArgs: commandConfig.maxArgs,
                actualCount: args.length 
            });
            return false;
        }

        // Validate each argument
        for (const arg of args) {
            if (!this.sanitizeInput(arg)) {
                logSecurity('Invalid argument', { command, arg });
                return false;
            }
        }

        return true;
    }

    /**
     * Sanitizes input string
     * @param {string} input - Input to sanitize
     * @returns {string} - Sanitized input
     */
    static sanitizeInput(input) {
        return Validators.sanitizeInput(input);
    }

    /**
     * Validates hostname
     * @param {string} hostname - Hostname to validate
     * @returns {boolean} - Whether hostname is valid
     */
    static validateHostname(hostname) {
        const validation = Validators.validateHostname(hostname);
        return validation.isValid;
    }

    /**
     * Validates domain
     * @param {string} domain - Domain to validate
     * @returns {boolean} - Whether domain is valid
     */
    static validateDomain(domain) {
        const validation = Validators.validateDomain(domain);
        return validation.isValid;
    }

    /**
     * Validates IP address
     * @param {string} ip - IP address to validate
     * @returns {boolean} - Whether IP address is valid
     */
    static validateIP(ip) {
        const validation = Validators.validateIP(ip);
        return validation.isValid;
    }

    /**
     * Checks if a command is safe to execute
     * @param {string} command - Command to check
     * @param {Array} args - Command arguments
     * @returns {boolean} - Whether command is safe
     */
    static isCommandSafe(command, args = []) {
        const normalizedCommand = command.toLowerCase().trim();
        
        // Check if command is allowed
        if (!this.validateCommand(normalizedCommand)) {
            logSecurity('Command not allowed', { command: normalizedCommand });
            return false;
        }

        // Check arguments
        if (!this.validateArgs(normalizedCommand, args)) {
            logSecurity('Invalid arguments', { command: normalizedCommand, args });
            return false;
        }

        // Additional checks for specific commands
        const commandConfig = this.ALLOWED_COMMANDS[normalizedCommand];
        
        if (commandConfig.validateHostname) {
            for (const arg of args) {
                if (!this.validateHostname(arg) && !this.validateIP(arg)) {
                    logSecurity('Invalid hostname in command', { 
                        command: normalizedCommand, 
                        arg 
                    });
                    return false;
                }
            }
        }

        if (commandConfig.validateDomain) {
            for (const arg of args) {
                if (!this.validateDomain(arg)) {
                    logSecurity('Invalid domain in command', { 
                        command: normalizedCommand, 
                        arg 
                    });
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Creates a safe command for execution
     * @param {string} command - Command
     * @param {Array} args - Arguments
     * @returns {Object} - Safe command object
     */
    static createSafeCommand(command, args = []) {
        const normalizedCommand = command.toLowerCase().trim();
        const commandConfig = this.ALLOWED_COMMANDS[normalizedCommand];

        if (!commandConfig) {
            throw new Error('Command not allowed');
        }

        // Sanitize arguments
        const sanitizedArgs = args.map(arg => this.sanitizeInput(arg));

        // Combine base command arguments with user arguments
        const finalArgs = [...commandConfig.args, ...sanitizedArgs];

        return {
            command: commandConfig.command,
            args: finalArgs,
            fullCommand: `${commandConfig.command} ${finalArgs.join(' ')}`,
            timeout: commandConfig.timeout
        };
    }

    /**
     * Validates network target (hostname or IP)
     * @param {string} target - Target to validate
     * @returns {boolean} - Whether target is valid
     */
    static validateNetworkTarget(target) {
        return this.validateHostname(target) || this.validateIP(target);
    }

    /**
     * Validates request body for security
     * @param {Object} body - Request body
     * @returns {Object} - Validation result
     */
    static validateRequestBody(body) {
        const errors = [];

        // Check for malicious patterns
        const maliciousPatterns = [
            /[;&|`$(){}[\]<>]/,
            /(?:rm\s+-rf|del\s+\/s|format\s+c:)/i,
            /(?:eval\(|setTimeout\(|setInterval\()/i
        ];

        const checkValue = (value, path = '') => {
            if (typeof value === 'string') {
                for (const pattern of maliciousPatterns) {
                    if (pattern.test(value)) {
                        errors.push(`Malicious pattern detected in ${path || 'body'}: ${value}`);
                    }
                }
            } else if (typeof value === 'object' && value !== null) {
                for (const [key, val] of Object.entries(value)) {
                    checkValue(val, path ? `${path}.${key}` : key);
                }
            }
        };

        checkValue(body);

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Gets command configuration
     * @param {string} command - Command name
     * @returns {Object|null} - Command configuration
     */
    static getCommandConfig(command) {
        const normalizedCommand = command.toLowerCase().trim();
        return this.ALLOWED_COMMANDS[normalizedCommand] || null;
    }

    /**
     * Gets all allowed commands
     * @returns {Array} - Array of allowed command names
     */
    static getAllowedCommands() {
        return Object.keys(this.ALLOWED_COMMANDS);
    }

    /**
     * Checks if command requires admin privileges
     * @param {string} command - Command to check
     * @returns {boolean} - Whether command requires admin
     */
    static requiresAdmin(command) {
        const normalizedCommand = command.toLowerCase().trim();
        const adminCommands = ['netstat', 'system'];
        return adminCommands.includes(normalizedCommand);
    }
}

module.exports = SecurityManager; 