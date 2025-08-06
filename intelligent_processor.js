// Load environment variables
require('dotenv').config();

const OpenAI = require('openai');
const sqlite3 = require('sqlite3').verbose();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize SQLite database
const db = new sqlite3.Database('./terminal_data.db');

/**
 * Intelligent command processor that:
 * 1. First checks if it's a known command
 * 2. If not, uses AI to determine the type of request
 * 3. Routes to appropriate handler (legal, technical, general, etc.)
 */
class IntelligentProcessor {
    constructor() {
        this.knownCommands = new Set([
            'help', 'menu', 'visual', 'about', 'projects', 'contact', 'clear', 'date',
            'who', 'uname', 'ls', 'pwd', 'logout', 'ping', 'traceroute', 'nslookup',
            'netstat', 'whois', 'system', 'motd', 'matrix', 'show'
        ]);
        
        this.fullKnownCommands = new Set([
            'show api connections', 'show api con'
        ]);
    }

    /**
     * Check if command is a known system command
     */
    isKnownCommand(command) {
        const cleanCommand = command.trim().toLowerCase();
        
        // First check full command
        if (this.fullKnownCommands.has(cleanCommand)) {
            return true;
        }
        
        // Then check first word
        const firstWord = cleanCommand.split(' ')[0];
        return this.knownCommands.has(firstWord);
    }

    /**
     * Use AI to intelligently determine the type of request
     */
    async determineRequestType(query) {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are an intelligent request classifier. Analyze the user's query and determine its type.

Respond with ONLY one of these categories:
- LEGAL: Legal questions, court cases, legal advice, lawyer/attorney questions
- TECHNICAL: Technical questions, programming, system administration, IT
- GENERAL: General questions, information requests, help requests
- UNKNOWN: If you can't determine the category

Focus on Ukrainian and Russian legal terminology for legal classification.`
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
            return response;
        } catch (error) {
            console.error('Error determining request type:', error);
            return 'UNKNOWN';
        }
    }

    /**
     * Process legal requests through Zakon Online API
     */
    async processLegalRequest(query) {
        try {
            console.log('🔍 Processing legal request through Zakon Online API...');
            const zakonToken = process.env.ZAKON_TOKEN;
            
            if (zakonToken && zakonToken !== 'DECxxxxxxxxx') {
                try {
                    // Import the search function dynamically
                    const { searchZakonOnlineAPI } = require('./command_processor');
                    const result = await searchZakonOnlineAPI(query);
                    console.log('✅ Zakon Online API search successful');
                    return result;
                } catch (apiError) {
                    console.error('❌ Zakon Online API error:', apiError);
                    // Fall back to OpenAI
                }
            }
            
            // Fallback to OpenAI for legal advice
            console.log('🤖 Falling back to OpenAI for legal advice...');
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a Ukrainian legal AI assistant. Provide comprehensive legal advice including:
- Relevant Ukrainian laws and regulations
- Legal procedures and requirements
- Court precedents and case law
- Practical recommendations
- Relevant legal articles and codes

Respond in Ukrainian or Russian based on the user's language. Keep the response informative, professional, and legally accurate.`
                    },
                    {
                        role: "user",
                        content: query
                    }
                ],
                max_tokens: 1500,
                temperature: 0.3
            });

            const response = completion.choices[0].message.content;

            // Store in database
            db.run(`INSERT INTO openai_requests (request_type, prompt, response) VALUES (?, ?, ?)`, 
                ['legal_request', query, response], 
                function(err) {
                    if (err) {
                        console.error('Error storing legal request:', err);
                    }
                }
            );

            return response;
            
        } catch (error) {
            console.error('Legal request processing error:', error);
            return `Помилка обробки юридичного запиту: ${error.message}`;
        }
    }

    /**
     * Process technical requests
     */
    async processTechnicalRequest(query) {
        try {
            console.log('🔧 Processing technical request...');
            
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a technical AI assistant in a retro UNIX terminal environment. 
Provide helpful technical advice, programming help, or system administration guidance.
Keep responses concise and in the style of a 1970s computer terminal.`
                    },
                    {
                        role: "user",
                        content: query
                    }
                ],
                max_tokens: 800,
                temperature: 0.7
            });

            const response = completion.choices[0].message.content;

            // Store in database
            db.run(`INSERT INTO openai_requests (request_type, prompt, response) VALUES (?, ?, ?)`, 
                ['technical_request', query, response], 
                function(err) {
                    if (err) {
                        console.error('Error storing technical request:', err);
                    }
                }
            );

            return response;
            
        } catch (error) {
            console.error('Technical request processing error:', error);
            return `Error processing technical request: ${error.message}`;
        }
    }

    /**
     * Process general requests
     */
    async processGeneralRequest(query) {
        try {
            console.log('💬 Processing general request...');
            
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful AI assistant in a retro UNIX terminal environment. 
The user has asked a general question or requested information.
Provide a helpful response that explains what they might have meant or suggest alternatives.
Keep responses concise and in the style of a 1970s computer terminal.`
                    },
                    {
                        role: "user",
                        content: query
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            });

            const response = completion.choices[0].message.content;

            // Store in database
            db.run(`INSERT INTO openai_requests (request_type, prompt, response) VALUES (?, ?, ?)`, 
                ['general_request', query, response], 
                function(err) {
                    if (err) {
                        console.error('Error storing general request:', err);
                    }
                }
            );

            return response;
            
        } catch (error) {
            console.error('General request processing error:', error);
            return `Error processing request: ${error.message}`;
        }
    }

    /**
     * Main processing function
     */
    async processCommand(command, isAdmin = false) {
        console.log(`🤖 Intelligent processing: "${command}"`);
        
        // Step 1: Check if it's a known command
        if (this.isKnownCommand(command)) {
            console.log('✅ Known command detected - should be handled by existing command system');
            return null; // Let the existing command system handle it
        }
        
        // Step 2: Use AI to determine request type
        console.log('🔍 Determining request type with AI...');
        const requestType = await this.determineRequestType(command);
        console.log(`📋 Request type: ${requestType}`);
        
        // Step 3: Route to appropriate handler
        switch (requestType) {
            case 'LEGAL':
                return await this.processLegalRequest(command);
                
            case 'TECHNICAL':
                return await this.processTechnicalRequest(command);
                
            case 'GENERAL':
                return await this.processGeneralRequest(command);
                
            default:
                return await this.processGeneralRequest(command);
        }
    }
}

module.exports = { IntelligentProcessor }; 