const ZakonOnlineService = require('../src/services/zakonOnlineService');
const databaseManager = require('../src/modules/database');

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Mock config
jest.mock('../src/config/app', () => ({
    zakonOnline: {
        token: 'test-token'
    }
}));

describe('ZakonOnlineService', () => {
    let service;

    beforeEach(() => {
        service = new ZakonOnlineService();
        axios.mockClear();
    });

    describe('initialization', () => {
        test('should initialize with valid token', async () => {
            // Set token before creating service
            process.env.ZAKON_TOKEN = 'test-token';
            const testService = new ZakonOnlineService();
            // The service doesn't have an initialize method, so we just check it was created
            expect(testService).toBeDefined();
            expect(testService.token).toBeDefined();
        });

        test('should handle missing token', async () => {
            // Set invalid token before creating service
            process.env.ZAKON_TOKEN = undefined;
            const testService = new ZakonOnlineService();
            expect(testService).toBeDefined();
            expect(testService.token).toBeDefined(); // Should get from config
        });
    });

    describe('formatting', () => {
        test('should format search results correctly', () => {
            const searchResults = {
                success: true,
                data: {
                    query: 'test query',
                    totalCount: 5,
                    items: [
                        {
                            courtName: 'Test Court',
                            judgmentForm: 'Decision',
                            date: '2023-01-01',
                            number: '123/2023',
                            summary: 'Test summary'
                        }
                    ],
                    fullTexts: [
                        {
                            fullText: 'Full text content',
                            highlights: [
                                { text: 'highlighted text' }
                            ]
                        }
                    ]
                }
            };

            const formatted = service.formatSearchResults(searchResults);
            
            expect(formatted).toContain('SEARCH RESULTS');
            expect(formatted).toContain('test query');
            expect(formatted).toContain('5 судових рішень');
            expect(formatted).toContain('Test Court');
        });

        test('should handle unsuccessful search', () => {
            const searchResults = {
                success: false,
                error: 'No results found'
            };

            const formatted = service.formatSearchResults(searchResults);
            expect(formatted).toContain('Error: No results found');
        });
    });

    describe('API calls with mocks', () => {
        beforeEach(async () => {
            process.env.ZAKON_TOKEN = 'test-token';
            service = new ZakonOnlineService();
        });

        test('should get courts list', async () => {
            const mockCourts = [
                { id: 1, name: 'Supreme Court' },
                { id: 2, name: 'Appeal Court' }
            ];

            axios.get.mockResolvedValueOnce({
                data: mockCourts
            });

            const result = await service.getCourts();
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockCourts);
        });

        test('should search metadata', async () => {
            const mockSearchResults = {
                success: true,
                data: {
                    query: 'test query',
                    totalCount: 1,
                    items: []
                }
            };

            axios.get.mockResolvedValueOnce({
                data: mockSearchResults
            });

            const result = await service.searchMetadata('test query');
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        test('should perform full search successfully', async () => {
            const mockSearchResults = {
                success: true,
                data: {
                    query: 'test query',
                    totalCount: 1,
                    items: [
                        {
                            id: 1,
                            courtName: 'Test Court',
                            judgmentForm: 'Decision',
                            date: '2023-01-01',
                            number: '123/2023'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValueOnce({
                data: mockSearchResults
            });

            const result = await service.searchWithFullTexts('test query');
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        test('should handle no results', async () => {
            const mockSearchResults = {
                success: false,
                error: 'No results found'
            };

            axios.get.mockResolvedValueOnce({
                data: mockSearchResults
            });

            const result = await service.searchDecisions('nonexistent query');
            expect(result.success).toBe(false);
        });
    });

    describe('Database integration', () => {
        beforeAll(async () => {
            // Mock database manager methods
            if (databaseManager && typeof databaseManager.initialize === 'function') {
                await databaseManager.initialize();
            }
        });

        afterAll(async () => {
            // Mock database manager methods
            if (databaseManager && typeof databaseManager.close === 'function') {
                await databaseManager.close();
            }
        });

        beforeEach(async () => {
            // Mock database operations
            if (databaseManager && typeof databaseManager.clearTable === 'function') {
                await databaseManager.clearTable('zakon_search_results');
            }
        });

        test('should save search results to database', async () => {
            const mockMetadata = {
                success: true,
                data: {
                    query: 'test query',
                    totalCount: 1,
                    items: [
                        {
                            id: 1,
                            courtName: 'Test Court',
                            judgmentForm: 'Decision',
                            date: '2023-01-01',
                            number: '123/2023'
                        }
                    ]
                }
            };

            const mockFullTexts = [
                {
                    id: 1,
                    fullText: 'Full text content',
                    highlights: []
                }
            ];

            const result = await service.saveSearchResults(mockMetadata, mockFullTexts);
            expect(result).toBeDefined();
        });
    });
}); 