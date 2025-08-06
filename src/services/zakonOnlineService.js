const fetch = require('node-fetch');
const { logError, logInfo } = require('../utils/logger');
const databaseManager = require('../modules/database');

/**
 * Сервис для работы с API "Закон Онлайн"
 */
class ZakonOnlineService {
    constructor() {
        this.baseUrl = 'https://court.searcher.api.zakononline.com.ua/api';
        this.token = process.env.ZAKON_TOKEN;
        this.isInitialized = false;
    }

    /**
     * Инициализирует сервис
     */
    async initialize() {
        if (!this.token || this.token === 'DECxxxxxxxxx') {
            throw new Error('ZAKON_TOKEN не настроен');
        }
        
        this.isInitialized = true;
        logInfo('ZakonOnlineService initialized');
    }

    /**
     * Получает список судов
     * @returns {Promise<Array>} - Список судов
     */
    async getCourts() {
        try {
            const response = await fetch(`${this.baseUrl}/Court`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get courts: ${response.status}`);
            }

            const courts = await response.json();
            logInfo('Retrieved courts list', { count: courts.length });
            return courts;
        } catch (error) {
            logError('Error getting courts', error);
            throw error;
        }
    }

    /**
     * Получает формы решений
     * @returns {Promise<Array>} - Список форм решений
     */
    async getJudgmentForms() {
        try {
            const response = await fetch(`${this.baseUrl}/JudgmentForm`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get judgment forms: ${response.status}`);
            }

            const forms = await response.json();
            logInfo('Retrieved judgment forms', { count: forms.length });
            return forms;
        } catch (error) {
            logError('Error getting judgment forms', error);
            throw error;
        }
    }

    /**
     * Получает виды правосудия
     * @returns {Promise<Array>} - Список видов правосудия
     */
    async getJusticeKinds() {
        try {
            const response = await fetch(`${this.baseUrl}/JusticeKind`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get justice kinds: ${response.status}`);
            }

            const kinds = await response.json();
            logInfo('Retrieved justice kinds', { count: kinds.length });
            return kinds;
        } catch (error) {
            logError('Error getting justice kinds', error);
            throw error;
        }
    }

    /**
     * Ищет метаданные судебных решений
     * @param {Object} params - Параметры поиска
     * @returns {Promise<Object>} - Результаты поиска
     */
    async searchMetadata(params) {
        const {
            searchText,
            page = 1,
            pageSize = 10,
            courtId = null,
            judgmentFormId = null,
            justiceKindId = null
        } = params;

        try {
            let url = `${this.baseUrl}/Searcher/GetEntitiesMetaWith?searchText=${encodeURIComponent(searchText)}&page=${page}&pageSize=${pageSize}`;
            
            if (courtId) url += `&courtId=${courtId}`;
            if (judgmentFormId) url += `&judgmentFormId=${judgmentFormId}`;
            if (justiceKindId) url += `&justiceKindId=${justiceKindId}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Metadata search failed: ${response.status}`);
            }

            const metadata = await response.json();
            logInfo('Metadata search completed', { 
                query: searchText, 
                totalCount: metadata.totalCount,
                page,
                pageSize 
            });
            
            return metadata;
        } catch (error) {
            logError('Error searching metadata', error);
            throw error;
        }
    }

    /**
     * Получает полный текст судебного решения
     * @param {string} id - ID решения
     * @param {string} searchText - Поисковый текст для выделения
     * @returns {Promise<Object>} - Полный текст решения
     */
    async getFullText(id, searchText) {
        try {
            const url = `${this.baseUrl}/Searcher/GetSearchText?id=${id}&searchText=${encodeURIComponent(searchText)}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Full text request failed: ${response.status}`);
            }

            const fullText = await response.json();
            logInfo('Full text retrieved', { id, searchText });
            
            return fullText;
        } catch (error) {
            logError('Error getting full text', error);
            throw error;
        }
    }

    /**
     * Выполняет полный поиск с сохранением в базу данных
     * @param {string} query - Поисковый запрос
     * @param {Object} options - Дополнительные опции
     * @returns {Promise<Object>} - Результаты поиска
     */
    async performFullSearch(query, options = {}) {
        const {
            page = 1,
            pageSize = 10,
            courtId = null,
            judgmentFormId = null,
            justiceKindId = null,
            saveToDatabase = true
        } = options;

        try {
            // Шаг 1: Поиск метаданных
            const metadata = await this.searchMetadata({
                searchText: query,
                page,
                pageSize,
                courtId,
                judgmentFormId,
                justiceKindId
            });

            if (!metadata.items || metadata.items.length === 0) {
                return {
                    success: false,
                    message: `За вашим запитом "${query}" не знайдено судових рішень.`,
                    totalCount: 0,
                    items: []
                };
            }

            // Шаг 2: Получение полных текстов для первых результатов
            const fullTexts = [];
            const maxFullTexts = Math.min(3, metadata.items.length); // Получаем максимум 3 полных текста

            for (let i = 0; i < maxFullTexts; i++) {
                try {
                    const fullText = await this.getFullText(metadata.items[i].id, query);
                    fullTexts.push(fullText);
                } catch (error) {
                    logError(`Error getting full text for item ${i}`, error);
                    // Продолжаем с другими элементами
                }
            }

            // Шаг 3: Сохранение в базу данных
            if (saveToDatabase) {
                await this.saveSearchResults(query, metadata, fullTexts);
            }

            return {
                success: true,
                query,
                totalCount: metadata.totalCount,
                items: metadata.items,
                fullTexts,
                page,
                pageSize
            };

        } catch (error) {
            logError('Error performing full search', error);
            throw error;
        }
    }

    /**
     * Сохраняет результаты поиска в базу данных
     * @param {string} query - Поисковый запрос
     * @param {Object} metadata - Метаданные результатов
     * @param {Array} fullTexts - Полные тексты
     * @returns {Promise} - Результат сохранения
     */
    async saveSearchResults(query, metadata, fullTexts) {
        try {
            // Сохраняем основной поиск
            const searchId = await databaseManager.runQuery(
                `INSERT INTO zakon_online_searches (query, total_count, page, page_size, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [query, metadata.totalCount, 1, metadata.items.length]
            );

            // Сохраняем найденные дела
            for (const item of metadata.items) {
                await databaseManager.runQuery(
                    `INSERT INTO zakon_online_cases (
                        search_id, case_id, court_name, judgment_form, justice_kind, 
                        case_date, case_number, summary, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [
                        searchId.lastID,
                        item.id,
                        item.courtName || '',
                        item.judgmentForm || '',
                        item.justiceKind || '',
                        item.date || '',
                        item.number || '',
                        item.summary || ''
                    ]
                );
            }

            // Сохраняем полные тексты
            for (const fullText of fullTexts) {
                if (fullText && fullText.id) {
                    await databaseManager.runQuery(
                        `INSERT INTO zakon_online_full_texts (
                            case_id, full_text, highlights, created_at
                        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                        [
                            fullText.id,
                            fullText.fullText || '',
                            JSON.stringify(fullText.highlights || [])
                        ]
                    );
                }
            }

            logInfo('Search results saved to database', { 
                searchId: searchId.lastID, 
                casesCount: metadata.items.length,
                fullTextsCount: fullTexts.length 
            });

        } catch (error) {
            logError('Error saving search results to database', error);
            throw error;
        }
    }

    /**
     * Получает историю поисков из базы данных
     * @param {number} limit - Количество записей
     * @returns {Promise<Array>} - История поисков
     */
    async getSearchHistory(limit = 20) {
        try {
            const sql = `
                SELECT 
                    s.id,
                    s.query,
                    s.total_count,
                    s.page,
                    s.page_size,
                    s.created_at,
                    COUNT(c.id) as cases_found
                FROM zakon_online_searches s
                LEFT JOIN zakon_online_cases c ON s.id = c.search_id
                GROUP BY s.id
                ORDER BY s.created_at DESC
                LIMIT ?
            `;
            
            return await databaseManager.getAll(sql, [limit]);
        } catch (error) {
            logError('Error getting search history', error);
            throw error;
        }
    }

    /**
     * Получает детали конкретного поиска
     * @param {number} searchId - ID поиска
     * @returns {Promise<Object>} - Детали поиска
     */
    async getSearchDetails(searchId) {
        try {
            // Получаем основную информацию о поиске
            const search = await databaseManager.get(
                'SELECT * FROM zakon_online_searches WHERE id = ?',
                [searchId]
            );

            if (!search) {
                throw new Error('Search not found');
            }

            // Получаем найденные дела
            const cases = await databaseManager.getAll(
                'SELECT * FROM zakon_online_cases WHERE search_id = ? ORDER BY created_at',
                [searchId]
            );

            // Получаем полные тексты
            const fullTexts = await databaseManager.getAll(
                'SELECT * FROM zakon_online_full_texts WHERE case_id IN (SELECT case_id FROM zakon_online_cases WHERE search_id = ?)',
                [searchId]
            );

            return {
                search,
                cases,
                fullTexts
            };
        } catch (error) {
            logError('Error getting search details', error);
            throw error;
        }
    }

    /**
     * Форматирует результаты поиска для отображения
     * @param {Object} searchResults - Результаты поиска
     * @returns {string} - Отформатированный результат
     */
    formatSearchResults(searchResults) {
        if (!searchResults.success) {
            return searchResults.message;
        }

        let formatted = `🔍 РЕЗУЛЬТАТИ ПОШУКУ: "${searchResults.query}"\n`;
        formatted += `==========================================\n\n`;
        formatted += `📊 Знайдено: ${searchResults.totalCount} судових рішень\n`;
        formatted += `📄 Показано: ${searchResults.items.length} з ${searchResults.pageSize}\n\n`;

        // Список найденных дел
        formatted += `📋 ЗНАЙДЕНІ СПРАВИ:\n`;
        formatted += `----------------------------------------\n\n`;

        searchResults.items.forEach((item, index) => {
            formatted += `${index + 1}. ${item.courtName || 'Суд'}\n`;
            if (item.judgmentForm) {
                formatted += `   Форма: ${item.judgmentForm}\n`;
            }
            if (item.date) {
                formatted += `   Дата: ${item.date}\n`;
            }
            if (item.number) {
                formatted += `   Номер: ${item.number}\n`;
            }
            if (item.summary) {
                formatted += `   Опис: ${item.summary}\n`;
            }
            formatted += '\n';
        });

        // Полные тексты (если есть)
        if (searchResults.fullTexts && searchResults.fullTexts.length > 0) {
            formatted += `\n📄 ПОВНІ ТЕКСТИ РІШЕНЬ:\n`;
            formatted += `----------------------------------------\n\n`;

            searchResults.fullTexts.forEach((fullText, index) => {
                formatted += `=== РІШЕННЯ ${index + 1} ===\n`;
                
                // Ограничиваем длину текста
                const maxLength = 1500;
                let text = fullText.fullText || '';
                if (text.length > maxLength) {
                    text = text.substring(0, maxLength) + '...\n\n[Текст обрізано для стислості]';
                }
                
                formatted += text + '\n\n';

                // Выделенные ключевые слова
                if (fullText.highlights && fullText.highlights.length > 0) {
                    formatted += `🔍 ВИДІЛЕНІ КЛЮЧОВІ СЛОВА:\n`;
                    fullText.highlights.slice(0, 5).forEach((highlight, hIndex) => {
                        formatted += `${hIndex + 1}. "${highlight.text}"\n`;
                    });
                    formatted += '\n';
                }
            });
        }

        return formatted;
    }
}

module.exports = ZakonOnlineService; 