const OpenAI = require('openai');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');

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
        'справа', 'дело', 'номер', 'список', 'найди', 'знайди', 'виведи'
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
        'судебные дела': 9
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
 * Process unknown command through OpenAI API
 * @param {string} command - The unknown command
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<string>} - AI response
 */
async function processUnknownCommand(command, isAdmin = false) {
    try {
        // Special handling for TCC (ТЦК) requests
        const lowerCommand = command.toLowerCase();
        if (lowerCommand.includes('тцк') || lowerCommand.includes('центр') && lowerCommand.includes('территориальный') || 
            lowerCommand.includes('комплектование') || lowerCommand.includes('армия')) {
            
            console.log('Processing TCC request:', command);
            return await processTCCRequest(command);
        }
        
        // Check if this is a request for court case numbers
        const isCourtCaseRequest = await detectCourtCaseNumbersRequest(command);
        if (isCourtCaseRequest) {
            console.log('Processing court case numbers request:', command);
            try {
                // Try Zakon Online API first
                const zakonToken = process.env.ZAKON_TOKEN;
                if (zakonToken && zakonToken !== 'DECxxxxxxxxx') {
                    try {
                        return await searchZakonOnlineAPI(command);
                    } catch (apiError) {
                        console.error('Zakon Online API error:', apiError);
                        // Fall back to OpenAI
                    }
                }
                
                // Fallback to OpenAI for court case numbers
                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
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
                            role: "user",
                            content: command
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                });

                const response = completion.choices[0].message.content;

                // Store the court case request in database
                db.run(`INSERT INTO openai_requests (request_type, prompt, response) VALUES (?, ?, ?)`, 
                    ['court_case_numbers_request', command, response], 
                    function(err) {
                        if (err) {
                            console.error('Error storing court case request:', err);
                        }
                    }
                );

                return response;
                
            } catch (error) {
                console.error('Court case numbers processing error:', error);
                return `Помилка обробки запиту про номера справ: ${error.message}`;
            }
        }
        
        // Detect if this is a legal request
        const legalDetection = detectLegalRequest(command);
        
        let systemPrompt = `You are a helpful AI assistant in a retro UNIX terminal environment. 
The user has entered a command that doesn't exist in the system. 
Provide a helpful response that explains what they might have meant or suggest alternatives.
Keep responses concise and in the style of a 1970s computer terminal.`;

        if (legalDetection.isLegal) {
            let responseLanguage = 'English';
            if (legalDetection.language === 'ru') responseLanguage = 'Russian';
            if (legalDetection.language === 'uk') responseLanguage = 'Ukrainian';
            
            systemPrompt = `You are a legal AI assistant. The user has asked a legal question.
Provide accurate legal information and guidance. Always recommend consulting with a qualified attorney for specific legal advice.
Respond in ${responseLanguage}.
Keep responses professional and informative.`;
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: command
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        });

        const response = completion.choices[0].message.content;

        // Store the request in database
        const requestType = legalDetection.isLegal ? 'legal_request' : 'unknown_command';
        db.run(`INSERT INTO openai_requests (request_type, prompt, response) VALUES (?, ?, ?)`, 
            [requestType, command, response], 
            function(err) {
                if (err) {
                    console.error('Error storing OpenAI request:', err);
                }
            }
        );

        return response;

    } catch (error) {
        console.error('OpenAI API error:', error);
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
                    return await searchZakonOnlineAPI(query);
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

module.exports = {
    detectLegalRequest,
    detectCourtCaseNumbersRequest,
    processUnknownCommand,
    searchLegalDatabase,
    extractSearchQueries,
    processTCCRequest
}; 