const NetworkService = require('../src/services/networkService');
const AIService = require('../src/services/aiService');

// Mock dependencies
jest.mock('../src/modules/commandExecutor');
jest.mock('../src/modules/cache');
jest.mock('../src/modules/database');
jest.mock('../src/modules/aiProcessor');
jest.mock('../src/utils/formatters');

describe('NetworkService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('ping', () => {
        test('should return successful ping result', async () => {
            const mockCommandExecutor = require('../src/modules/commandExecutor');
            const mockCacheManager = require('../src/modules/cache');
            
            mockCommandExecutor.ping.mockResolvedValue('PING localhost (127.0.0.1): 56 data bytes');
            mockCacheManager.createNetworkKey.mockReturnValue('network_ping_abc123');
            mockCacheManager.getOrSet.mockResolvedValue('Formatted ping output');

            const result = await NetworkService.ping('localhost');

            expect(result.success).toBe(true);
            expect(result.output).toBe('Formatted ping output');
            expect(result.cached).toBe(true);
            expect(result.timestamp).toBeDefined();
        });

        test('should handle ping errors', async () => {
            const mockCommandExecutor = require('../src/modules/commandExecutor');
            const mockCacheManager = require('../src/modules/cache');
            
            mockCommandExecutor.ping.mockRejectedValue(new Error('Host unreachable'));
            mockCacheManager.createNetworkKey.mockReturnValue('network_ping_abc123');
            mockCacheManager.getOrSet.mockRejectedValue(new Error('Host unreachable'));

            await expect(NetworkService.ping('invalid-host')).rejects.toThrow('Host unreachable');
        });
    });

    describe('traceroute', () => {
        test('should return successful traceroute result', async () => {
            const mockCommandExecutor = require('../src/modules/commandExecutor');
            const mockCacheManager = require('../src/modules/cache');
            
            mockCommandExecutor.traceroute.mockResolvedValue('traceroute to google.com');
            mockCacheManager.createNetworkKey.mockReturnValue('network_traceroute_abc123');
            mockCacheManager.getOrSet.mockResolvedValue('Formatted traceroute output');

            const result = await NetworkService.traceroute('google.com');

            expect(result.success).toBe(true);
            expect(result.output).toBe('Formatted traceroute output');
            expect(result.cached).toBe(true);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('nslookup', () => {
        test('should return successful nslookup result', async () => {
            const mockCommandExecutor = require('../src/modules/commandExecutor');
            const mockCacheManager = require('../src/modules/cache');
            
            mockCommandExecutor.nslookup.mockResolvedValue('nslookup result');
            mockCacheManager.createNetworkKey.mockReturnValue('network_nslookup_abc123');
            mockCacheManager.getOrSet.mockResolvedValue('Formatted nslookup output');

            const result = await NetworkService.nslookup('google.com');

            expect(result.success).toBe(true);
            expect(result.output).toBe('Formatted nslookup output');
            expect(result.cached).toBe(true);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('netstat', () => {
        test('should return successful netstat result', async () => {
            const mockCommandExecutor = require('../src/modules/commandExecutor');
            const mockCacheManager = require('../src/modules/cache');
            
            mockCommandExecutor.netstat.mockResolvedValue('netstat output');
            mockCacheManager.createCommandKey.mockReturnValue('cmd_netstat_abc123');
            mockCacheManager.getOrSet.mockResolvedValue('Formatted netstat output');

            const result = await NetworkService.netstat(['-an']);

            expect(result.success).toBe(true);
            expect(result.output).toBe('Formatted netstat output');
            expect(result.cached).toBe(true);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('whois', () => {
        test('should return successful whois result', async () => {
            const mockCommandExecutor = require('../src/modules/commandExecutor');
            const mockCacheManager = require('../src/modules/cache');
            
            mockCommandExecutor.whois.mockResolvedValue('whois output');
            mockCacheManager.createNetworkKey.mockReturnValue('network_whois_abc123');
            mockCacheManager.getOrSet.mockResolvedValue('Formatted whois output');

            const result = await NetworkService.whois('example.com');

            expect(result.success).toBe(true);
            expect(result.output).toBe('Formatted whois output');
            expect(result.cached).toBe(true);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('getSystemInfo', () => {
        test('should return system information', async () => {
            const mockCommandExecutor = require('../src/modules/commandExecutor');
            const mockOutputFormatter = require('../src/utils/formatters');
            
            const mockSystemInfo = {
                platform: 'darwin',
                arch: 'x64',
                nodeVersion: 'v18.0.0',
                uptime: 3600,
                memoryUsage: { rss: 1000000 },
                pid: 12345
            };
            
            mockCommandExecutor.getDetailedSystemInfo.mockResolvedValue(mockSystemInfo);
            mockOutputFormatter.formatSystemInfo.mockReturnValue('Formatted system info');

            const result = await NetworkService.getSystemInfo();

            expect(result.success).toBe(true);
            expect(result.info).toEqual(mockSystemInfo);
            expect(result.formatted).toBe('Formatted system info');
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('getAvailableCommands', () => {
        test('should return available commands', async () => {
            const mockCommandExecutor = require('../src/modules/commandExecutor');
            
            const mockCommands = ['ping', 'traceroute', 'nslookup'];
            const mockStats = {
                ping: { available: true, timeout: 5000 },
                traceroute: { available: true, timeout: 5000 }
            };
            
            mockCommandExecutor.getAvailableCommands.mockResolvedValue(mockCommands);
            mockCommandExecutor.getCommandStats.mockResolvedValue(mockStats);

            const result = await NetworkService.getAvailableCommands();

            expect(result.success).toBe(true);
            expect(result.commands).toEqual(mockCommands);
            expect(result.stats).toEqual(mockStats);
            expect(result.total).toBe(3);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('testCommand', () => {
        test('should return command test result', async () => {
            const mockCommandExecutor = require('../src/modules/commandExecutor');
            
            mockCommandExecutor.isCommandAvailable.mockResolvedValue(true);
            mockCommandExecutor.testCommand.mockResolvedValue(true);

            const result = await NetworkService.testCommand('ping');

            expect(result.success).toBe(true);
            expect(result.command).toBe('ping');
            expect(result.available).toBe(true);
            expect(result.working).toBe(true);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('getCacheStats', () => {
        test('should return cache statistics', async () => {
            const mockCacheManager = require('../src/modules/cache');
            
            const mockStats = { hits: 100, misses: 50 };
            const mockKeys = ['key1', 'key2', 'key3'];
            
            mockCacheManager.getStats.mockReturnValue(mockStats);
            mockCacheManager.getKeys.mockReturnValue(mockKeys);

            const result = await NetworkService.getCacheStats();

            expect(result.success).toBe(true);
            expect(result.stats).toEqual(mockStats);
            expect(result.keys).toEqual(mockKeys.slice(0, 50));
            expect(result.totalKeys).toBe(3);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('clearCache', () => {
        test('should clear cache successfully', async () => {
            const mockCacheManager = require('../src/modules/cache');
            
            mockCacheManager.flush.mockImplementation(() => {});

            const result = await NetworkService.clearCache();

            expect(result.success).toBe(true);
            expect(result.message).toBe('Cache cleared successfully');
            expect(result.timestamp).toBeDefined();
            expect(mockCacheManager.flush).toHaveBeenCalled();
        });
    });

    describe('getHealthStatus', () => {
        test('should return health status', async () => {
            const mockCacheManager = require('../src/modules/cache');
            
            const mockStats = { hits: 100, misses: 50 };
            mockCacheManager.getStats.mockReturnValue(mockStats);

            const result = await NetworkService.getHealthStatus();

            expect(result.success).toBe(true);
            expect(result.status).toBe('OK');
            expect(result.cache).toEqual(mockStats);
            expect(result.timestamp).toBeDefined();
            expect(result.uptime).toBeDefined();
            expect(result.memory).toBeDefined();
        });
    });
});

describe('AIService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateMOTD', () => {
        test('should return successful MOTD result', async () => {
            const mockAIProcessor = require('../src/modules/aiProcessor');
            const mockDatabaseManager = require('../src/modules/database');
            const mockOutputFormatter = require('../src/utils/formatters');
            
            mockAIProcessor.prototype.isOpenAIAvailable.mockResolvedValue(true);
            mockDatabaseManager.getMOTDHistory.mockResolvedValue([
                { message: 'Previous MOTD 1' },
                { message: 'Previous MOTD 2' }
            ]);
            mockAIProcessor.prototype.generateMultilingualMOTD.mockResolvedValue([
                { language: 'English', message: 'Hello World' },
                { language: 'Russian', message: 'Привет Мир' }
            ]);
            mockOutputFormatter.formatMOTD.mockReturnValue('Formatted MOTD output');

            const result = await AIService.generateMOTD();

            expect(result.success).toBe(true);
            expect(result.output).toBe('Formatted MOTD output');
            expect(result.cached).toBe(false);
            expect(result.timestamp).toBeDefined();
        });

        test('should handle AI service unavailability', async () => {
            const mockAIProcessor = require('../src/modules/aiProcessor');
            
            mockAIProcessor.prototype.isOpenAIAvailable.mockResolvedValue(false);

            await expect(AIService.generateMOTD()).rejects.toThrow('AI service is currently unavailable');
        });
    });

    describe('processUnknownCommand', () => {
        test('should return successful command processing result', async () => {
            const mockAIProcessor = require('../src/modules/aiProcessor');
            
            mockAIProcessor.prototype.isOpenAIAvailable.mockResolvedValue(true);
            mockAIProcessor.prototype.processUnknownCommand.mockResolvedValue('Command help text');

            const result = await AIService.processUnknownCommand('unknown-command', false);

            expect(result.success).toBe(true);
            expect(result.output).toBe('Command help text');
            expect(result.cached).toBe(false);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('detectLegalRequest', () => {
        test('should detect legal request correctly', async () => {
            const result = await AIService.detectLegalRequest('I need legal advice about contracts');

            expect(result.success).toBe(true);
            expect(result.isLegal).toBe(true);
            expect(result.confidence).toBe(0.8);
            expect(result.language).toBe('en');
            expect(result.timestamp).toBeDefined();
        });

        test('should detect non-legal request correctly', async () => {
            const result = await AIService.detectLegalRequest('What is the weather today?');

            expect(result.success).toBe(true);
            expect(result.isLegal).toBe(false);
            expect(result.confidence).toBe(0.2);
            expect(result.timestamp).toBeDefined();
        });

        test('should detect Russian language', async () => {
            const result = await AIService.detectLegalRequest('Мне нужна юридическая консультация по договору');

            expect(result.success).toBe(true);
            expect(result.isLegal).toBe(true);
            expect(result.language).toBe('ru');
        });
    });

    describe('searchLegalDatabase', () => {
        test('should return successful legal search result', async () => {
            const mockAIProcessor = require('../src/modules/aiProcessor');
            
            mockAIProcessor.prototype.isOpenAIAvailable.mockResolvedValue(true);
            mockAIProcessor.prototype.processLegalRequest.mockResolvedValue('Legal advice text');

            const result = await AIService.searchLegalDatabase('contract law', 'en');

            expect(result.success).toBe(true);
            expect(result.output).toBe('Legal advice text');
            expect(result.cached).toBe(false);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('processCourtCaseRequest', () => {
        test('should return successful court case processing result', async () => {
            const mockAIProcessor = require('../src/modules/aiProcessor');
            
            mockAIProcessor.prototype.isOpenAIAvailable.mockResolvedValue(true);
            mockAIProcessor.prototype.processCourtCaseRequest.mockResolvedValue('Court case information');

            const result = await AIService.processCourtCaseRequest('case number 123/2024');

            expect(result.success).toBe(true);
            expect(result.output).toBe('Court case information');
            expect(result.cached).toBe(false);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('processTCCRequest', () => {
        test('should return successful TCC processing result', async () => {
            const mockAIProcessor = require('../src/modules/aiProcessor');
            
            mockAIProcessor.prototype.isOpenAIAvailable.mockResolvedValue(true);
            mockAIProcessor.prototype.processTCCRequest.mockResolvedValue('TCC information');

            const result = await AIService.processTCCRequest('тцк информация');

            expect(result.success).toBe(true);
            expect(result.output).toBe('TCC information');
            expect(result.cached).toBe(false);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('getMOTDHistory', () => {
        test('should return MOTD history', async () => {
            const mockDatabaseManager = require('../src/modules/database');
            const mockOutputFormatter = require('../src/utils/formatters');
            
            const mockHistory = [
                { message: 'MOTD 1', language: 'en', created_at: '2024-01-01' },
                { message: 'MOTD 2', language: 'ru', created_at: '2024-01-02' }
            ];
            
            mockDatabaseManager.getMOTDHistory.mockResolvedValue(mockHistory);
            mockOutputFormatter.formatMOTDHistory.mockReturnValue('Formatted history');

            const result = await AIService.getMOTDHistory(10);

            expect(result.success).toBe(true);
            expect(result.history).toEqual(mockHistory);
            expect(result.formatted).toBe('Formatted history');
            expect(result.total).toBe(2);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('getOpenAIHistory', () => {
        test('should return OpenAI history', async () => {
            const mockDatabaseManager = require('../src/modules/database');
            
            const mockHistory = [
                { request_type: 'motd', prompt: 'Generate MOTD', response: 'Hello World' },
                { request_type: 'legal', prompt: 'Legal question', response: 'Legal answer' }
            ];
            
            mockDatabaseManager.getOpenAIHistory.mockResolvedValue(mockHistory);

            const result = await AIService.getOpenAIHistory(10);

            expect(result.success).toBe(true);
            expect(result.history).toEqual(mockHistory);
            expect(result.total).toBe(2);
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('getServiceStatus', () => {
        test('should return service status', async () => {
            const mockAIProcessor = require('../src/modules/aiProcessor');
            
            mockAIProcessor.prototype.isOpenAIAvailable.mockResolvedValue(true);

            const result = await AIService.getServiceStatus();

            expect(result.success).toBe(true);
            expect(result.status).toBe('available');
            expect(result.timestamp).toBeDefined();
            expect(result.model).toBeDefined();
            expect(result.environment).toBeDefined();
        });

        test('should return unavailable status', async () => {
            const mockAIProcessor = require('../src/modules/aiProcessor');
            
            mockAIProcessor.prototype.isOpenAIAvailable.mockResolvedValue(false);

            const result = await AIService.getServiceStatus();

            expect(result.success).toBe(true);
            expect(result.status).toBe('unavailable');
        });
    });

    describe('getServiceStats', () => {
        test('should return service statistics', async () => {
            const mockDatabaseManager = require('../src/modules/database');
            
            const mockMotdHistory = [
                { language: 'en' },
                { language: 'ru' },
                { language: 'en' }
            ];
            
            const mockOpenaiHistory = [
                { request_type: 'motd' },
                { request_type: 'legal' },
                { request_type: 'motd' }
            ];
            
            mockDatabaseManager.getMOTDHistory.mockResolvedValue(mockMotdHistory);
            mockDatabaseManager.getOpenAIHistory.mockResolvedValue(mockOpenaiHistory);

            const result = await AIService.getServiceStats();

            expect(result.success).toBe(true);
            expect(result.motd.total).toBe(3);
            expect(result.motd.languages.en).toBe(2);
            expect(result.motd.languages.ru).toBe(1);
            expect(result.openai.total).toBe(3);
            expect(result.openai.types.motd).toBe(2);
            expect(result.openai.types.legal).toBe(1);
            expect(result.timestamp).toBeDefined();
        });
    });
}); 