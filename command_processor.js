const OpenAI = require('openai');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const EmulationManager = require('./Emulation/emulation_manager');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize SQLite database
const db = new sqlite3.Database('./terminal_data.db');

// Legal request detection keywords and patterns
const LEGAL_KEYWORDS = {
    uk: [
        'закон', 'право', 'юридичний', 'адвокат', 'суд', 'позов', 'договір', 'угода',
        'законодавство', 'нормативний', 'правовий', 'юрист', 'консультація',
        'відповідальність', 'порушення', 'штраф', 'ліцензія', 'патент', 'авторське право',
        'спадщина', 'розлучення', 'аліменти', 'нерухомість', 'реєстрація', 'громадянство',
        'оформити', 'отримати', 'подати', 'заяву', 'документи', 'нотаріус',
        'свідоцтво', 'власність', 'майно', 'борг', 'кредит', 'страховка',
        'житло', 'мешканець', 'приватизація', 'реєстрація місця проживання',
        'судова практика', 'судебна практика', 'юридична практика',
        'тцк', 'центр', 'территориальний', 'комплектування', 'армія', 'військовий',
        'справа', 'дело', 'номер', 'список', 'найди', 'знайди', 'виведи',
        'власник житла', 'колишній мешканець', 'ситуація', 'не проживає',
        'участі не брав', 'повторно зареєструвати', 'місце проживання',
        'надати судову практику', 'прошу надати', 'юридична ситуація',
        'жилье', 'жилищный', 'жилищное', 'жилищная', 'жилищные',
        'выселение', 'выселить', 'выселяют', 'выселили',
        'освобождение', 'освободить', 'освобождают', 'освободили',
        'регистрация', 'прописка', 'прописать', 'прописывают',
        'собственник', 'собственность', 'собственник жилья',
        'бывший жилец', 'бывший житель', 'бывший квартирант',
        'не проживает', 'не живет', 'не обитает',
        'приватизация', 'приватизировать', 'приватизировали',
        'участие не принимал', 'участия не принимал',
        'хочет зарегистрироваться', 'хочет прописаться',
        'повторная регистрация', 'повторно зарегистрироваться'
    ],
    ru: [
        'закон', 'право', 'юридический', 'адвокат', 'суд', 'иск', 'договор', 'соглашение',
        'законодательство', 'нормативный', 'правовой', 'юрист', 'консультация',
        'ответственность', 'нарушение', 'штраф', 'лицензия', 'патент', 'авторское право',
        'наследство', 'развод', 'алименты', 'недвижимость', 'регистрация', 'гражданство',
        'оформить', 'получить', 'подать', 'заявление', 'документы', 'нотариус',
        'свидетельство', 'собственность', 'имущество', 'долг', 'кредит', 'страховка',
        'тцк', 'центр', 'территориальный', 'комплектование', 'армия', 'военный',
        'дело', 'номер', 'список', 'найди', 'найти', 'выведи'
    ],
    en: [
        'law', 'legal', 'attorney', 'lawyer', 'court', 'case', 'contract', 'agreement',
        'legislation', 'regulation', 'legal advice', 'consultation', 'liability',
        'violation', 'fine', 'license', 'patent', 'copyright', 'inheritance',
        'divorce', 'alimony', 'real estate', 'registration', 'citizenship',
        'file', 'apply', 'document', 'notary', 'certificate', 'property',
        'debt', 'credit', 'insurance'
    ]
};

// Legal request detection patterns
const LEGAL_PATTERNS = {
    uk: [
        /(?:питання|консультація|допомога).*(?:щодо|про|стосовно).*(?:закон|право|юридичний)/i,
        /(?:як|що|де).*(?:закон|право|юридичний)/i,
        /(?:потрібна|потрібна).*(?:юридична|правова).*(?:консультація|допомога)/i,
        /(?:адвокат|юрист).*(?:ситуація|випадок)/i,
        /(?:прошу|запитую).*(?:надати|надати).*(?:судову практику|юридичну практику)/i
    ],
    ru: [
        /(?:вопрос|консультация|помощь).*(?:по|о|насчет).*(?:закон|право|юридический)/i,
        /(?:как|что|где).*(?:закон|право|юридический)/i,
        /(?:требуется|нужна).*(?:юридическая|правовая).*(?:консультация|помощь)/i
    ],
    en: [
        /(?:question|consultation|help).*(?:regarding|about|concerning).*(?:law|legal)/i,
        /(?:how|what|where).*(?:law|legal)/i,
        /(?:need|require).*(?:legal|legal).*(?:advice|consultation|help)/i
    ]
};

