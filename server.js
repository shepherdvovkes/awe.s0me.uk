const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
const sqlite3 = require('sqlite3').verbose();

// Load environment variables
require('dotenv').config();

// Import command processor
const { processUnknownCommand, detectLegalRequest, searchLegalDatabase } = require('./command_processor');

const app = express();
const PORT = 3000;

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize SQLite database
const db = new sqlite3.Database('./terminal_data.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    db.serialize(() => {
        // Create MOTD history table
        db.run(`CREATE TABLE IF NOT EXISTS motd_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            prompt TEXT NOT NULL,
            language TEXT DEFAULT 'en',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Create OpenAI requests table
        db.run(`CREATE TABLE IF NOT EXISTS openai_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_type TEXT NOT NULL,
            prompt TEXT NOT NULL,
            response TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        console.log('Database tables initialized');
    });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Helper function to execute commands safely
function executeCommand(command, args) {
    return new Promise((resolve, reject) => {
        const fullCommand = `${command} ${args.join(' ')}`;
        
        exec(fullCommand, { timeout: 10000 }, (error, stdout, stderr) => {
            if (error) {
                reject(error.message);
            } else {
                resolve(stdout || stderr);
            }
        });
    });
}

// Helper function to format output with proper line breaks
function formatOutput(output) {
    return output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n') + '\n';
}

// Special formatting for ping command
function formatPingOutput(output) {
    const lines = output.split('\n');
    const formattedLines = [];
    
    for (let line of lines) {
        line = line.trim();
        if (line.length > 0) {
            // Add extra line break after each ping response
            if (line.includes('icmp_seq=')) {
                formattedLines.push(line);
                formattedLines.push(''); // Add empty line after each response
            } else {
                formattedLines.push(line);
            }
        }
    }
    
    return formattedLines.join('\n') + '\n';
}

