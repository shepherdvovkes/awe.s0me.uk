const CommandExecutor = require('../src/modules/commandExecutor');
const SecurityManager = require('../src/modules/security');

describe('CommandExecutor', () => {
    describe('execute', () => {
        test('should execute valid ping command', async () => {
            const result = await CommandExecutor.execute('ping', ['localhost']);
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should reject invalid command', async () => {
            await expect(
                CommandExecutor.execute('rm', ['-rf', '/'])
            ).rejects.toThrow('Command not allowed or invalid arguments');
        });

        test('should reject command with malicious arguments', async () => {
            await expect(
                CommandExecutor.execute('ping', ['localhost; rm -rf /'])
            ).rejects.toThrow('Command not allowed or invalid arguments');
        });
    });

    describe('ping', () => {
        test('should execute ping with valid hostname', async () => {
            const result = await CommandExecutor.ping('localhost');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should reject ping with invalid hostname', async () => {
            await expect(
                CommandExecutor.ping('invalid-hostname-!@#$%')
            ).rejects.toThrow('Invalid hostname or IP address');
        });
    });

    describe('traceroute', () => {
        test('should execute traceroute with valid hostname', async () => {
            const result = await CommandExecutor.traceroute('localhost');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should reject traceroute with invalid hostname', async () => {
            await expect(
                CommandExecutor.traceroute('invalid-hostname-!@#$%')
            ).rejects.toThrow('Invalid hostname or IP address');
        });
    });

    describe('nslookup', () => {
        test('should execute nslookup with valid hostname', async () => {
            const result = await CommandExecutor.nslookup('localhost');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should reject nslookup with invalid hostname', async () => {
            await expect(
                CommandExecutor.nslookup('invalid-hostname-!@#$%')
            ).rejects.toThrow('Invalid hostname or IP address');
        });
    });

    describe('whois', () => {
        test('should execute whois with valid domain', async () => {
            const result = await CommandExecutor.whois('example.com');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should reject whois with invalid domain', async () => {
            await expect(
                CommandExecutor.whois('invalid-domain-!@#$%')
            ).rejects.toThrow('Invalid domain');
        });
    });

    describe('getSystemInfo', () => {
        test('should return system information', () => {
            const info = CommandExecutor.getSystemInfo();
            expect(info).toHaveProperty('platform');
            expect(info).toHaveProperty('arch');
            expect(info).toHaveProperty('nodeVersion');
            expect(info).toHaveProperty('uptime');
            expect(info).toHaveProperty('memoryUsage');
            expect(info).toHaveProperty('pid');
        });
    });

    describe('isCommandAvailable', () => {
        test('should return true for available command', async () => {
            const isAvailable = await CommandExecutor.isCommandAvailable('ping');
            expect(typeof isAvailable).toBe('boolean');
        });

        test('should return false for unavailable command', async () => {
            const isAvailable = await CommandExecutor.isCommandAvailable('nonexistentcommand');
            expect(isAvailable).toBe(false);
        });
    });

    describe('getAvailableCommands', () => {
        test('should return array of available commands', async () => {
            const commands = await CommandExecutor.getAvailableCommands();
            expect(Array.isArray(commands)).toBe(true);
            expect(commands.length).toBeGreaterThan(0);
        });
    });
});

describe('SecurityManager', () => {
    describe('validateCommand', () => {
        test('should validate allowed commands', () => {
            expect(SecurityManager.validateCommand('ping')).toBe(true);
            expect(SecurityManager.validateCommand('traceroute')).toBe(true);
            expect(SecurityManager.validateCommand('nslookup')).toBe(true);
            expect(SecurityManager.validateCommand('netstat')).toBe(true);
            expect(SecurityManager.validateCommand('whois')).toBe(true);
        });

        test('should reject disallowed commands', () => {
            expect(SecurityManager.validateCommand('rm')).toBe(false);
            expect(SecurityManager.validateCommand('ls')).toBe(false);
            expect(SecurityManager.validateCommand('cat')).toBe(false);
        });
    });

    describe('validateHostname', () => {
        test('should validate valid hostnames', () => {
            expect(SecurityManager.validateHostname('localhost')).toBe(true);
            expect(SecurityManager.validateHostname('google.com')).toBe(true);
            expect(SecurityManager.validateHostname('example.org')).toBe(true);
        });

        test('should reject invalid hostnames', () => {
            expect(SecurityManager.validateHostname('')).toBe(false);
            expect(SecurityManager.validateHostname('invalid-hostname-!@#$%')).toBe(false);
            expect(SecurityManager.validateHostname('a'.repeat(254))).toBe(false);
        });
    });

    describe('validateDomain', () => {
        test('should validate valid domains', () => {
            expect(SecurityManager.validateDomain('example.com')).toBe(true);
            expect(SecurityManager.validateDomain('google.org')).toBe(true);
            expect(SecurityManager.validateDomain('test.co.uk')).toBe(true);
        });

        test('should reject invalid domains', () => {
            expect(SecurityManager.validateDomain('')).toBe(false);
            expect(SecurityManager.validateDomain('invalid-domain-!@#$%')).toBe(false);
            expect(SecurityManager.validateDomain('a'.repeat(254))).toBe(false);
        });
    });

    describe('validateIP', () => {
        test('should validate valid IPv4 addresses', () => {
            expect(SecurityManager.validateIP('127.0.0.1')).toBe(true);
            expect(SecurityManager.validateIP('192.168.1.1')).toBe(true);
            expect(SecurityManager.validateIP('8.8.8.8')).toBe(true);
        });

        test('should reject invalid IP addresses', () => {
            expect(SecurityManager.validateIP('')).toBe(false);
            expect(SecurityManager.validateIP('256.256.256.256')).toBe(false);
            expect(SecurityManager.validateIP('invalid-ip')).toBe(false);
        });
    });

    describe('sanitizeInput', () => {
        test('should sanitize input', () => {
            expect(SecurityManager.sanitizeInput('test; rm -rf /')).toBe('test rm -rf /');
            expect(SecurityManager.sanitizeInput('test && rm -rf /')).toBe('test rm -rf /');
            expect(SecurityManager.sanitizeInput('test | rm -rf /')).toBe('test rm -rf /');
        });

        test('should handle empty input', () => {
            expect(SecurityManager.sanitizeInput('')).toBe('');
            expect(SecurityManager.sanitizeInput(null)).toBe('');
            expect(SecurityManager.sanitizeInput(undefined)).toBe('');
        });
    });

    describe('isCommandSafe', () => {
        test('should allow safe commands', () => {
            expect(SecurityManager.isCommandSafe('ping', ['localhost'])).toBe(true);
            expect(SecurityManager.isCommandSafe('traceroute', ['google.com'])).toBe(true);
        });

        test('should reject unsafe commands', () => {
            expect(SecurityManager.isCommandSafe('rm', ['-rf', '/'])).toBe(false);
            expect(SecurityManager.isCommandSafe('ping', ['localhost; rm -rf /'])).toBe(false);
        });
    });
}); 