/**
 * Intelligent extraction of search queries from Ukrainian legal text
 * @param {string} text - Ukrainian legal text
 * @returns {Array} - Array of 2-3 most relevant search queries
 */
function extractSearchQueries(text) {
    // Ukrainian legal keywords with weights
    const ukrainianKeywords = {
        'житло': 10,
        'мешканець': 9,
        'приватизація': 8,
        'реєстрація місця проживання': 10,
        'власник': 8,
        'колишній мешканець': 9,
        'виселення': 8,
        'звільнення житла': 9,
        'право власності': 7,
        'договір оренди': 7,
        'судова практика': 6,
        'юридична практика': 6,
        'адвокат': 5,
        'юрист': 5,
        'позов': 6,
        'суд': 5,
        'нерухомість': 7,
        'квартира': 6,
        'будинок': 6,
        'проживання': 7,
        'прописка': 8,
        'реєстрація': 7,
        'зареєструвати': 8,
        'зареєструвати місце проживання': 10,
        'повторно зареєструвати': 9,
        'не проживає': 8,
        'участі не брав': 7,
        'комунальні послуги': 6,
        'платить': 5,
        'не платить': 8,
        'хочеться виселити': 9,
        'захистити права': 7,
        'права власника': 8,
        'приватний будинок': 7,
        'юридична допомога': 6,
        'консультація': 5,
        'ситуація': 4,
        'надати': 3,
        'прошу': 3,
        'номера справ': 10,
        'номера дел': 10,
        'справи': 8,
        'дела': 8,
        'номер справи': 9,
        'номер дела': 9,
        'судові справи': 9,
        'судебные дела': 9,
        // Дополнительные ключевые слова для жилищных вопросов
        'власник житла': 10,
        'власник жилья': 10,
        'собственник жилья': 10,
        'собственник жилплощади': 10,
        'бывший жилец': 9,
        'бывший житель': 9,
        'бывший квартирант': 9,
        'не проживает': 8,
        'не живет': 8,
        'не обитает': 8,
        'давно не проживает': 9,
        'давно не живет': 9,
        'участие не принимал': 7,
        'участия не принимал': 7,
        'в приватизации не участвовал': 8,
        'приватизации не участвовал': 8,
        'хочет зарегистрироваться': 9,
        'хочет прописаться': 9,
        'повторная регистрация': 9,
        'повторно зарегистрироваться': 9,
        'место проживания': 8,
        'место жительства': 8,
        'надати судову практику': 6,
        'надати юридичну практику': 6,
        'прошу надати': 4,
        'юридична ситуація': 5,
        'жилищный вопрос': 8,
        'жилищная проблема': 8,
        'жилищное право': 8,
        'выселение жильца': 9,
        'выселение бывшего жильца': 10,
        'освобождение жилплощади': 9,
        'регистрация по месту жительства': 10,
        'прописка по месту жительства': 10,
        'право собственности на жилье': 9,
        'защита прав собственника': 8,
        'жилищное законодательство': 7,
        'жилищный кодекс': 7,
        'судовая практика по жилищным вопросам': 9,
        'судебная практика по жилищным спорам': 9
    };

    // Extract key phrases from text
    const phrases = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Look for 2-3 word combinations
    for (let i = 0; i < words.length - 1; i++) {
        const twoWord = `${words[i]} ${words[i + 1]}`;
        const threeWord = i < words.length - 2 ? `${words[i]} ${words[i + 1]} ${words[i + 2]}` : '';
        
        if (ukrainianKeywords[threeWord]) {
            phrases.push({ phrase: threeWord, weight: ukrainianKeywords[threeWord] });
        }
        if (ukrainianKeywords[twoWord]) {
            phrases.push({ phrase: twoWord, weight: ukrainianKeywords[twoWord] });
        }
    }
    
    // Look for single important words
    words.forEach(word => {
        if (ukrainianKeywords[word]) {
            phrases.push({ phrase: word, weight: ukrainianKeywords[word] });
        }
    });
    
    // Sort by weight and take top 3 unique phrases
    const uniquePhrases = [];
    const seen = new Set();
    
    phrases
        .sort((a, b) => b.weight - a.weight)
        .forEach(item => {
            if (!seen.has(item.phrase) && uniquePhrases.length < 3) {
                uniquePhrases.push(item.phrase);
                seen.add(item.phrase);
            }
        });
    
    return uniquePhrases;
}

/**
 * Detect if a request is about court case numbers using AI
 * @param {string} query - The user query
 * @returns {Promise<boolean>} - Whether the query is about court case numbers
 */
