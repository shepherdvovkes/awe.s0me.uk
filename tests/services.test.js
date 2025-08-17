const NetworkService = require('../src/services/networkService');

// Mock dependencies
jest.mock('../src/modules/commandExecutor');
jest.mock('../src/modules/cache');
jest.mock('../src/utils/formatters');

const mockCommandExecutor = require('../src/modules/commandExecutor');
const mockCacheManager = require('../src/modules/cache');
const mockOutputFormatter = require('../src/utils/formatters');

describe('Services', () => {
    describe('NetworkService', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe('ping', () => {
            test('should return successful ping result', async () => {
                mockCommandExecutor.ping.mockResolvedValue('PING google.com (142.250.190.78): 56 data bytes');
                mockCacheManager.CacheManager.createNetworkKey.mockReturnValue('network_ping_google.com');
                mockCacheManager.getOrSet.mockResolvedValue('Formatted ping output');
                mockOutputFormatter.formatPingOutput.mockReturnValue('Formatted ping output');

                const result = await NetworkService.ping('google.com');

                expect(result.success).toBe(true);
                expect(result.output).toBe('Formatted ping output');
                expect(result.cached).toBe(true);
                expect(result.timestamp).toBeDefined();
            });

            test('should handle ping errors', async () => {
                mockCommandExecutor.ping.mockRejectedValue(new Error('Host unreachable'));
                mockCacheManager.CacheManager.createNetworkKey.mockReturnValue('network_ping_invalid');
                mockCacheManager.getOrSet.mockRejectedValue(new Error('Host unreachable'));

                await expect(NetworkService.ping('invalid-hostname-that-does-not-exist-12345.com')).rejects.toThrow('Host unreachable');
            });
        });

        describe('traceroute', () => {
            test('should return successful traceroute result', async () => {
                mockCommandExecutor.traceroute.mockResolvedValue('traceroute to google.com');
                mockCacheManager.CacheManager.createNetworkKey.mockReturnValue('network_traceroute_google.com');
                mockCacheManager.getOrSet.mockResolvedValue('Formatted traceroute output');
                mockOutputFormatter.formatOutput.mockReturnValue('Formatted traceroute output');

                const result = await NetworkService.traceroute('google.com');

                expect(result.success).toBe(true);
                expect(result.output).toBe('Formatted traceroute output');
                expect(result.cached).toBe(true);
                expect(result.timestamp).toBeDefined();
            });
        });

        describe('nslookup', () => {
            test('should return successful nslookup result', async () => {
                mockCommandExecutor.nslookup.mockResolvedValue('nslookup result');
                mockCacheManager.CacheManager.createNetworkKey.mockReturnValue('network_nslookup_google.com');
                mockCacheManager.getOrSet.mockResolvedValue('Formatted nslookup output');
                mockOutputFormatter.formatOutput.mockReturnValue('Formatted nslookup output');

                const result = await NetworkService.nslookup('google.com');

                expect(result.success).toBe(true);
                expect(result.output).toBe('Formatted nslookup output');
                expect(result.cached).toBe(true);
                expect(result.timestamp).toBeDefined();
            });
        });

        describe('netstat', () => {
            test('should return successful netstat result', async () => {
                mockCommandExecutor.netstat.mockResolvedValue('netstat output');
                mockCacheManager.CacheManager.createCommandKey.mockReturnValue('cmd_netstat');
                mockCacheManager.getOrSet.mockResolvedValue('Formatted netstat output');
                mockOutputFormatter.formatOutput.mockReturnValue('Formatted netstat output');

                const result = await NetworkService.netstat();

                expect(result.success).toBe(true);
                expect(result.output).toBe('Formatted netstat output');
                expect(result.cached).toBe(true);
                expect(result.timestamp).toBeDefined();
            });
        });

        describe('whois', () => {
            test('should return successful whois result', async () => {
                mockCommandExecutor.whois.mockResolvedValue('whois output');
                mockCacheManager.CacheManager.createNetworkKey.mockReturnValue('network_whois_google.com');
                mockCacheManager.getOrSet.mockResolvedValue('Formatted whois output');
                mockOutputFormatter.formatOutput.mockReturnValue('Formatted whois output');

                const result = await NetworkService.whois('google.com');

                expect(result.success).toBe(true);
                expect(result.output).toBe('Formatted whois output');
                expect(result.cached).toBe(true);
                expect(result.timestamp).toBeDefined();
            });
        });

        describe('getSystemInfo', () => {
            test('should return system information', async () => {
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
        // Mock dependencies for AIService
        const mockMotdProcessor = {
            isAvailable: jest.fn(),
            generateMultilingualMOTD: jest.fn()
        };

        const mockLegalProcessor = {
            isAvailable: jest.fn(),
            detectLegalRequest: jest.fn(),
            processLegalRequest: jest.fn(),
            processCourtCaseRequest: jest.fn(),
            processTCCRequest: jest.fn()
        };

        const mockCommandProcessor = {
            isAvailable: jest.fn(),
            processUnknownCommand: jest.fn()
        };

        const mockMotdRepository = {
            getRecentMOTDs: jest.fn(),
            save: jest.fn(),
            getMOTDHistory: jest.fn()
        };

        const mockOpenaiRequestRepository = {
            save: jest.fn(),
            getOpenAIHistory: jest.fn()
        };

        const mockCacheManager = {
            get: jest.fn(),
            set: jest.fn(),
            clear: jest.fn(),
            getStats: jest.fn()
        };

        const mockAiRequestContext = {
            processRequest: jest.fn()
        };

        // Mock the AIService constructor
        jest.mock('../src/services/aiService', () => {
            return jest.fn().mockImplementation(() => ({
                motdProcessor: mockMotdProcessor,
                legalProcessor: mockLegalProcessor,
                commandProcessor: mockCommandProcessor,
                motdRepository: mockMotdRepository,
                openaiRequestRepository: mockOpenaiRequestRepository,
                cacheManager: mockCacheManager,
                aiRequestContext: mockAiRequestContext,
                generateMOTD: jest.fn(),
                processUnknownCommand: jest.fn(),
                detectLegalRequest: jest.fn(),
                searchLegalDatabase: jest.fn(),
                processCourtCaseRequest: jest.fn(),
                processTCCRequest: jest.fn(),
                getMOTDHistory: jest.fn(),
                getOpenAIHistory: jest.fn(),
                getServiceStatus: jest.fn(),
                getServiceStats: jest.fn()
            }));
        });

        const AIService = require('../src/services/aiService');
        let aiService;

        beforeEach(() => {
            aiService = new AIService();
            // Reset all mocks
            jest.clearAllMocks();
        });

        describe('generateMOTD', () => {
            test('should return successful MOTD result', async () => {
                mockMotdProcessor.isAvailable.mockResolvedValue(true);
                mockMotdRepository.getRecentMOTDs.mockResolvedValue([
                    { message: 'Previous MOTD 1' },
                    { message: 'Previous MOTD 2' }
                ]);
                mockMotdProcessor.generateMultilingualMOTD.mockResolvedValue([
                    { language: 'English', message: 'Hello World', code: 'en' },
                    { language: 'Russian', message: 'Привет Мир', code: 'ru' }
                ]);
                mockMotdRepository.save.mockResolvedValue(true);

                const result = await aiService.generateMOTD();

                expect(result.success).toBe(true);
                expect(result.output).toBeDefined();
                expect(result.multilingual).toBeDefined();
                expect(result.cached).toBe(false);
                expect(result.timestamp).toBeDefined();
            });

            test('should handle AI service unavailability', async () => {
                mockMotdProcessor.isAvailable.mockResolvedValue(false);

                await expect(aiService.generateMOTD()).rejects.toThrow('AI service is currently unavailable');
            });
        });

        describe('processUnknownCommand', () => {
            test('should return successful command processing result', async () => {
                mockCommandProcessor.isAvailable.mockResolvedValue(true);
                mockAiRequestContext.processRequest.mockResolvedValue({
                    response: 'Command help text'
                });
                mockOpenaiRequestRepository.save.mockResolvedValue(true);

                const result = await aiService.processUnknownCommand('unknown-command', false);

                expect(result.success).toBe(true);
                expect(result.output).toBe('Command help text');
                expect(result.cached).toBe(false);
                expect(result.timestamp).toBeDefined();
            });
        });

        describe('detectLegalRequest', () => {
            test('should detect legal request correctly', async () => {
                mockLegalProcessor.isAvailable.mockResolvedValue(true);
                mockLegalProcessor.detectLegalRequest.mockResolvedValue({
                    isLegal: true,
                    confidence: 0.8,
                    language: 'en'
                });

                const result = await aiService.detectLegalRequest('I need legal advice about contracts');

                expect(result.success).toBe(true);
                expect(result.isLegal).toBe(true);
                expect(result.confidence).toBe(0.8);
                expect(result.language).toBe('en');
                expect(result.timestamp).toBeDefined();
            });

            test('should detect non-legal request correctly', async () => {
                mockLegalProcessor.isAvailable.mockResolvedValue(true);
                mockLegalProcessor.detectLegalRequest.mockResolvedValue({
                    isLegal: false,
                    confidence: 0.2,
                    language: 'en'
                });

                const result = await aiService.detectLegalRequest('What is the weather today?');

                expect(result.success).toBe(true);
                expect(result.isLegal).toBe(false);
                expect(result.confidence).toBe(0.2);
                expect(result.timestamp).toBeDefined();
            });

            test('should detect Russian language', async () => {
                mockLegalProcessor.isAvailable.mockResolvedValue(true);
                mockLegalProcessor.detectLegalRequest.mockResolvedValue({
                    isLegal: true,
                    confidence: 0.9,
                    language: 'ru'
                });

                const result = await aiService.detectLegalRequest('Мне нужна юридическая консультация по договору');

                expect(result.success).toBe(true);
                expect(result.isLegal).toBe(true);
                expect(result.language).toBe('ru');
            });
        });

        describe('searchLegalDatabase', () => {
            test('should return successful legal search result', async () => {
                mockLegalProcessor.isAvailable.mockResolvedValue(true);
                mockLegalProcessor.processLegalRequest.mockResolvedValue('Legal advice text');
                mockOpenaiRequestRepository.save.mockResolvedValue(true);

                const result = await aiService.searchLegalDatabase('contract law', 'en');

                expect(result.success).toBe(true);
                expect(result.output).toBe('Legal advice text');
                expect(result.cached).toBe(false);
                expect(result.timestamp).toBeDefined();
            });
        });

        describe('processCourtCaseRequest', () => {
            test('should return successful court case processing result', async () => {
                mockLegalProcessor.isAvailable.mockResolvedValue(true);
                mockLegalProcessor.processCourtCaseRequest.mockResolvedValue('Court case information');
                mockOpenaiRequestRepository.save.mockResolvedValue(true);

                const result = await aiService.processCourtCaseRequest('case number 123/2024');

                expect(result.success).toBe(true);
                expect(result.output).toBe('Court case information');
                expect(result.cached).toBe(false);
                expect(result.timestamp).toBeDefined();
            });
        });

        describe('processTCCRequest', () => {
            test('should return successful TCC processing result', async () => {
                mockLegalProcessor.isAvailable.mockResolvedValue(true);
                mockLegalProcessor.processTCCRequest.mockResolvedValue('TCC information');
                mockOpenaiRequestRepository.save.mockResolvedValue(true);

                const result = await aiService.processTCCRequest('тцк информация');

                expect(result.success).toBe(true);
                expect(result.output).toBe('TCC information');
                expect(result.cached).toBe(false);
                expect(result.timestamp).toBeDefined();
            });
        });

        describe('getMOTDHistory', () => {
            test('should return MOTD history', async () => {
                const mockHistory = [
                    { id: 1, message: 'MOTD 1', timestamp: '2023-01-01' },
                    { id: 2, message: 'MOTD 2', timestamp: '2023-01-02' }
                ];
                
                mockMotdRepository.getMOTDHistory.mockResolvedValue(mockHistory);

                const result = await aiService.getMOTDHistory(10);

                expect(result.success).toBe(true);
                expect(result.history).toEqual(mockHistory);
                expect(result.limit).toBe(10);
            });
        });

        describe('getOpenAIHistory', () => {
            test('should return OpenAI history', async () => {
                const mockHistory = [
                    { id: 1, requestType: 'unknown_command', prompt: 'test', timestamp: '2023-01-01' },
                    { id: 2, requestType: 'legal_request', prompt: 'legal test', timestamp: '2023-01-02' }
                ];
                
                mockOpenaiRequestRepository.getOpenAIHistory.mockResolvedValue(mockHistory);

                const result = await aiService.getOpenAIHistory(10);

                expect(result.success).toBe(true);
                expect(result.history).toEqual(mockHistory);
                expect(result.limit).toBe(10);
            });
        });

        describe('getServiceStatus', () => {
            test('should return service status', async () => {
                mockMotdProcessor.isAvailable.mockResolvedValue(true);
                mockLegalProcessor.isAvailable.mockResolvedValue(true);
                mockCommandProcessor.isAvailable.mockResolvedValue(true);

                const result = await aiService.getServiceStatus();

                expect(result.success).toBe(true);
                expect(result.status).toBe('available');
                expect(result.services).toBeDefined();
            });

            test('should return unavailable status', async () => {
                mockMotdProcessor.isAvailable.mockResolvedValue(false);
                mockLegalProcessor.isAvailable.mockResolvedValue(false);
                mockCommandProcessor.isAvailable.mockResolvedValue(false);

                const result = await aiService.getServiceStatus();

                expect(result.success).toBe(true);
                expect(result.status).toBe('unavailable');
                expect(result.services).toBeDefined();
            });
        });

        describe('getServiceStats', () => {
            test('should return service statistics', async () => {
                const mockMotdHistory = [
                    { id: 1, message: 'MOTD 1' },
                    { id: 2, message: 'MOTD 2' }
                ];
                const mockOpenaiHistory = [
                    { id: 1, requestType: 'unknown_command' },
                    { id: 2, requestType: 'legal_request' }
                ];
                
                mockMotdRepository.getMOTDHistory.mockResolvedValue(mockMotdHistory);
                mockOpenaiRequestRepository.getOpenAIHistory.mockResolvedValue(mockOpenaiHistory);
                mockCacheManager.getStats.mockResolvedValue({
                    hits: 10,
                    misses: 5,
                    keys: 15
                });

                const result = await aiService.getServiceStats();

                expect(result.success).toBe(true);
                expect(result.stats).toBeDefined();
                expect(result.stats.motdCount).toBe(2);
                expect(result.stats.openaiCount).toBe(2);
                expect(result.stats.cacheStats).toBeDefined();
            });
        });
    });
}); 