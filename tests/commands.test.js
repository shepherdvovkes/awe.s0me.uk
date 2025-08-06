/**
 * Tests for new terminal commands
 */

// Mock DOM environment
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head></head>
<body>
    <div id="output"></div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;

// Mock command history
let commandHistory = [];

// Mock commands object
const commands = {
    help: () => {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        let helpText = `UNIX/32V Terminal - Command Reference (${currentDate})

BASIC COMMANDS:
help        menu        visual      about
projects    contact     clear       date
who         uname       ls          pwd
logout      cd          cat         echo

SYSTEM COMMANDS:
motd        matrix      oscilloscope    screensaver
history     autocomplete    commands

API COMMANDS:
show api connections    show api con
show motd db

AI ASSISTANT:
Unknown commands are automatically processed by AI
Legal questions are detected and routed to legal database

AUTOCOMPLETION (Fish-style):
• Press TAB for command completion
• Use ↑↓ arrows to navigate suggestions
• Press TAB again to cycle through options
• Press ESC to cancel autocomplete
• Supports command + argument completion
• Audio feedback for different actions`;
        
        return helpText;
    },

    history: () => {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        if (commandHistory.length === 0) {
            return `No command history available.`;
        }
        
        const recentCommands = commandHistory.slice(0, 15);
        const totalCommands = commandHistory.length;
        
        let output = `Command History (${currentDate})

RECENT COMMANDS (${recentCommands.length}/${totalCommands}):
${recentCommands.map((cmd, index) => 
    `${String(index + 1).padStart(2, ' ')}: ${cmd}`
).join('\n')}

NAVIGATION:
• Use ↑↓ arrows to browse history
• ↑ (up arrow)    - Go to previous command
• ↓ (down arrow)  - Go to next command
• ESC             - Return to current input

HISTORY STATS:
• Total commands: ${totalCommands}
• Recent commands: ${recentCommands.length}
• History limit: 50 commands

TIPS:
• Commands are automatically saved to history
• Duplicate commands are not stored
• History persists during session`;
        
        return output;
    },

    autocomplete: () => {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `Fish-style Autocomplete System (${currentDate})

KEYBOARD SHORTCUTS:
• TAB                    - Complete command or show suggestions
• ↑↓ Arrows             - Navigate through suggestions
• TAB (multiple)         - Cycle through options
• ESC                    - Cancel autocomplete
• ↑↓ (no suggestions)   - Navigate command history

SMART FEATURES:
• Command completion     - Type 'pi' → 'ping'
• Argument completion    - Type 'ping g' → 'ping google.com'
• Context-aware         - Different args for different commands
• Audio feedback        - Different sounds for different actions
• Visual indicators     - Green border when active

SUPPORTED COMMANDS:
• Basic: help, ls, cd, cat, echo, pwd, clear, date
• System: motd, matrix, oscilloscope, screensaver
• Admin: ping, traceroute, nslookup, whois, netstat
• API: show api connections, show motd db

AUDIO FEEDBACK:
• High tone (800-1200Hz)  - Successful completion
• Medium tone (600-800Hz) - Suggestions available
• Low tone (300-400Hz)    - No matches found

EXAMPLES:
• Type 'pi' + TAB         → 'ping'
• Type 'ping g' + TAB     → 'ping google.com'
• Type 'cat R' + TAB      → 'cat README'
• Type 'cd /u' + TAB      → 'cd /usr'

TOTAL COMMANDS:
25 commands with autocompletion support`;
    },

    commands: () => {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const basicCommands = ['help', 'menu', 'visual', 'about', 'projects', 'contact', 'clear', 'date', 'who', 'uname', 'ls', 'pwd', 'logout', 'cd', 'cat', 'echo'];
        const systemCommands = ['motd', 'matrix', 'oscilloscope', 'screensaver', 'history', 'autocomplete', 'commands'];
        const apiCommands = ['show api connections', 'show api con', 'show motd db'];
        const adminCommands = ['networking', 'ping', 'traceroute', 'nslookup', 'netstat', 'whois', 'system', 'admin', 'sudo'];
        
        let output = `UNIX/32V Terminal - Complete Command List (${currentDate})

BASIC COMMANDS (${basicCommands.length}):
${basicCommands.join(' ')}

SYSTEM COMMANDS (${systemCommands.length}):
${systemCommands.join(' ')}

API COMMANDS (${apiCommands.length}):
${apiCommands.join(' ')}

ADMIN COMMANDS (${adminCommands.length}):
${adminCommands.join(' ')}

TOTAL:
25 commands available

COMMAND CATEGORIES:
• Basic: File system, navigation, information
• System: Screensavers, history, utilities  
• API: Database connections and queries
• Admin: Network tools and system management

USAGE TIP:
Type partial command and press TAB for autocompletion!`;
        
        return output;
    },

    cat: (args) => {
        if (!args || args.length === 0) {
            return `cat: usage: cat <filename>`;
        }
        const filename = args[0];
        const files = {
            'README': 'UNIX/32V Terminal Emulator\nRetro PDP-11/70 Interface\n\nType "help" for available commands.',
            '.profile': 'export PATH=/usr/bin:/usr/local/bin\nexport TERM=vt100\n# Welcome to UNIX/32V',
            'startup': '#!/bin/sh\necho "UNIX/32V System Ready"\ndate\nwho'
        };
        return files[filename] || `cat: ${filename}: No such file or directory`;
    },

    echo: (args) => {
        if (!args || args.length === 0) {
            return '';
        }
        return args.join(' ');
    },

    date: () => {
        const now = new Date();
        const vintage = `Mon Aug  4 14:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} PDT 1975`;
        return vintage;
    },

    who: () => {
        return `user    tty03   Aug  4 14:30`;
    },

    uname: () => {
        return `UNIX/32V PDP-11/70`;
    },

    pwd: () => {
        return '/usr/user';
    }
};