async function detectCourtCaseNumbersRequest(query) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a Ukrainian legal assistant. Your task is to determine if a user query is asking for court case numbers or legal case references.

Analyze the query and respond with ONLY "YES" if the user is asking for:
- Court case numbers
- Legal case references
- Case numbers
- Court decisions
- Legal precedents
- Case law references

Respond with ONLY "NO" if the user is asking for:
- General legal advice
- Legal procedures
- Legal documents
- Legal consultations
- General legal information

Focus on Ukrainian and Russian legal terminology.`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            max_tokens: 10,
            temperature: 0.1
        });

        const response = completion.choices[0].message.content.trim().toUpperCase();
        return response === 'YES';
        
    } catch (error) {
        console.error('Error detecting court case numbers request:', error);
        return false;
    }
}

/**
 * Detect if a request is legal-related
 * @param {string} query - The user query
 * @returns {Object} - Detection result with confidence and language
 */
function detectLegalRequest(query) {
    const lowerQuery = query.toLowerCase();
    let maxConfidence = 0;
    let detectedLanguage = null;
    
    // Check for legal keywords
    for (const [lang, keywords] of Object.entries(LEGAL_KEYWORDS)) {
        let keywordMatches = 0;
        for (const keyword of keywords) {
            if (lowerQuery.includes(keyword.toLowerCase())) {
                keywordMatches++;
            }
        }
        
        const keywordConfidence = keywordMatches / keywords.length;
        
        // Check for legal patterns
        let patternMatches = 0;
        const patterns = LEGAL_PATTERNS[lang] || [];
        for (const pattern of patterns) {
            if (pattern.test(query)) {
                patternMatches++;
            }
        }
        
        const patternConfidence = patterns.length > 0 ? patternMatches / patterns.length : 0;
        
        // Combined confidence
        const confidence = (keywordConfidence * 0.7) + (patternConfidence * 0.3);
        
        if (confidence > maxConfidence) {
            maxConfidence = confidence;
            detectedLanguage = lang;
        }
    }
    
    // Lower threshold for better detection
    const isLegal = maxConfidence > 0.1 || 
                   (lowerQuery.includes('наследство') || lowerQuery.includes('inheritance')) ||
                   (lowerQuery.includes('оформить') && (lowerQuery.includes('документ') || lowerQuery.includes('заявление'))) ||
                   (lowerQuery.includes('file') && (lowerQuery.includes('document') || lowerQuery.includes('application')));
    
    return {
        isLegal: isLegal,
        confidence: maxConfidence,
        language: detectedLanguage
    };
}

/**
 * Process unknown command through intelligent AI system
 * @param {string} command - The unknown command
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<string>} - AI response
 */
async function processUnknownCommand(command, isAdmin = false) {
    try {
        // Check for run command first
        if (command.trim().toLowerCase().startsWith('run ')) {
            console.log('Processing run command:', command);
            try {
                const result = await processRunCommand(command);
                console.log('Run command result length:', result ? result.length : 0);
                return result;
            } catch (runError) {
                console.error('Run command error:', runError);
                return `Error in run command: ${runError.message}`;
            }
        }
        
        // Import intelligent processor
        const { IntelligentProcessor } = require('./intelligent_processor');
        const processor = new IntelligentProcessor();
        
        // Use intelligent processing
        const result = await processor.processCommand(command, isAdmin);
        
        // If result is null, it means it's a known command that should be handled by existing system
        if (result === null) {
            return `Command "${command}" should be handled by the existing command system.`;
        }
        
        return result;

    } catch (error) {
        console.error('Intelligent processing error:', error);
        return `Error processing command: ${error.message}`;
    }
}

/**
 * Search legal database using API
 * @param {string} query - Legal query
 * @param {string} language - Language (ru/en)
 * @returns {Promise<string>} - Legal information
 */
async function searchLegalDatabase(query, language = 'ru') {
    try {
        // Check if we have Zakon token
        const zakonToken = process.env.ZAKON_TOKEN;
        
        if (zakonToken && zakonToken !== 'DECxxxxxxxxx') {
            // Use Zakon Online API for Ukrainian legal queries
            if (language === 'uk' || language === 'ru') {
                try {
                    // Инициализируем сервис "Закон Онлайн"
                    const ZakonOnlineService = require('./src/services/zakonOnlineService');
                    const zakonService = new ZakonOnlineService();
                    await zakonService.initialize();
                    
                    // Выполняем поиск с сохранением в базу данных
                    const searchResults = await zakonService.performFullSearch(query, {
                        page: 1,
                        pageSize: 10,
                        saveToDatabase: true
                    });
                    
                    // Форматируем результаты для отображения
                    return zakonService.formatSearchResults(searchResults);
                    
                } catch (apiError) {
                    console.error('Zakon Online API error:', apiError);
                    // Fall back to OpenAI if API fails
                }
            }
        }

        // Fallback to OpenAI for legal database simulation
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a legal database search assistant. 
Search for relevant legal information based on the user's query.
Provide accurate legal references and information.
Respond in ${language === 'ru' ? 'Russian' : 'English'}.`
                },
                {
                    role: "user",
                    content: `Search legal database for: ${query}`
                }
            ],
            max_tokens: 800,
            temperature: 0.3
        });

        const response = completion.choices[0].message.content;

        // Store legal search in database
        db.run(`INSERT INTO openai_requests (request_type, prompt, response) VALUES (?, ?, ?)`, 
            ['legal_database_search', query, response], 
            function(err) {
                if (err) {
                    console.error('Error storing legal search:', err);
                }
            }
        );

        return response;

    } catch (error) {
        console.error('Legal database search error:', error);
        return `Error searching legal database: ${error.message}`;
    }
}

