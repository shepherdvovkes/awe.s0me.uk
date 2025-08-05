const Validators = require('../src/utils/validators');

describe('Validators', () => {
    describe('validateHostname', () => {
        test('should validate valid hostnames', () => {
            const validHostnames = [
                'localhost',
                'google.com',
                'example.org',
                'test.example.com',
                'sub.domain.co.uk'
            ];

            validHostnames.forEach(hostname => {
                const result = Validators.validateHostname(hostname);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(hostname);
            });
        });

        test('should reject invalid hostnames', () => {
            const invalidHostnames = [
                '',
                'invalid-hostname-!@#$%',
                'a'.repeat(254),
                'hostname with spaces',
                'hostname.with.special.chars!'
            ];

            invalidHostnames.forEach(hostname => {
                const result = Validators.validateHostname(hostname);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });

    describe('validateDomain', () => {
        test('should validate valid domains', () => {
            const validDomains = [
                'example.com',
                'google.org',
                'test.co.uk',
                'sub.domain.com'
            ];

            validDomains.forEach(domain => {
                const result = Validators.validateDomain(domain);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(domain);
            });
        });

        test('should reject invalid domains', () => {
            const invalidDomains = [
                '',
                'invalid-domain-!@#$%',
                'a'.repeat(254),
                'domain without tld',
                'domain.with.special.chars!'
            ];

            invalidDomains.forEach(domain => {
                const result = Validators.validateDomain(domain);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });

    describe('validateIP', () => {
        test('should validate valid IPv4 addresses', () => {
            const validIPs = [
                '127.0.0.1',
                '192.168.1.1',
                '8.8.8.8',
                '255.255.255.255'
            ];

            validIPs.forEach(ip => {
                const result = Validators.validateIP(ip);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(ip);
            });
        });

        test('should reject invalid IP addresses', () => {
            const invalidIPs = [
                '',
                '256.256.256.256',
                'invalid-ip',
                '192.168.1',
                '192.168.1.256'
            ];

            invalidIPs.forEach(ip => {
                const result = Validators.validateIP(ip);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });

    describe('validateCommand', () => {
        test('should validate valid commands', () => {
            const validCommands = [
                'ping',
                'traceroute',
                'nslookup',
                'netstat',
                'whois'
            ];

            validCommands.forEach(command => {
                const result = Validators.validateCommand(command);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(command);
            });
        });

        test('should reject invalid commands', () => {
            const invalidCommands = [
                '',
                'command;with;special;chars',
                'a'.repeat(1001)
            ];

            invalidCommands.forEach(command => {
                const result = Validators.validateCommand(command);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });

    describe('validateQuery', () => {
        test('should validate valid queries', () => {
            const validQueries = [
                'test query',
                'legal question about contracts',
                'domain information request'
            ];

            validQueries.forEach(query => {
                const result = Validators.validateQuery(query);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(query);
            });
        });

        test('should reject invalid queries', () => {
            const invalidQueries = [
                '',
                'a'.repeat(2001),
                'query with very long content '.repeat(100)
            ];

            invalidQueries.forEach(query => {
                const result = Validators.validateQuery(query);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });

    describe('validateArgs', () => {
        test('should validate valid arguments', () => {
            const validArgs = [
                [],
                ['localhost'],
                ['google.com', '-c', '4']
            ];

            validArgs.forEach(args => {
                const result = Validators.validateArgs(args);
                expect(result.isValid).toBe(true);
                expect(result.value).toEqual(args);
            });
        });

        test('should reject invalid arguments', () => {
            const invalidArgs = [
                ['arg1', 'arg2', 'arg3', 'arg4', 'arg5', 'arg6', 'arg7', 'arg8', 'arg9', 'arg10', 'arg11'],
                ['a'.repeat(101)]
            ];

            invalidArgs.forEach(args => {
                const result = Validators.validateArgs(args);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });
    });

    describe('validateLanguage', () => {
        test('should validate valid languages', () => {
            const validLanguages = ['en', 'ru', 'ja', 'fr', 'uk'];

            validLanguages.forEach(language => {
                const result = Validators.validateLanguage(language);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(language);
            });
        });

        test('should reject invalid languages', () => {
            const invalidLanguages = ['invalid', 'es', 'de', ''];

            invalidLanguages.forEach(language => {
                const result = Validators.validateLanguage(language);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });

        test('should default to en for undefined', () => {
            const result = Validators.validateLanguage(undefined);
            expect(result.isValid).toBe(true);
            expect(result.value).toBe('en');
        });
    });

    describe('validateAdmin', () => {
        test('should validate valid admin flags', () => {
            const validFlags = [true, false];

            validFlags.forEach(flag => {
                const result = Validators.validateAdmin(flag);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(flag);
            });
        });

        test('should default to false for undefined', () => {
            const result = Validators.validateAdmin(undefined);
            expect(result.isValid).toBe(true);
            expect(result.value).toBe(false);
        });
    });

    describe('validateLimit', () => {
        test('should validate valid limits', () => {
            const validLimits = [1, 20, 50, 100];

            validLimits.forEach(limit => {
                const result = Validators.validateLimit(limit);
                expect(result.isValid).toBe(true);
                expect(result.value).toBe(limit);
            });
        });

        test('should reject invalid limits', () => {
            const invalidLimits = [0, 101, -1, 1.5];

            invalidLimits.forEach(limit => {
                const result = Validators.validateLimit(limit);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });

        test('should default to 20 for undefined', () => {
            const result = Validators.validateLimit(undefined);
            expect(result.isValid).toBe(true);
            expect(result.value).toBe(20);
        });
    });

    describe('sanitizeInput', () => {
        test('should sanitize input correctly', () => {
            const testCases = [
                { input: 'test; rm -rf /', expected: 'test rm -rf /' },
                { input: 'test && rm -rf /', expected: 'test rm -rf /' },
                { input: 'test | rm -rf /', expected: 'test rm -rf /' },
                { input: 'test  with   spaces', expected: 'test with spaces' },
                { input: '  test  ', expected: 'test' }
            ];

            testCases.forEach(({ input, expected }) => {
                const result = Validators.sanitizeInput(input);
                expect(result).toBe(expected);
            });
        });

        test('should handle empty input', () => {
            expect(Validators.sanitizeInput('')).toBe('');
            expect(Validators.sanitizeInput(null)).toBe('');
            expect(Validators.sanitizeInput(undefined)).toBe('');
        });
    });

    describe('createValidationMiddleware', () => {
        test('should create middleware function', () => {
            const schema = Validators.hostnameSchema;
            const middleware = Validators.createValidationMiddleware(schema);
            
            expect(typeof middleware).toBe('function');
            expect(middleware.length).toBe(3); // Express middleware signature
        });
    });

    describe('createQueryValidationMiddleware', () => {
        test('should create query validation middleware function', () => {
            const schema = Validators.limitSchema;
            const middleware = Validators.createQueryValidationMiddleware(schema);
            
            expect(typeof middleware).toBe('function');
            expect(middleware.length).toBe(3); // Express middleware signature
        });
    });
}); 