const CommandExecutor = require('../modules/commandExecutor');
const cacheManager = require('../modules/cache');
const OutputFormatter = require('../utils/formatters');
const { logInfo, logError } = require('../utils/logger');
const config = require('../config/app');

// Get CacheManager class from the module exports
const { CacheManager } = require('../modules/cache');

/**
 * Network service for handling network-related operations
 */
class NetworkService {
    /**
     * Executes ping command with caching
     * @param {string} hostname - Hostname to ping
     * @returns {Promise<Object>} - Ping result
     */
    static async ping(hostname) {
        try {
            const cacheKey = CacheManager.createNetworkKey(hostname, 'ping');
            
            const result = await cacheManager.getOrSet(cacheKey, async() => {
                const output = await CommandExecutor.ping(hostname);
                return OutputFormatter.formatPingOutput(output);
            }, config.cache.ttl);

            return {
                success: true,
                output: result,
                cached: true,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Ping service failed', { hostname, error: error.message });
            throw error;
        }
    }

    /**
     * Executes traceroute command with caching
     * @param {string} hostname - Hostname to trace
     * @returns {Promise<Object>} - Traceroute result
     */
    static async traceroute(hostname) {
        try {
            const cacheKey = CacheManager.createNetworkKey(hostname, 'traceroute');
            
            const result = await cacheManager.getOrSet(cacheKey, async() => {
                const output = await CommandExecutor.traceroute(hostname);
                return OutputFormatter.formatOutput(output);
            }, config.cache.ttl * 2); // Longer cache for traceroute

            return {
                success: true,
                output: result,
                cached: true,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Traceroute service failed', { hostname, error: error.message });
            throw error;
        }
    }

    /**
     * Executes nslookup command with caching
     * @param {string} hostname - Hostname to lookup
     * @returns {Promise<Object>} - Nslookup result
     */
    static async nslookup(hostname) {
        try {
            const cacheKey = CacheManager.createNetworkKey(hostname, 'nslookup');
            
            const result = await cacheManager.getOrSet(cacheKey, async() => {
                const output = await CommandExecutor.nslookup(hostname);
                return OutputFormatter.formatOutput(output);
            }, config.cache.ttl * 6); // Longer cache for DNS lookups

            return {
                success: true,
                output: result,
                cached: true,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Nslookup service failed', { hostname, error: error.message });
            throw error;
        }
    }

    /**
     * Executes netstat command with caching
     * @param {Array} args - Additional arguments
     * @returns {Promise<Object>} - Netstat result
     */
    static async netstat(args = []) {
        try {
            const cacheKey = CacheManager.createCommandKey('netstat', args);
            
            const result = await cacheManager.getOrSet(cacheKey, async() => {
                const output = await CommandExecutor.netstat(args);
                return OutputFormatter.formatOutput(output);
            }, 60); // Short cache for netstat

            return {
                success: true,
                output: result,
                cached: true,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Netstat service failed', { args, error: error.message });
            throw error;
        }
    }

    /**
     * Executes whois command with caching
     * @param {string} domain - Domain to query
     * @returns {Promise<Object>} - Whois result
     */
    static async whois(domain) {
        try {
            const cacheKey = CacheManager.createNetworkKey(domain, 'whois');
            
            const result = await cacheManager.getOrSet(cacheKey, async() => {
                const output = await CommandExecutor.whois(domain);
                return OutputFormatter.formatOutput(output);
            }, config.cache.ttl * 12); // Very long cache for whois

            return {
                success: true,
                output: result,
                cached: true,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Whois service failed', { domain, error: error.message });
            throw error;
        }
    }

    /**
     * Gets system information
     * @returns {Promise<Object>} - System information
     */
    static async getSystemInfo() {
        try {
            const systemInfo = await CommandExecutor.getDetailedSystemInfo();
            const formattedInfo = OutputFormatter.formatSystemInfo(systemInfo);

            return {
                success: true,
                info: systemInfo,
                formatted: formattedInfo,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('System info service failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Gets available commands
     * @returns {Promise<Object>} - Available commands
     */
    static async getAvailableCommands() {
        try {
            const [availableCommands, commandStats] = await Promise.all([
                CommandExecutor.getAvailableCommands(),
                CommandExecutor.getCommandStats()
            ]);

            return {
                success: true,
                commands: availableCommands,
                stats: commandStats,
                total: availableCommands.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Available commands service failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Tests command execution
     * @param {string} command - Command to test
     * @returns {Promise<Object>} - Test result
     */
    static async testCommand(command) {
        try {
            const isAvailable = await CommandExecutor.isCommandAvailable(command);
            const isWorking = isAvailable ? await CommandExecutor.testCommand(command) : false;

            return {
                success: true,
                command,
                available: isAvailable,
                working: isWorking,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Command test service failed', { command, error: error.message });
            throw error;
        }
    }

    /**
     * Gets cache statistics
     * @returns {Promise<Object>} - Cache statistics
     */
    static async getCacheStats() {
        try {
            const stats = cacheManager.getStats();
            const keys = cacheManager.getKeys();

            return {
                success: true,
                stats,
                keys: keys.slice(0, 50), // Limit to first 50 keys
                totalKeys: keys.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Cache stats service failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Clears cache
     * @returns {Promise<Object>} - Clear result
     */
    static async clearCache() {
        try {
            cacheManager.flush();

            return {
                success: true,
                message: 'Cache cleared successfully',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logError('Cache clear service failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Gets health status
     * @returns {Promise<Object>} - Health status
     */
    static async getHealthStatus() {
        try {
            const health = {
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cache: cacheManager.getStats(),
                environment: config.nodeEnv,
                version: process.version
            };

            return {
                success: true,
                ...health
            };
        } catch (error) {
            logError('Health status service failed', { error: error.message });
            throw error;
        }
    }
}

module.exports = NetworkService; 