/**
 * Search using Zakon Online API with intelligent query extraction
 * @param {string} query - Original Ukrainian legal query
 * @returns {Promise<string>} - Formatted legal information
 */
async function searchZakonOnlineAPI(query) {
    const zakonToken = process.env.ZAKON_TOKEN;
    const baseUrl = 'https://court.searcher.api.zakononline.com.ua/api';
    
    try {
        // Extract search queries from Ukrainian legal text
        const searchQueries = extractSearchQueries(query);
        
        if (searchQueries.length === 0) {
            return `Не вдалося витягти пошукові запити з вашого запиту. Спробуйте переформулювати запит.`;
        }
        
        // Combine queries with logical AND operator
        const combinedQuery = searchQueries.join(' AND ');
        
        console.log(`Extracted queries: ${searchQueries.join(', ')}`);
        console.log(`Combined query: ${combinedQuery}`);
        
        // Step 1: Get metadata (first 5 results)
        const metadataUrl = `${baseUrl}/Searcher/GetEntitiesMetaWith?searchText=${encodeURIComponent(combinedQuery)}&page=1&pageSize=5`;
        
        const metadataResponse = await fetch(metadataUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${zakonToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!metadataResponse.ok) {
            throw new Error(`Metadata request failed: ${metadataResponse.status}`);
        }

        const metadata = await metadataResponse.json();
        
        if (!metadata.items || metadata.items.length === 0) {
            return `За вашим запитом "${combinedQuery}" не знайдено судових рішень. Спробуйте змінити пошукові терміни.`;
        }

        // Step 2: Get full text for the first result
        const firstResult = metadata.items[0];
        const fullTextUrl = `${baseUrl}/Searcher/GetSearchText?id=${firstResult.id}&searchText=${encodeURIComponent(combinedQuery)}`;
        
        const fullTextResponse = await fetch(fullTextUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${zakonToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!fullTextResponse.ok) {
            throw new Error(`Full text request failed: ${fullTextResponse.status}`);
        }

        const fullTextData = await fullTextResponse.json();

        // Store the complete search in database
        const searchData = {
            originalQuery: query,
            extractedQueries: searchQueries,
            combinedQuery: combinedQuery,
            metadata: metadata,
            fullText: fullTextData
        };

        db.run(`INSERT INTO openai_requests (request_type, prompt, response) VALUES (?, ?, ?)`, 
            ['zakon_online_search', query, JSON.stringify(searchData)], 
            function(err) {
                if (err) {
                    console.error('Error storing legal search:', err);
                }
            }
        );

        return formatZakonOnlineResponse(metadata, fullTextData, combinedQuery, searchQueries);

    } catch (error) {
        console.error('Zakon Online API search error:', error);
        throw error;
    }
}

/**
 * Format Zakon Online API response
 * @param {Object} metadata - Metadata from first API call
 * @param {Object} fullTextData - Full text data from second API call
 * @param {string} combinedQuery - Combined search query
 * @param {Array} extractedQueries - Original extracted queries
 * @returns {string} - Formatted response
 */
function formatZakonOnlineResponse(metadata, fullTextData, combinedQuery, extractedQueries) {
    if (!metadata || !metadata.items || metadata.items.length === 0) {
        return `За вашим запитом "${combinedQuery}" не знайдено судових рішень.`;
    }

    let formattedResponse = `Знайдено ${metadata.totalCount} судових рішень за запитом "${combinedQuery}":\n\n`;
    
    // Show extracted queries
    formattedResponse += `📋 Витягнуті пошукові запити:\n`;
    extractedQueries.forEach((query, index) => {
        formattedResponse += `${index + 1}. "${query}"\n`;
    });
    formattedResponse += `\n🔍 Комбінований запит: "${combinedQuery}"\n\n`;
    
    // Show metadata for all found items
    formattedResponse += `📄 Знайдені судові рішення:\n\n`;
    metadata.items.forEach((item, index) => {
        formattedResponse += `${index + 1}. ${item.courtName || 'Суд'}\n`;
        if (item.judgmentForm) {
            formattedResponse += `   Форма: ${item.judgmentForm}\n`;
        }
        if (item.date) {
            formattedResponse += `   Дата: ${item.date}\n`;
        }
        if (item.number) {
            formattedResponse += `   Номер: ${item.number}\n`;
        }
        if (item.summary) {
            formattedResponse += `   Опис: ${item.summary}\n`;
        }
        formattedResponse += '\n';
    });

    // Add full text of the first result if available
    if (fullTextData && fullTextData.fullText) {
        formattedResponse += `\n=== ПОВНИЙ ТЕКСТ ПЕРШОГО РІШЕННЯ ===\n\n`;
        
        // Truncate if too long
        const maxLength = 2000;
        let fullText = fullTextData.fullText;
        if (fullText.length > maxLength) {
            fullText = fullText.substring(0, maxLength) + '...\n\n[Текст обрізано для стислості]';
        }
        
        formattedResponse += fullText;
        
        // Add highlights if available
        if (fullTextData.highlights && fullTextData.highlights.length > 0) {
            formattedResponse += `\n\n=== ВИДІЛЕНІ КЛЮЧОВІ СЛОВА ===\n`;
            fullTextData.highlights.forEach((highlight, index) => {
                if (index < 5) { // Show only first 5 highlights
                    formattedResponse += `\n${index + 1}. "${highlight.text}"`;
                }
            });
        }
    }

    return formattedResponse;
}

/**
 * Process TCC (ТЦК) related requests
 * @param {string} command - The TCC command
 * @returns {Promise<string>} - TCC response
 */
async function processTCCRequest(command) {
    try {
        console.log('Processing TCC request with command:', command);
        const lowerCommand = command.toLowerCase();
        
        // Check if it's a request for TCC cases
        if (lowerCommand.includes('найди') || lowerCommand.includes('найти') || 
            lowerCommand.includes('список') || lowerCommand.includes('дело') || 
            lowerCommand.includes('номер')) {
            
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
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
                        role: "user",
                        content: command
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            });

            const response = completion.choices[0].message.content;

            // Store the TCC request in database
            db.run(`INSERT INTO openai_requests (request_type, prompt, response) VALUES (?, ?, ?)`, 
                ['tcc_request', command, response], 
                function(err) {
                    if (err) {
                        console.error('Error storing TCC request:', err);
                    }
                }
            );

            return response;
        }
        
        // Default TCC response
        return `ТЦК (Территориальные центры комплектования) - это военные учреждения, отвечающие за призыв и комплектование вооруженных сил.
Для получения информации о конкретных делах, связанных с ТЦК, используйте команду с ключевыми словами "найди", "список", "дело" или "номер".`;
        
    } catch (error) {
        console.error('TCC request processing error:', error);
        return `Ошибка обработки запроса ТЦК: ${error.message}`;
    }
}