// Ping endpoint
app.post('/api/ping', async (req, res) => {
    try {
        const { hostname } = req.body;
        
        if (!hostname) {
            return res.status(400).json({ error: 'Hostname is required' });
        }
        
        // Determine ping command based on OS
        const pingCmd = process.platform === 'win32' ? 'ping' : 'ping';
        const pingArgs = process.platform === 'win32' 
            ? ['-n', '4', hostname] 
            : ['-c', '4', hostname];
        
        const output = await executeCommand(pingCmd, pingArgs);
        res.json({ output: formatPingOutput(output) });
        
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

// Traceroute endpoint
app.post('/api/traceroute', async (req, res) => {
    try {
        const { hostname } = req.body;
        
        if (!hostname) {
            return res.status(400).json({ error: 'Hostname is required' });
        }
        
        // Determine traceroute command based on OS
        const tracerouteCmd = process.platform === 'win32' ? 'tracert' : 'traceroute';
        const tracerouteArgs = [hostname];
        
        const output = await executeCommand(tracerouteCmd, tracerouteArgs);
        res.json({ output: formatOutput(output) });
        
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

// Nslookup endpoint
app.post('/api/nslookup', async (req, res) => {
    try {
        const { hostname } = req.body;
        
        if (!hostname) {
            return res.status(400).json({ error: 'Hostname is required' });
        }
        
        const output = await executeCommand('nslookup', [hostname]);
        res.json({ output: formatOutput(output) });
        
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

// Netstat endpoint
app.post('/api/netstat', async (req, res) => {
    try {
        const { args = [] } = req.body;
        
        // Determine netstat command based on OS
        const netstatCmd = 'netstat';
        const netstatArgs = process.platform === 'win32' 
            ? ['-an', ...args] 
            : ['-an', ...args];
        
        const output = await executeCommand(netstatCmd, netstatArgs);
        res.json({ output: formatOutput(output) });
        
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

// Whois endpoint
app.post('/api/whois', async (req, res) => {
    try {
        const { domain } = req.body;
        
        if (!domain) {
            return res.status(400).json({ error: 'Domain is required' });
        }
        
        const output = await executeCommand('whois', [domain]);
        res.json({ output: formatOutput(output) });
        
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

// MOTD endpoint using OpenAI with database storage and multilingual support
app.post('/api/motd', async (req, res) => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        // Get the last 5 MOTD messages to avoid repetition
        const getPreviousMotds = () => {
            return new Promise((resolve, reject) => {
                db.all(`SELECT message FROM motd_history ORDER BY created_at DESC LIMIT 5`, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(row => row.message));
                });
            });
        };

        const previousMotds = await getPreviousMotds();
        const previousMessages = previousMotds.join('\n');

        // Create multilingual MOTD messages
        const languages = [
            { code: 'en', name: 'English' },
            { code: 'ru', name: 'Russian' },
            { code: 'ja', name: 'Japanese' },
            { code: 'fr', name: 'French' },
            { code: 'uk', name: 'Ukrainian' }
        ];

        const multilingualMotds = [];

        for (const lang of languages) {
            // Create a dynamic prompt for each language
            const basePrompt = `You are Bender from Futurama, now running a retro UNIX system from 1975. Generate a unique, witty 1-line message of the day (MOTD) in ${lang.name} that I haven't seen before. Keep it short, funny, and in character. Use only ASCII characters - NO emojis. Style it like old computer terminals with simple text only.`;

            const dynamicPrompt = previousMessages.length > 0 
                ? `${basePrompt}\n\nPrevious messages to avoid repeating:\n${previousMessages}\n\nGenerate something completely different and unique in ${lang.name}:`
                : basePrompt;

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a retro UNIX system from 1975. Generate a 1-line message of the day (MOTD) that Bender from Futurama would say in ${lang.name}. Keep it short, witty, and in character. Use only ASCII characters - NO emojis. Style it like old computer terminals with simple text only.`
                    },
                    {
                        role: "user",
                        content: dynamicPrompt
                    }
                ],
                max_tokens: 100,
                temperature: 0.9 // Higher temperature for more variety
            });

            const motd = completion.choices[0].message.content;
            
            // Remove "MOTD:" prefix if it exists
            const cleanMotd = motd.replace(/^MOTD:\s*/i, '').replace(/^Message of the day:\s*/i, '');

            multilingualMotds.push({
                language: lang.name,
                code: lang.code,
                message: cleanMotd
            });

            // Store each MOTD in database
            db.run(`INSERT INTO motd_history (message, prompt, language) VALUES (?, ?, ?)`, 
                [cleanMotd, dynamicPrompt, lang.code], 
                function(err) {
                    if (err) {
                        console.error('Error storing MOTD:', err);
                    }
                }
            );

            // Store the OpenAI request
            db.run(`INSERT INTO openai_requests (request_type, prompt, response) VALUES (?, ?, ?)`, 
                [`motd_${lang.code}`, dynamicPrompt, cleanMotd], 
                function(err) {
                    if (err) {
                        console.error('Error storing OpenAI request:', err);
                    }
                }
            );
        }

        // Format the output for display with translations
        let formattedOutput = '';
        
        // Start with English message
        formattedOutput += multilingualMotds[0].message;
        
        // Add translations on new lines
        for (let i = 1; i < multilingualMotds.length; i++) {
            formattedOutput += `\n${multilingualMotds[i].message}`;
        }

        res.json({ 
            output: formattedOutput,
            multilingual: multilingualMotds
        });
        
    } catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ error: 'Failed to generate MOTD: ' + error.message });
    }
});

// System info endpoint
app.get('/api/system', (req, res) => {
    const systemInfo = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime()
    };
    res.json(systemInfo);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// MOTD history endpoint
app.get('/api/motd/history', (req, res) => {
    db.all(`SELECT message, language, created_at FROM motd_history ORDER BY created_at DESC LIMIT 20`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch MOTD history' });
        } else {
            res.json({ history: rows });
        }
    });
});

// OpenAI requests history endpoint
app.get('/api/openai/history', (req, res) => {
    db.all(`SELECT request_type, prompt, response, created_at FROM openai_requests ORDER BY created_at DESC LIMIT 20`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch OpenAI history' });
        } else {
            res.json({ history: rows });
        }
    });
});

// Process unknown command endpoint
app.post('/api/process-command', async (req, res) => {
    try {
        const { command, isAdmin = false } = req.body;
        
        if (!command) {
            return res.status(400).json({ error: 'Command is required' });
        }
        
        const response = await processUnknownCommand(command, isAdmin);
        res.json({ output: response });
        
    } catch (error) {
        console.error('Command processing error:', error);
        res.status(500).json({ error: 'Failed to process command: ' + error.message });
    }
});

// Legal request detection endpoint
app.post('/api/detect-legal', (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        
        const detection = detectLegalRequest(query);
        res.json(detection);
        
    } catch (error) {
        console.error('Legal detection error:', error);
        res.status(500).json({ error: 'Failed to detect legal request: ' + error.message });
    }
});

// Legal database search endpoint
app.post('/api/legal-search', async (req, res) => {
    try {
        const { query, language = 'ru' } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        
        const response = await searchLegalDatabase(query, language);
        res.json({ output: response });
        
    } catch (error) {
        console.error('Legal search error:', error);
        res.status(500).json({ error: 'Failed to search legal database: ' + error.message });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'retro_terminal_site.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Retro Terminal API Server running on http://localhost:${PORT}`);
    console.log(`📡 Available endpoints:`);
    console.log(`   POST /api/ping - Test connectivity`);
    console.log(`   POST /api/traceroute - Trace network path`);
    console.log(`   POST /api/nslookup - DNS lookup`);
    console.log(`   POST /api/netstat - Network statistics`);
    console.log(`   POST /api/whois - Domain information`);
    console.log(`   POST /api/motd - Generate Bender-style MOTD`);
    console.log(`   POST /api/process-command - Process unknown commands with AI`);
    console.log(`   POST /api/detect-legal - Detect legal requests`);
    console.log(`   POST /api/legal-search - Search legal database`);
    console.log(`   GET  /api/motd/history - MOTD history`);
    console.log(`   GET  /api/openai/history - OpenAI requests history`);
    console.log(`   GET  /api/system - System information`);
    console.log(`   GET  /api/health - Health check`);
}); 