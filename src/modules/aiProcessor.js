const OpenAI = require('openai');
const { logError, logInfo } = require('../utils/logger');
const config = require('../config/app');
const databaseManager = require('./database');
const cacheManager = require('./cache');

// Get CacheManager class from the module exports
const { CacheManager } = require('./cache');

/**
 * Процессор AI запросов
 */
class AIProcessor {
    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey
        });
    }

    /**
     * Генерирует MOTD сообщение
     * @param {string} language - Язык
     * @param {Array} previousMessages - Предыдущие сообщения для избежания повторений
     * @returns {Promise<Object>} - MOTD сообщение
     */
    async generateMOTD(language = 'en', previousMessages = []) {
        try {
            const cacheKey = CacheManager.createMOTDKey(language);

            return await cacheManager.getOrSet(cacheKey, async() => {
                const basePrompt = `You are Bender from Futurama, now running a retro UNIX system from 1975. Generate a unique, witty 1-line message of the day (MOTD) in ${this._getLanguageName(language)} that I haven't seen before. Keep it short, funny, and in character. Use only ASCII characters - NO emojis. Style it like old computer terminals with simple text only.`;

                const dynamicPrompt = previousMessages.length > 0
                    ? `${basePrompt}\n\nPrevious messages to avoid repeating:\n${previousMessages.join('\n')}\n\nGenerate something completely different and unique in ${this._getLanguageName(language)}:`
                    : basePrompt;

                const completion = await this.openai.chat.completions.create({
                    model: config.openai.model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a retro UNIX system from 1975. Generate a 1-line message of the day (MOTD) that Bender from Futurama would say in ${this._getLanguageName(language)}. Keep it short, witty, and in character. Use only ASCII characters - NO emojis. Style it like old computer terminals with simple text only.`
                        },
                        {
                            role: 'user',
                            content: dynamicPrompt
                        }
                    ],
                    max_tokens: 100,
                    temperature: 0.9
                });

                const motd = completion.choices[0].message.content;
                const cleanMotd = motd.replace(/^MOTD:\s*/i, '').replace(/^Message of the day:\s*/i, '');

                // Сохраняем в базу данных
                await databaseManager.saveMOTD(cleanMotd, dynamicPrompt, language);
                await databaseManager.saveOpenAIRequest(`motd_${language}`, dynamicPrompt, cleanMotd);

                return {
                    language: this._getLanguageName(language),
                    code: language,
                    message: cleanMotd
                };
            }, 300); // 5 минут кэш

        } catch (error) {
            logError('MOTD generation failed', error);
            throw new Error(`Failed to generate MOTD: ${error.message}`);
        }
    }

    /**
     * Генерирует многоязычные MOTD
     * @param {Array} previousMessages - Предыдущие сообщения для избежания повторений
     * @returns {Promise<Array>} - Массив MOTD на разных языках
     */
    async generateMultilingualMOTD(previousMessages = []) {
        const languages = [
            { code: 'en', name: 'English' },
            { code: 'ru', name: 'Russian' },
            { code: 'ja', name: 'Japanese' },
            { code: 'fr', name: 'French' },
            { code: 'uk', name: 'Ukrainian' }
        ];

        const multilingualMotds = [];

        for (const lang of languages) {
            try {
                const motd = await this.generateMOTD(lang.code, previousMessages);
                multilingualMotds.push(motd);
            } catch (error) {
                logError(`Failed to generate MOTD for ${lang.code}`, error);
                // Продолжаем с другими языками
            }
        }

        return multilingualMotds;
    }

    /**
     * Обрабатывает неизвестную команду
     * @param {string} command - Команда
     * @param {boolean} isAdmin - Является ли пользователь админом
     * @returns {Promise<string>} - Ответ AI
     */
    async processUnknownCommand(command, isAdmin = false) {
        try {
            const cacheKey = cacheManager.createAIKey(command, 'unknown_command');

            return await cacheManager.getOrSet(cacheKey, async() => {
                let systemPrompt = `You are a helpful AI assistant in a retro UNIX terminal environment. 
The user has entered a command that doesn't exist in the system. 
Provide a helpful response that explains what they might have meant or suggest alternatives.
Keep responses concise and in the style of a 1970s computer terminal.`;

                if (isAdmin) {
                    systemPrompt += ' The user is an admin, so you can provide more detailed technical information.';
                }

                const completion = await this.openai.chat.completions.create({
                    model: config.openai.model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: command
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                });

                const response = completion.choices[0].message.content;

                // Сохраняем в базу данных
                await databaseManager.saveOpenAIRequest('unknown_command', command, response);

                return response;
            }, 600); // 10 минут кэш

        } catch (error) {
            logError('Unknown command processing failed', error);
            throw new Error(`Failed to process command: ${error.message}`);
        }
    }

    /**
     * Обрабатывает юридический запрос
     * @param {string} query - Запрос
     * @param {string} language - Язык
     * @returns {Promise<string>} - Ответ AI
     */
    async processLegalRequest(query, language = 'ru') {
        try {
            const cacheKey = cacheManager.createAIKey(query, 'legal_request');

            return await cacheManager.getOrSet(cacheKey, async() => {
                const systemPrompt = `You are a legal AI assistant. The user has asked a legal question.
Provide accurate legal information and guidance. Always recommend consulting with a qualified attorney for specific legal advice.
Respond in ${this._getLanguageName(language)}.
Keep responses professional and informative.`;

                const completion = await this.openai.chat.completions.create({
                    model: config.openai.model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: query
                        }
                    ],
                    max_tokens: 800,
                    temperature: 0.3
                });

                const response = completion.choices[0].message.content;

                // Сохраняем в базу данных
                await databaseManager.saveOpenAIRequest('legal_request', query, response);

                return response;
            }, 1800); // 30 минут кэш

        } catch (error) {
            logError('Legal request processing failed', error);
            throw new Error(`Failed to process legal request: ${error.message}`);
        }
    }

    /**
     * Обрабатывает запрос о номерах судебных дел
     * @param {string} query - Запрос
     * @returns {Promise<string>} - Ответ AI
     */
    async processCourtCaseRequest(query) {
        try {
            const cacheKey = cacheManager.createAIKey(query, 'court_case');

            return await cacheManager.getOrSet(cacheKey, async() => {
                const completion = await this.openai.chat.completions.create({
                    model: config.openai.model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a Ukrainian legal database assistant specializing in court case numbers.
The user is asking for court case numbers related to their legal query.
Provide a comprehensive response about relevant court cases, including:
- Case numbers and references
- Court decisions and rulings
- Legal precedents
- Relevant legal articles and codes
Respond in Ukrainian or Russian based on the user's language.
Keep the response informative and professional.`
                        },
                        {
                            role: 'user',
                            content: query
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                });

                const response = completion.choices[0].message.content;

                // Сохраняем в базу данных
                await databaseManager.saveOpenAIRequest('court_case_numbers_request', query, response);

                return response;
            }, 3600); // 1 час кэш

        } catch (error) {
            logError('Court case request processing failed', error);
            throw new Error(`Failed to process court case request: ${error.message}`);
        }
    }

    /**
     * Обрабатывает запрос ТЦК
     * @param {string} command - Команда ТЦК
     * @returns {Promise<string>} - Ответ AI
     */
    async processTCCRequest(command) {
        try {
            const cacheKey = cacheManager.createAIKey(command, 'tcc_request');

            return await cacheManager.getOrSet(cacheKey, async() => {
                const completion = await this.openai.chat.completions.create({
                    model: config.openai.model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a military legal database assistant specializing in Territorial Recruitment Centers (ТЦК - Территориальные центры комплектования).
The user is asking about military cases related to TCC. Provide a comprehensive response about TCC-related legal cases and procedures.
Respond in Russian or Ukrainian based on the user's language.
Include information about:
- TCC functions and responsibilities
- Common legal cases involving TCC
- Military service procedures
- Legal rights and obligations
Keep the response informative and professional.`
                        },
                        {
                            role: 'user',
                            content: command
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                });

                const response = completion.choices[0].message.content;

                // Сохраняем в базу данных
                await databaseManager.saveOpenAIRequest('tcc_request', command, response);

                return response;
            }, 3600); // 1 час кэш

        } catch (error) {
            logError('TCC request processing failed', error);
            throw new Error(`Failed to process TCC request: ${error.message}`);
        }
    }

    /**
     * Получает название языка по коду
     * @param {string} languageCode - Код языка
     * @returns {string} - Название языка
     */
    _getLanguageName(languageCode) {
        const languageNames = {
            en: 'English',
            ru: 'Russian',
            ja: 'Japanese',
            fr: 'French',
            uk: 'Ukrainian'
        };

        return languageNames[languageCode] || 'English';
    }

    /**
     * Проверяет доступность OpenAI API
     * @returns {Promise<boolean>} - Доступен ли API
     */
    async isOpenAIAvailable() {
        try {
            await this.openai.chat.completions.create({
                model: config.openai.model,
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 5
            });
            return true;
        } catch (error) {
            logError('OpenAI API not available', error);
            return false;
        }
    }
}

module.exports = AIProcessor;