/**
 * Show API connections information
 * @returns {string} - Formatted API connections information
 */
function showApiConnections() {
    const connections = [];
    
    // Check OpenAI API
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && openaiKey !== '') {
        const openaiStatus = openaiKey.startsWith('sk-') ? '✅ Active' : '❌ Invalid';
        connections.push({
            name: 'OpenAI API',
            description: 'Artificial Intelligence and Language Processing',
            status: openaiStatus,
            key: openaiKey.substring(0, 20) + '...',
            usage: 'Legal request detection, AI command processing, intelligent responses'
        });
    } else {
        connections.push({
            name: 'OpenAI API',
            description: 'Artificial Intelligence and Language Processing',
            status: '❌ Not configured',
            key: 'Not set',
            usage: 'Legal request detection, AI command processing, intelligent responses'
        });
    }
    
    // Check Zakon Online API
    const zakonToken = process.env.ZAKON_TOKEN;
    if (zakonToken && zakonToken !== '' && zakonToken !== 'DECxxxxxxxxx') {
        connections.push({
            name: 'Zakon Online API',
            description: 'Ukrainian Legal Database and Court Decisions',
            status: '✅ Active',
            key: zakonToken.substring(0, 20) + '...',
            usage: 'Legal database searches, court case lookups, Ukrainian legal information'
        });
    } else {
        connections.push({
            name: 'Zakon Online API',
            description: 'Ukrainian Legal Database and Court Decisions',
            status: '❌ Not configured',
            key: 'Not set or using default',
            usage: 'Legal database searches, court case lookups, Ukrainian legal information'
        });
    }
    
    // Check Anthropic API
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey && anthropicKey !== '') {
        const anthropicStatus = anthropicKey.startsWith('sk-ant-') ? '✅ Active' : '❌ Invalid';
        connections.push({
            name: 'Anthropic API',
            description: 'Claude AI Assistant',
            status: anthropicStatus,
            key: anthropicKey.substring(0, 20) + '...',
            usage: 'Alternative AI processing, Claude responses'
        });
    }
    
    // Check Hugging Face API
    const hfToken = process.env.HF_TOKEN;
    if (hfToken && hfToken !== '') {
        connections.push({
            name: 'Hugging Face API',
            description: 'Machine Learning Models and AI Services',
            status: '✅ Active',
            key: hfToken.substring(0, 20) + '...',
            usage: 'ML model inference, text processing'
        });
    }
    
    // Check Hybrid API
    const hybridKey = process.env.HYBRID_API_KEY;
    if (hybridKey && hybridKey !== '') {
        connections.push({
            name: 'Hybrid API',
            description: 'Hybrid AI Services',
            status: '✅ Active',
            key: hybridKey.substring(0, 20) + '...',
            usage: 'Hybrid AI processing, multiple model support'
        });
    }
    
    // Format output
    let output = `🔌 EXTERNAL API CONNECTIONS\n`;
    output += `================================\n\n`;
    
    connections.forEach((conn, index) => {
        output += `${index + 1}. ${conn.name}\n`;
        output += `   Description: ${conn.description}\n`;
        output += `   Status: ${conn.status}\n`;
        output += `   Key: ${conn.key}\n`;
        output += `   Usage: ${conn.usage}\n`;
        output += `\n`;
    });
    
    output += `📊 SUMMARY:\n`;
    const activeConnections = connections.filter(c => c.status.includes('✅')).length;
    const totalConnections = connections.length;
    output += `   Active: ${activeConnections}/${totalConnections}\n`;
    output += `   Primary: OpenAI API (${connections.find(c => c.name === 'OpenAI API')?.status || 'Unknown'})\n`;
    output += `   Legal: Zakon Online API (${connections.find(c => c.name === 'Zakon Online API')?.status || 'Unknown'})\n`;
    
    return output;
}

