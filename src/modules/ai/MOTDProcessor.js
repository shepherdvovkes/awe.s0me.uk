const OpenAI = require('openai');
const IAIProcessor = require('../../interfaces/IAIProcessor');
const { logError, logInfo } = require('../../utils/logger');
const config = require('../../config/app');

/**
 * Процессор для генерации MOTD сообщений
 */
class MOTDProcessor extends IAIProcessor {
    constructor() {
        super();
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
    async process(query, options = {}) {
        const { language = 'en', previousMessages = [] } = options;
        
        try {
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

            return {
                language: this._getLanguageName(language),
                code: language,
                message: cleanMotd,
                prompt: dynamicPrompt
            };
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
                const motd = await this.process('', { 
                    language: lang.code, 
                    previousMessages 
                });
                multilingualMotds.push(motd);
            } catch (error) {
                logError(`Failed to generate MOTD for ${lang.code}`, error);
                // Продолжаем с другими языками
            }
        }

        return multilingualMotds;
    }

    /**
     * Проверяет доступность OpenAI API
     * @returns {Promise<boolean>} - Доступен ли API
     */
    async isAvailable() {
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
}

module.exports = MOTDProcessor; 