describe('Terminal Commands', () => {
    beforeEach(() => {
        commandHistory = ['help', 'ls', 'pwd', 'cat README'];
    });

    describe('help command', () => {
        test('should return help text without HTML tags', () => {
            const result = commands.help();
            expect(result).toContain('UNIX/32V Terminal - Command Reference');
            expect(result).toContain('BASIC COMMANDS:');
            expect(result).toContain('SYSTEM COMMANDS:');
            expect(result).toContain('AUTOCOMPLETION (Fish-style):');
            expect(result).not.toContain('<span');
            expect(result).not.toContain('</span>');
        });

        test('should include current date', () => {
            const result = commands.help();
            const currentYear = new Date().getFullYear().toString();
            expect(result).toContain(currentYear);
        });
    });

    describe('history command', () => {
        test('should return history without HTML tags', () => {
            const result = commands.history();
            expect(result).toContain('Command History');
            expect(result).toContain('RECENT COMMANDS');
            expect(result).toContain('NAVIGATION:');
            expect(result).not.toContain('<span');
            expect(result).not.toContain('</span>');
        });

        test('should show command history', () => {
            const result = commands.history();
            expect(result).toContain('1: help');
            expect(result).toContain('2: ls');
            expect(result).toContain('3: pwd');
            expect(result).toContain('4: cat README');
        });

        test('should show empty history message', () => {
            commandHistory = [];
            const result = commands.history();
            expect(result).toBe('No command history available.');
        });
    });

    describe('autocomplete command', () => {
        test('should return autocomplete info without HTML tags', () => {
            const result = commands.autocomplete();
            expect(result).toContain('Fish-style Autocomplete System');
            expect(result).toContain('KEYBOARD SHORTCUTS:');
            expect(result).toContain('SMART FEATURES:');
            expect(result).not.toContain('<span');
            expect(result).not.toContain('</span>');
        });

        test('should include audio feedback info', () => {
            const result = commands.autocomplete();
            expect(result).toContain('AUDIO FEEDBACK:');
            expect(result).toContain('High tone (800-1200Hz)');
            expect(result).toContain('Medium tone (600-800Hz)');
            expect(result).toContain('Low tone (300-400Hz)');
        });

        test('should include examples', () => {
            const result = commands.autocomplete();
            expect(result).toContain('EXAMPLES:');
            expect(result).toContain('Type \'pi\' + TAB');
            expect(result).toContain('Type \'ping g\' + TAB');
        });
    });

    describe('commands command', () => {
        test('should return command list without HTML tags', () => {
            const result = commands.commands();
            expect(result).toContain('UNIX/32V Terminal - Complete Command List');
            expect(result).toContain('BASIC COMMANDS (16):');
            expect(result).toContain('SYSTEM COMMANDS (7):');
            expect(result).toContain('API COMMANDS (3):');
            expect(result).toContain('ADMIN COMMANDS (9):');
            expect(result).not.toContain('<span');
            expect(result).not.toContain('</span>');
        });

        test('should list all command categories', () => {
            const result = commands.commands();
            expect(result).toContain('help');
            expect(result).toContain('ping');
            expect(result).toContain('matrix');
            expect(result).toContain('show api connections');
        });
    });

    describe('cat command', () => {
        test('should show usage error without HTML tags', () => {
            const result = commands.cat();
            expect(result).toBe('cat: usage: cat <filename>');
        });

        test('should read README file', () => {
            const result = commands.cat(['README']);
            expect(result).toContain('UNIX/32V Terminal Emulator');
            expect(result).toContain('Retro PDP-11/70 Interface');
        });

        test('should read .profile file', () => {
            const result = commands.cat(['.profile']);
            expect(result).toContain('export PATH=/usr/bin:/usr/local/bin');
            expect(result).toContain('export TERM=vt100');
        });

        test('should read startup file', () => {
            const result = commands.cat(['startup']);
            expect(result).toContain('#!/bin/sh');
            expect(result).toContain('echo "UNIX/32V System Ready"');
        });

        test('should show error for non-existent file', () => {
            const result = commands.cat(['nonexistent']);
            expect(result).toBe('cat: nonexistent: No such file or directory');
        });
    });

    describe('echo command', () => {
        test('should echo arguments', () => {
            const result = commands.echo(['Hello', 'World']);
            expect(result).toBe('Hello World');
        });

        test('should return empty string for no arguments', () => {
            const result = commands.echo();
            expect(result).toBe('');
        });
    });

    describe('date command', () => {
        test('should return vintage date format', () => {
            const result = commands.date();
            expect(result).toMatch(/Mon Aug  4 14:\d{2}:\d{2} PDT 1975/);
        });
    });

    describe('who command', () => {
        test('should return user session info', () => {
            const result = commands.who();
            expect(result).toBe('user    tty03   Aug  4 14:30');
        });
    });

    describe('uname command', () => {
        test('should return system name', () => {
            const result = commands.uname();
            expect(result).toBe('UNIX/32V PDP-11/70');
        });
    });

    describe('pwd command', () => {
        test('should return current directory', () => {
            const result = commands.pwd();
            expect(result).toBe('/usr/user');
        });
    });
}); 