/**
 * Показывает статистику поисков "Закон Онлайн"
 * @returns {Promise<string>} - Статистика поисков
 */
async function showZakonOnlineStats() {
    try {
        const databaseManager = require('./src/modules/database');
        const stats = await databaseManager.getZakonOnlineStats();
        
        let output = `📊 СТАТИСТИКА ПОШУКІВ "ЗАКОН ОНЛАЙН"\n`;
        output += `==========================================\n\n`;
        
        if (stats.total_searches > 0) {
            output += `🔍 Всього пошуків: ${stats.total_searches}\n`;
            output += `📄 Знайдено справ: ${stats.total_cases_found || 0}\n`;
            output += `📈 Середньо справ на пошук: ${Math.round(stats.avg_cases_per_search || 0)}\n`;
            output += `📅 Останній пошук: ${stats.last_search_date || 'Немає'}\n\n`;
            
            if (stats.recentSearches && stats.recentSearches.length > 0) {
                output += `🕒 ОСТАННІ ПОШУКИ:\n`;
                output += `----------------------------------------\n`;
                stats.recentSearches.forEach((search, index) => {
                    output += `${index + 1}. "${search.query}"\n`;
                    output += `   Знайдено: ${search.total_count} справ\n`;
                    output += `   Дата: ${search.created_at}\n\n`;
                });
            }
        } else {
            output += `📭 Поки що не було виконано жодного пошуку.\n`;
            output += `💡 Спробуйте виконати пошук за юридичними питаннями.\n\n`;
        }
        
        return output;
    } catch (error) {
        console.error('Error showing Zakon Online stats:', error);
        return `Помилка отримання статистики: ${error.message}`;
    }
}

/**
 * Показывает историю поисков "Закон Онлайн"
 * @param {number} limit - Количество записей
 * @returns {Promise<string>} - История поисков
 */
