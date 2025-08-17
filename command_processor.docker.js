require('openai/shims/node');
const OpenAI = require('openai');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const EmulationManager = require('./Emulation/emulation_manager');

// Initialize OpenAI client
const openai = null; // Disabled in Docker mode

// Initialize SQLite database
const db = new sqlite3.Database('./terminal_data.db');

// Disable AI functionality in Docker mode
const DISABLE_AI = true;

// Initialize emulation manager
const emulationManager = new EmulationManager();

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
    // Check for run command first
    if (command.toLowerCase().startsWith('run ')) {
        console.log('Processing run command:', command);
        try {
            const result = await processRunCommand(command);
            console.log('Run command result length:', result ? result.length : 0);
            return result;
        } catch (runError) {
            console.error('Run command error:', runError);
            return `Error in run command: ${runError.message}\n`;
        }
    }
    
    // Check for screensaver commands
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
Available commands: run, help, matrix, oscilloscope, screensaver
Try: run asm help, run pascal help\n`;
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
Try: run asm help, run pascal help, help, matrix, oscilloscope, screensaver\n`;
        }
    }
    
    return `Command not found: ${command}
Try: run asm help, run pascal help, help, matrix, oscilloscope, screensaver\n`;
}

async function searchLegalDatabase(query, language = 'ru') {
    if (DISABLE_AI) {
        return `Legal search disabled in Docker mode.
Query: ${query}
Language: ${language}\n`;
    }
    
    return `Legal search would be performed here.
Query: ${query}
Language: ${language}\n`;
}

async function searchZakonOnlineAPI(query) {
    if (DISABLE_AI) {
        return `Zakon Online API disabled in Docker mode.
Query: ${query}\n`;
    }
    
    return `Zakon Online API would be called here.
Query: ${query}\n`;
}

function showApiConnections() {
    return `API Connections (Docker Mode):
- OpenAI: ${openai ? 'Available' : 'Disabled'}
- Legal Database: ${DISABLE_AI ? 'Disabled' : 'Available'}
- Zakon Online: ${DISABLE_AI ? 'Disabled' : 'Available'}\n`;
}

function processRunCommand(command) {
    const parts = command.trim().split(/\s+/);
    
    if (parts.length < 2) {
        return `Usage: run <emulator> [options]
Available emulators: asm, pascal, assembler, turbopascal
Use "run help" for more information.\n`;
    }
    
    const subCommand = parts[1].toLowerCase();
    
    try {
        switch (subCommand) {
            case 'asm':
            case 'assembler':
                return processAssemblerCommand(parts.slice(2));
            
            case 'pascal':
            case 'turbopascal':
            case 'tp':
                return processPascalCommand(parts.slice(2));
            
            case 'list':
                return processListCommand();
            
            case 'help':
                return processHelpCommand(parts.slice(2));
            
            default:
                return `Unknown emulator: ${subCommand}
Available emulators: asm, pascal, assembler, turbopascal
Use "run help" for more information.\n`;
        }
    } catch (error) {
        console.error('Error in processRunCommand:', error);
        return `Error processing run command: ${error.message}\n`;
    }
}

function processAssemblerCommand(args) {
    if (args.length === 0) {
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
                return 'Usage: run asm sample <type>\nAvailable types: hello, add\n';
            }
            const sampleResult = emulationManager.createSample('asm', args[1]);
            return sampleResult.success ? 
                `${sampleResult.message}\n\nSource code:\n${sampleResult.sourceCode}` : 
                sampleResult.message;
        
        case 'compile':
            if (args.length < 2) {
                return 'Usage: run asm compile <filename>\n';
            }
            const loadResult = emulationManager.loadFile(args[1]);
            if (!loadResult.success) {
                return loadResult.message;
            }
            const compileResult = emulationManager.compile(loadResult.sourceCode);
            return compileResult.display;
        
        case 'execute':
            if (args.length < 2) {
                return 'Usage: run asm execute <filename>\n';
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
            const loadResult3 = emulationManager.loadFile(args[0]);
            if (!loadResult3.success) {
                return loadResult3.message;
            }
            const fullResult = emulationManager.compileAndExecute(loadResult3.sourceCode);
            return fullResult.display;
    }
}

function processPascalCommand(args) {
    if (args.length === 0) {
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
                return 'Usage: run pascal sample <type>\nAvailable types: hello, factorial, calculator\n';
            }
            const sampleResult = emulationManager.createSample('pascal', args[1]);
            return sampleResult.success ? 
                `${sampleResult.message}\n\nSource code:\n${sampleResult.sourceCode}` : 
                sampleResult.message;
        
        case 'compile':
            if (args.length < 2) {
                return 'Usage: run pascal compile <filename>\n';
            }
            const loadResult = emulationManager.loadFile(args[1]);
            if (!loadResult.success) {
                return loadResult.message;
            }
            const compileResult = emulationManager.compile(loadResult.sourceCode);
            return compileResult.display;
        
        case 'execute':
            if (args.length < 2) {
                return 'Usage: run pascal execute <filename>\n';
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
            const loadResult3 = emulationManager.loadFile(args[0]);
            if (!loadResult3.success) {
                return loadResult3.message;
            }
            const fullResult = emulationManager.compileAndExecute(loadResult3.sourceCode);
            return fullResult.display;
    }
}

function processListCommand() {
    const result = emulationManager.listFiles();
    if (!result.success) {
        return result.message;
    }
    
    let output = 'WORKSPACE FILES\n';
    output += '==========================================\n\n';
    
    if (result.files.length === 0) {
        output += 'No files found in workspace.\n';
        output += 'Use "run asm sample hello" or "run pascal sample hello" to create sample programs.\n';
    } else {
        result.files.forEach(file => {
            output += `${file.name} (${file.size} bytes, ${file.type})\n`;
        });
    }
    
    return output + '\n';
}

function processHelpCommand(args) {
    if (args.length === 0) {
        const helpResult = emulationManager.getHelp();
        return `${helpResult.message}\n\n${helpResult.help}`;
    }
    
    const emulatorType = args[0].toLowerCase();
    const helpResult = emulationManager.getHelp(emulatorType);
    return `${helpResult.message}\n\n${helpResult.help}`;
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
        return data.output || 'Activating Matrix screensaver...';
    } catch (error) {
        console.error('Error activating matrix screensaver:', error);
        return 'Activating Matrix screensaver...';
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
        return data.output || 'Activating Oscilloscope screensaver...';
    } catch (error) {
        console.error('Error activating oscilloscope screensaver:', error);
        return 'Activating Oscilloscope screensaver...';
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
        return data.output || 'Switching screensaver...';
    } catch (error) {
        console.error('Error switching screensaver:', error);
        return 'Switching screensaver...';
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
    emulationManager
}; 