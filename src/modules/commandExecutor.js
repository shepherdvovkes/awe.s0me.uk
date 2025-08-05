const { exec } = require('child_process');
const SecurityManager = require('./security');
const { logCommand, logError } = require('../utils/logger');
const config = require('../config/app');

/**
 * Safe command executor with enhanced security and error handling
 */
class CommandExecutor {
    /**
     * Executes a command with security checks and timeout
     * @param {string} command - Command to execute
     * @param {Array} args - Command arguments
     * @returns {Promise<string>} - Command output
     */
    static async execute(command, args = []) {
        const startTime = Date.now();

        try {
            // Security validation
            if (!SecurityManager.isCommandSafe(command, args)) {
                throw new Error('Command not allowed or invalid arguments');
            }

            // Create safe command
            const safeCommand = SecurityManager.createSafeCommand(command, args);

            // Execute command with timeout
            const result = await this._executeCommand(safeCommand.fullCommand, safeCommand.timeout);

            const duration = Date.now() - startTime;

            // Log successful execution
            logCommand(command, args, result, duration);

            return result;

        } catch (error) {
            const duration = Date.now() - startTime;

            // Log error
            logError('Command execution failed', {
                command,
                args,
                error: error.message,
                duration
            });

            throw new Error(`Command execution failed: ${error.message}`);
        }
    }

    /**
     * Internal method for command execution with timeout
     * @param {string} fullCommand - Full command string
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<string>} - Command output
     */
    static _executeCommand(fullCommand, timeout = config.security.commandTimeout) {
        return new Promise((resolve, reject) => {
            const child = exec(fullCommand, {
                timeout,
                maxBuffer: config.security.maxBufferSize,
                encoding: 'utf8'
            }, (error, stdout, stderr) => {
                if (error) {
                    // Handle different types of errors
                    if (error.code === 'ETIMEDOUT') {
                        reject(new Error(`Command timed out after ${timeout}ms`));
                    } else if (error.code === 'ENOBUFS') {
                        reject(new Error('Command output too large'));
                    } else {
                        reject(new Error(`Command failed: ${error.message}`));
                    }
                } else {
                    // Return stdout or stderr
                    resolve(stdout || stderr || '');
                }
            });

            // Handle process events
            child.on('error', (error) => {
                reject(new Error(`Process error: ${error.message}`));
            });
        });
    }

    /**
     * Executes ping command
     * @param {string} hostname - Hostname to ping
     * @returns {Promise<string>} - Ping output
     */
    static async ping(hostname) {
        if (!SecurityManager.validateNetworkTarget(hostname)) {
            throw new Error('Invalid hostname or IP address');
        }

        return await this.execute('ping', [hostname]);
    }

    /**
     * Executes traceroute command
     * @param {string} hostname - Hostname to trace
     * @returns {Promise<string>} - Traceroute output
     */
    static async traceroute(hostname) {
        if (!SecurityManager.validateNetworkTarget(hostname)) {
            throw new Error('Invalid hostname or IP address');
        }

        return await this.execute('traceroute', [hostname]);
    }

    /**
     * Executes nslookup command
     * @param {string} hostname - Hostname to lookup
     * @returns {Promise<string>} - Nslookup output
     */
    static async nslookup(hostname) {
        if (!SecurityManager.validateNetworkTarget(hostname)) {
            throw new Error('Invalid hostname or IP address');
        }

        return await this.execute('nslookup', [hostname]);
    }

    /**
     * Executes netstat command
     * @param {Array} args - Additional arguments
     * @returns {Promise<string>} - Netstat output
     */
    static async netstat(args = []) {
        return await this.execute('netstat', args);
    }

    /**
     * Executes whois command
     * @param {string} domain - Domain to query
     * @returns {Promise<string>} - Whois output
     */
    static async whois(domain) {
        if (!SecurityManager.validateDomain(domain)) {
            throw new Error('Invalid domain');
        }

        return await this.execute('whois', [domain]);
    }

    /**
     * Gets system information
     * @returns {Object} - System information
     */
    static getSystemInfo() {
        return {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            pid: process.pid,
            cwd: process.cwd(),
            env: process.env.NODE_ENV || 'development'
        };
    }

    /**
     * Checks if a command is available in the system
     * @param {string} command - Command to check
     * @returns {Promise<boolean>} - Whether command is available
     */
    static async isCommandAvailable(command) {
        try {
            const result = await this._executeCommand(`which ${command}`, 5000);
            return result.trim().length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets list of available commands
     * @returns {Promise<Array>} - List of available commands
     */
    static async getAvailableCommands() {
        const allowedCommands = SecurityManager.getAllowedCommands();
        const availableCommands = [];

        for (const command of allowedCommands) {
            const isAvailable = await this.isCommandAvailable(command);
            if (isAvailable) {
                availableCommands.push(command);
            }
        }

        return availableCommands;
    }

    /**
     * Gets command statistics
     * @returns {Promise<Object>} - Command statistics
     */
    static async getCommandStats() {
        const commands = SecurityManager.getAllowedCommands();
        const stats = {};

        for (const command of commands) {
            const isAvailable = await this.isCommandAvailable(command);
            const config = SecurityManager.getCommandConfig(command);
            
            stats[command] = {
                available: isAvailable,
                timeout: config?.timeout || config.security.commandTimeout,
                maxArgs: config?.maxArgs || 0,
                validateHostname: config?.validateHostname || false,
                validateDomain: config?.validateDomain || false
            };
        }

        return stats;
    }

    /**
     * Tests command execution with a simple command
     * @param {string} command - Command to test
     * @returns {Promise<boolean>} - Whether command works
     */
    static async testCommand(command) {
        try {
            const config = SecurityManager.getCommandConfig(command);
            if (!config) {
                return false;
            }

            // Test with a safe argument
            const testArgs = command === 'ping' ? ['localhost'] : 
                           command === 'whois' ? ['example.com'] : [];

            await this.execute(command, testArgs);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Gets detailed system information
     * @returns {Promise<Object>} - Detailed system information
     */
    static async getDetailedSystemInfo() {
        const basicInfo = this.getSystemInfo();
        
        try {
            // Get additional system information
            const [osInfo, cpuInfo, memoryInfo] = await Promise.allSettled([
                this._getOSInfo(),
                this._getCPUInfo(),
                this._getMemoryInfo()
            ]);

            return {
                ...basicInfo,
                os: osInfo.status === 'fulfilled' ? osInfo.value : null,
                cpu: cpuInfo.status === 'fulfilled' ? cpuInfo.value : null,
                memory: memoryInfo.status === 'fulfilled' ? memoryInfo.value : null
            };
        } catch (error) {
            return basicInfo;
        }
    }

    /**
     * Gets OS information
     * @returns {Promise<Object>} - OS information
     */
    static async _getOSInfo() {
        try {
            const result = await this._executeCommand('uname -a', 5000);
            return { uname: result.trim() };
        } catch (error) {
            return null;
        }
    }

    /**
     * Gets CPU information
     * @returns {Promise<Object>} - CPU information
     */
    static async _getCPUInfo() {
        try {
            const result = await this._executeCommand('nproc', 5000);
            return { cores: parseInt(result.trim()) || 1 };
        } catch (error) {
            return { cores: 1 };
        }
    }

    /**
     * Gets memory information
     * @returns {Promise<Object>} - Memory information
     */
    static async _getMemoryInfo() {
        try {
            const result = await this._executeCommand('free -h', 5000);
            return { free: result.trim() };
        } catch (error) {
            return null;
        }
    }
}

module.exports = CommandExecutor;