async function showZakonOnlineHistory(limit = 10) {
    try {
        const ZakonOnlineService = require('./src/services/zakonOnlineService');
        const zakonService = new ZakonOnlineService();
        await zakonService.initialize();
        
        const history = await zakonService.getSearchHistory(limit);
        
        let output = `📋 ІСТОРІЯ ПОШУКІВ "ЗАКОН ОНЛАЙН"\n`;
        output += `==========================================\n\n`;
        
        if (history && history.length > 0) {
            history.forEach((search, index) => {
                output += `${index + 1}. "${search.query}"\n`;
                output += `   📊 Знайдено: ${search.total_count} справ\n`;
                output += `   📄 Показано: ${search.cases_found} справ\n`;
                output += `   📅 Дата: ${search.created_at}\n\n`;
            });
        } else {
            output += `📭 Історія пошуків порожня.\n`;
            output += `💡 Виконайте пошук для створення історії.\n\n`;
        }
        
        return output;
    } catch (error) {
        console.error('Error showing Zakon Online history:', error);
        return `Помилка отримання історії: ${error.message}`;
    }
}

/**
 * Показывает топ поисковых запросов
 * @param {number} limit - Количество записей
 * @returns {Promise<string>} - Топ запросов
 */
async function showTopSearches(limit = 10) {
    try {
        const databaseManager = require('./src/modules/database');
        const topSearches = await databaseManager.getTopSearches(limit);
        
        let output = `🏆 ТОП ПОШУКОВИХ ЗАПИТІВ\n`;
        output += `==========================================\n\n`;
        
        if (topSearches && topSearches.length > 0) {
            topSearches.forEach((search, index) => {
                output += `${index + 1}. "${search.query}"\n`;
                output += `   🔍 Використано: ${search.search_count} разів\n`;
                output += `   📈 Середньо результатів: ${Math.round(search.avg_results || 0)}\n`;
                output += `   📅 Останнє використання: ${search.last_used}\n\n`;
            });
        } else {
            output += `📭 Немає даних для відображення.\n`;
            output += `💡 Виконайте пошуки для створення статистики.\n\n`;
        }
        
        return output;
    } catch (error) {
        console.error('Error showing top searches:', error);
        return `Помилка отримання топу запитів: ${error.message}`;
    }
}

// Initialize emulation manager
const emulationManager = new EmulationManager();

/**
 * Process run command for emulation modules
 * @param {string} command - Full command string
 * @returns {Promise<string>} - Command result
 */
async function processRunCommand(command) {
    console.log('processRunCommand called with:', command);
    
    const parts = command.trim().split(/\s+/);
    console.log('Command parts:', parts);
    
    if (parts.length < 2) {
        return `Usage: run <emulator> [options]\nAvailable emulators: asm, pascal\nUse "run help" for more information.`;
    }
    
    const subCommand = parts[1].toLowerCase();
    console.log('Subcommand:', subCommand);
    
    try {
        switch (subCommand) {
            case 'asm':
            case 'assembler':
                console.log('Processing assembler command');
                return processAssemblerCommand(parts.slice(2));
            
            case 'pascal':
            case 'turbopascal':
            case 'tp':
                console.log('Processing pascal command');
                return processPascalCommand(parts.slice(2));
            
            case 'list':
                console.log('Processing list command');
                return processListCommand();
            
            case 'help':
                console.log('Processing help command');
                return processHelpCommand(parts.slice(2));
            
            default:
                console.log('Unknown subcommand:', subCommand);
                return `Unknown emulator: ${subCommand}\nAvailable emulators: asm, pascal\nUse "run help" for more information.`;
        }
    } catch (error) {
        console.error('Error in processRunCommand:', error);
        return `Error processing run command: ${error.message}`;
    }
}

/**
 * Process assembler commands
 * @param {Array} args - Command arguments
 * @returns {string} - Command result
 */
