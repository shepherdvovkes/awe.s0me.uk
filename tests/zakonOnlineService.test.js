const ZakonOnlineService = require('../src/services/zakonOnlineService');
const databaseManager = require('../src/modules/database');

// Mock fetch
global.fetch = jest.fn();

describe('ZakonOnlineService', () => {
    let service;

    beforeEach(() => {
        service = new ZakonOnlineService();
        fetch.mockClear();
    });

    describe('initialization', () => {
        test('should initialize with valid token', async () => {
            // Set token before creating service
            process.env.ZAKON_TOKEN = 'test-token';
            const testService = new ZakonOnlineService();
            await expect(testService.initialize()).resolves.not.toThrow();
            expect(testService.isInitialized).toBe(true);
        });

        test('should throw error with invalid token', async () => {
            // Set invalid token before creating service
            process.env.ZAKON_TOKEN = 'DECxxxxxxxxx';
            const testService = new ZakonOnlineService();
            await expect(testService.initialize()).rejects.toThrow('ZAKON_TOKEN не настроен');
        });
    });

    describe('formatting', () => {
        test('should format search results correctly', () => {
            const searchResults = {
                success: true,
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
            };

            const formatted = service.formatSearchResults(searchResults);
            
            expect(formatted).toContain('РЕЗУЛЬТАТИ ПОШУКУ');
            expect(formatted).toContain('test query');
            expect(formatted).toContain('5 судових рішень');
            expect(formatted).toContain('Test Court');
            expect(formatted).toContain('Full text content');
        });

        test('should handle unsuccessful search', () => {
            const searchResults = {
                success: false,
                message: 'No results found'
            };

            const formatted = service.formatSearchResults(searchResults);
            expect(formatted).toBe('No results found');
        });
    });

    describe('API calls with mocks', () => {
        beforeEach(async () => {
            process.env.ZAKON_TOKEN = 'test-token';
            service = new ZakonOnlineService();
            await service.initialize();
        });

        test('should get courts list', async () => {
            const mockCourts = [
                { id: 1, name: 'Supreme Court' },
                { id: 2, name: 'Appeal Court' }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCourts
            });

            const result = await service.getCourts();
            expect(result).toEqual(mockCourts);
            expect(fetch).toHaveBeenCalledWith(
                'https://court.searcher.api.zakononline.com.ua/api/Court',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-token'
                    })
                })
            );
        });

        test('should search metadata', async () => {
            const mockMetadata = {
                totalCount: 10,
                items: [
                    { id: '1', courtName: 'Test Court', number: '123/2023' }
                ]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockMetadata
            });

            const result = await service.searchMetadata({
                searchText: 'test query',
                page: 1,
                pageSize: 10
            });

            expect(result).toEqual(mockMetadata);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('searchText=test%20query'),
                expect.any(Object)
            );
        });

        test('should perform full search successfully', async () => {
            const mockMetadata = {
                totalCount: 5,
                items: [
                    { id: '1', courtName: 'Court 1', number: '123/2023' },
                    { id: '2', courtName: 'Court 2', number: '456/2023' }
                ]
            };

            const mockFullText = {
                id: '1',
                fullText: 'Full text content',
                highlights: []
            };

            fetch
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => mockMetadata
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => mockFullText
                });

            const result = await service.performFullSearch('test query', { saveToDatabase: false });
            
            expect(result.success).toBe(true);
            expect(result.totalCount).toBe(5);
            expect(result.items).toHaveLength(2);
            expect(result.fullTexts).toHaveLength(1);
        });

        test('should handle no results', async () => {
            const mockMetadata = {
                totalCount: 0,
                items: []
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockMetadata
            });

            const result = await service.performFullSearch('test query', { saveToDatabase: false });
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('не знайдено судових рішень');
        });
    });
});

describe('Database integration', () => {
    let service;

    beforeAll(async () => {
        await databaseManager.initialize();
    });

    afterAll(async () => {
        await databaseManager.close();
    });

    beforeEach(async () => {
        service = new ZakonOnlineService();
        process.env.ZAKON_TOKEN = 'test-token';
        await service.initialize();
    });

    test('should save search results to database', async () => {
        const mockMetadata = {
            totalCount: 3,
            items: [
                {
                    id: '1',
                    courtName: 'Test Court',
                    judgmentForm: 'Decision',
                    justiceKind: 'Civil',
                    date: '2023-01-01',
                    number: '123/2023',
                    summary: 'Test case'
                }
            ]
        };

        const mockFullTexts = [
            {
                id: '1',
                fullText: 'Full text content',
                highlights: []
            }
        ];

        await service.saveSearchResults('test query', mockMetadata, mockFullTexts);

        // Verify search was saved
        const searches = await databaseManager.getAll(
            'SELECT * FROM zakon_online_searches WHERE query = ?',
            ['test query']
        );
        expect(searches.length).toBeGreaterThan(0);

        // Verify case was saved
        const cases = await databaseManager.getAll(
            'SELECT * FROM zakon_online_cases WHERE case_id = ?',
            ['1']
        );
        expect(cases.length).toBeGreaterThan(0);
        expect(cases[0].court_name).toBe('Test Court');
    });
}); 