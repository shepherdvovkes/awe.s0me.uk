// Настройка окружения для тестов
process.env.NODE_ENV = 'test';

// Полифилы для jsdom
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Мокаем логгер для тестов
jest.mock('../src/utils/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
    logWarning: jest.fn(),
    logCommand: jest.fn(),
    logSecurity: jest.fn()
}));

// Мокаем базу данных для тестов
jest.mock('../src/modules/database', () => ({
    initialize: jest.fn().mockResolvedValue(),
    saveMOTD: jest.fn().mockResolvedValue(),
    getMOTDHistory: jest.fn().mockResolvedValue([]),
    saveOpenAIRequest: jest.fn().mockResolvedValue(),
    getOpenAIHistory: jest.fn().mockResolvedValue([]),
    saveCommandLog: jest.fn().mockResolvedValue(),
    saveSecurityEvent: jest.fn().mockResolvedValue(),
    getCommandStats: jest.fn().mockResolvedValue([]),
    getSecurityEvents: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(),
    isHealthy: jest.fn().mockResolvedValue(true)
}));

// Мокаем кэш для тестов
const mockCacheManager = {
    getOrSet: jest.fn().mockImplementation(async (key, fetchFunction) => {
        return await fetchFunction();
    }),
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    flush: jest.fn(),
    getStats: jest.fn().mockReturnValue({}),
    getKeys: jest.fn().mockReturnValue([]),
    has: jest.fn().mockReturnValue(false),
    getTtl: jest.fn(),
    setTtl: jest.fn()
};

const mockCacheManagerClass = {
    createCommandKey: jest.fn().mockImplementation((command, args) => `cmd_${command}_${args.join('_')}`),
    createMOTDKey: jest.fn().mockImplementation((language) => `motd_${language}_${Date.now()}`),
    createAIKey: jest.fn().mockImplementation((prompt, type) => `ai_${type}_${prompt.length}`),
    createNetworkKey: jest.fn().mockImplementation((hostname, command) => `network_${command}_${hostname}`)
};

jest.mock('../src/modules/cache', () => {
    const mock = mockCacheManager;
    mock.CacheManager = mockCacheManagerClass;
    return mock;
});

// Глобальные настройки для тестов
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}; 