function processAssemblerCommand(args) {
    if (args.length === 0) {
        // Initialize assembler
        const result = emulationManager.initializeEmulator('asm');
        return result.success ? result.header : result.message;
    }
    
    const action = args[0].toLowerCase();
    
    switch (action) {
        case 'help':
            const helpResult = emulationManager.getHelp('asm');
            return `${helpResult.message}\n\n${helpResult.help}`;
        
        case 'sample':
            if (args.length < 2) {
                return 'Usage: run asm sample <type>\nAvailable types: hello, add';
            }
            const sampleResult = emulationManager.createSample('asm', args[1]);
            return sampleResult.success ? 
                `${sampleResult.message}\n\nSource code:\n${sampleResult.sourceCode}` : 
                sampleResult.message;
        
        case 'compile':
            if (args.length < 2) {
                return 'Usage: run asm compile <filename>';
            }
            const loadResult = emulationManager.loadFile(args[1]);
            if (!loadResult.success) {
                return loadResult.message;
            }
            const compileResult = emulationManager.compile(loadResult.sourceCode);
            return compileResult.display;
        
        case 'execute':
            if (args.length < 2) {
                return 'Usage: run asm execute <filename>';
            }
            const loadResult2 = emulationManager.loadFile(args[1]);
            if (!loadResult2.success) {
                return loadResult2.message;
            }
            const compileResult2 = emulationManager.compile(loadResult2.sourceCode);
            if (!compileResult2.success) {
                return compileResult2.display;
            }
            const executeResult = emulationManager.execute();
            return executeResult.display;
        
        default:
            // Assume it's a filename - load, compile and execute
            const loadResult3 = emulationManager.loadFile(args[0]);
            if (!loadResult3.success) {
                return loadResult3.message;
            }
            const fullResult = emulationManager.compileAndExecute(loadResult3.sourceCode);
            return fullResult.display;
    }
}

/**
 * Process Pascal commands
 * @param {Array} args - Command arguments
 * @returns {string} - Command result
 */
function processPascalCommand(args) {
    if (args.length === 0) {
        // Initialize Pascal
        const result = emulationManager.initializeEmulator('pascal');
        return result.success ? result.header : result.message;
    }
    
    const action = args[0].toLowerCase();
    
    switch (action) {
        case 'help':
            const helpResult = emulationManager.getHelp('pascal');
            return `${helpResult.message}\n\n${helpResult.help}`;
        
        case 'sample':
            if (args.length < 2) {
                return 'Usage: run pascal sample <type>\nAvailable types: hello, factorial, calculator';
            }
            const sampleResult = emulationManager.createSample('pascal', args[1]);
            return sampleResult.success ? 
                `${sampleResult.message}\n\nSource code:\n${sampleResult.sourceCode}` : 
                sampleResult.message;
        
        case 'compile':
            if (args.length < 2) {
                return 'Usage: run pascal compile <filename>';
            }
            const loadResult = emulationManager.loadFile(args[1]);
            if (!loadResult.success) {
                return loadResult.message;
            }
            const compileResult = emulationManager.compile(loadResult.sourceCode);
            return compileResult.display;
        
        case 'execute':
            if (args.length < 2) {
                return 'Usage: run pascal execute <filename>';
            }
            const loadResult2 = emulationManager.loadFile(args[1]);
            if (!loadResult2.success) {
                return loadResult2.message;
            }
            const compileResult2 = emulationManager.compile(loadResult2.sourceCode);
            if (!compileResult2.success) {
                return compileResult2.display;
            }
            const executeResult = emulationManager.execute();
            return executeResult.display;
        
        default:
            // Assume it's a filename - load, compile and execute
            const loadResult3 = emulationManager.loadFile(args[0]);
            if (!loadResult3.success) {
                return loadResult3.message;
            }
            const fullResult = emulationManager.compileAndExecute(loadResult3.sourceCode);
            return fullResult.display;
    }
}

/**
 * Process list command
 * @returns {string} - Command result
 */
function processListCommand() {
    const result = emulationManager.listFiles();
    if (!result.success) {
        return result.message;
    }
    
    let output = '📁 WORKSPACE FILES\n';
    output += '==========================================\n\n';
    
    if (result.files.length === 0) {
        output += 'No files found in workspace.\n';
        output += 'Use "run asm sample hello" or "run pascal sample hello" to create sample programs.\n';
    } else {
        result.files.forEach(file => {
            output += `${file.name} (${file.size} bytes, ${file.type})\n`;
        });
    }
    
    return output;
}

/**
 * Process help command
 * @param {Array} args - Help arguments
 * @returns {string} - Command result
 */
function processHelpCommand(args) {
    if (args.length === 0) {
        const helpResult = emulationManager.getHelp();
        return `${helpResult.message}\n\n${helpResult.help}`;
    }
    
    const emulatorType = args[0].toLowerCase();
    const helpResult = emulationManager.getHelp(emulatorType);
    return `${helpResult.message}\n\n${helpResult.help}`;
}

module.exports = {
    detectLegalRequest,
    detectCourtCaseNumbersRequest,
    processUnknownCommand,
    searchLegalDatabase,
    extractSearchQueries,
    processTCCRequest,
    showApiConnections,
    showZakonOnlineStats,
    showZakonOnlineHistory,
    showTopSearches,
    processRunCommand
}; 