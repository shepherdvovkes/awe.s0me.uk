const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');

// Initialize SQLite database
const db = new sqlite3.Database('./terminal_data.db');

// Check if AI is disabled
const DISABLE_AI = process.env.DISABLE_AI === 'true';

// Initialize OpenAI client only if AI is enabled
let openai = null;
if (!DISABLE_AI && process.env.OPENAI_API_KEY) {
    try {
        const OpenAI = require('openai');
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    } catch (error) {
        console.log('OpenAI not available:', error.message);
    }
}

// Emulation manager (simplified for Docker)
const EmulationManager = {
    runAssembler: (code) => {
        return `Assembler simulation (Docker mode):
Code: ${code}
Status: Compiled successfully
Output: Hello from Docker!`;
    },
    
    runPascal: (code) => {
        return `Pascal simulation (Docker mode):
Code: ${code}
Status: Compiled successfully
Output: Hello from Docker!`;
    },
    
    listPrograms: () => {
        return `Available programs (Docker mode):
- hello.asm (Assembly)
- hello.pas (Pascal)
- matrix.asm (Matrix effect)
- oscilloscope.pas (Oscilloscope)`;
    }
};

// Legal request detection keywords and patterns (simplified)
const LEGAL_KEYWORDS = {
    uk: ['закон', 'право', 'юридичний', 'адвокат', 'суд'],
    ru: ['закон', 'право', 'юридический', 'адвокат', 'суд'],
    en: ['law', 'legal', 'attorney', 'lawyer', 'court']
};

function detectLegalRequest(query) {
    const lowerQuery = query.toLowerCase();
    
    for (const [lang, keywords] of Object.entries(LEGAL_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lowerQuery.includes(keyword)) {
                return { isLegal: true, language: lang, confidence: 0.8 };
            }
        }
    }
    
    return { isLegal: false, language: 'en', confidence: 0.1 };
}

async function processUnknownCommand(command, isAdmin = false) {
    // Check for screensaver commands first
    const commandLower = command.toLowerCase();
    
    if (commandLower === 'matrix') {
        return await activateMatrixScreensaver();
    } else if (commandLower === 'oscilloscope') {
        return await activateOscilloscopeScreensaver();
    } else if (commandLower === 'screensaver') {
        return await switchScreensaver();
    }
    
    if (DISABLE_AI) {
        return `Command not found: ${command}
This is a Docker version with limited AI functionality.
Try: help, matrix, oscilloscope, screensaver`;
    }
    
    // If AI is enabled, try to use it
    if (openai) {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful UNIX terminal assistant. Provide concise, technical responses."
                    },
                    {
                        role: "user",
                        content: command
                    }
                ],
                max_tokens: 150
            });
            
            return completion.choices[0].message.content;
        } catch (error) {
            return `Error processing command: ${error.message}
Try: help, matrix, oscilloscope, screensaver`;
        }
    }
    
    return `Command not found: ${command}
Try: help, matrix, oscilloscope, screensaver`;
}

async function searchLegalDatabase(query, language = 'ru') {
    if (DISABLE_AI) {
        return `Legal search disabled in Docker mode.
Query: ${query}
Language: ${language}`;
    }
    
    return `Legal search would be performed here.
Query: ${query}
Language: ${language}`;
}

async function searchZakonOnlineAPI(query) {
    if (DISABLE_AI) {
        return `Zakon Online API disabled in Docker mode.
Query: ${query}`;
    }
    
    return `Zakon Online API would be called here.
Query: ${query}`;
}

function showApiConnections() {
    return `API Connections (Docker Mode):
- OpenAI: ${openai ? 'Available' : 'Disabled'}
- Legal Database: ${DISABLE_AI ? 'Disabled' : 'Available'}
- Zakon Online: ${DISABLE_AI ? 'Disabled' : 'Available'}`;
}

function processRunCommand(command) {
    const args = command.split(' ').slice(1);
    
    if (args.length === 0) {
        return `Usage: run <program>
Available programs:
- assembler <file.asm>
- pascal <file.pas>
- list`;
    }
    
    const program = args[0];
    
    switch (program) {
        case 'assembler':
            if (args[1]) {
                return EmulationManager.runAssembler(args[1]);
            }
            return 'Usage: run assembler <file.asm>';
            
        case 'pascal':
            if (args[1]) {
                return EmulationManager.runPascal(args[1]);
            }
            return 'Usage: run pascal <file.pas>';
            
        case 'list':
            return EmulationManager.listPrograms();
            
        default:
            return `Unknown program: ${program}
Try: assembler, pascal, list`;
    }
}

function processAssemblerCommand(args) {
    if (args.length === 0) {
        return `Usage: assembler <file.asm>
Example: assembler hello.asm`;
    }
    
    const filename = args[0];
    return EmulationManager.runAssembler(filename);
}

function processPascalCommand(args) {
    if (args.length === 0) {
        return `Usage: pascal <file.pas>
Example: pascal hello.pas`;
    }
    
    const filename = args[0];
    return EmulationManager.runPascal(filename);
}

function processListCommand() {
    return EmulationManager.listPrograms();
}

function processHelpCommand(args) {
    return `Available commands (Docker mode):
help, matrix, oscilloscope, screensaver
run, assembler, pascal, list
ping, traceroute, netstat (admin only)`;
}

// Screensaver commands for Docker version
async function activateMatrixScreensaver() {
    try {
        const response = await fetch('http://localhost:3000/api/screensaver/activate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ screensaver: 'matrix' })
        });
        const data = await response.json();
        return `<span class="success">${data.output}</span>`;
    } catch (error) {
        console.error('Error activating matrix screensaver:', error);
        return `<span class="success">Activating Matrix screensaver...</span>`;
    }
}

async function activateOscilloscopeScreensaver() {
    try {
        const response = await fetch('http://localhost:3000/api/screensaver/activate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ screensaver: 'oscilloscope' })
        });
        const data = await response.json();
        return `<span class="success">${data.output}</span>`;
    } catch (error) {
        console.error('Error activating oscilloscope screensaver:', error);
        return `<span class="success">Activating Oscilloscope screensaver...</span>`;
    }
}

async function switchScreensaver() {
    try {
        const response = await fetch('http://localhost:3000/api/screensaver/switch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        return `<span class="success">${data.output}</span>`;
    } catch (error) {
        console.error('Error switching screensaver:', error);
        return `<span class="success">Switching screensaver...</span>`;
    }
}

// Export functions
module.exports = {
    detectLegalRequest,
    processUnknownCommand,
    searchLegalDatabase,
    searchZakonOnlineAPI,
    showApiConnections,
    processRunCommand,
    processAssemblerCommand,
    processPascalCommand,
    processListCommand,
    processHelpCommand,
    activateMatrixScreensaver,
    activateOscilloscopeScreensaver,
    switchScreensaver,
    EmulationManager
}; 