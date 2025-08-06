/**
 * Autocomplete functionality tests
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head></head>
<body>
    <input id="commandInput" type="text" />
    <div id="output"></div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock the command input element
const commandInput = document.getElementById('commandInput');

// Mock autocomplete functions
function getAllAvailableCommands() {
    const baseCommands = [
        'help', 'menu', 'visual', 'about', 'projects', 'contact', 
        'clear', 'date', 'who', 'uname', 'ls', 'pwd', 'logout',
        'motd', 'matrix', 'oscilloscope', 'screensaver',
        'show api connections', 'show api con', 'show motd db',
        'cd', 'cat', 'echo', 'history', 'autocomplete', 'commands'
    ];
    
    const adminCommands = [
        'networking', 'ping', 'traceroute', 'nslookup', 
        'netstat', 'whois', 'system', 'admin', 'sudo'
    ];
    
    return [...baseCommands, ...adminCommands];
}

function findMatchingCommands(partial) {
    const allCommands = getAllAvailableCommands();
    return allCommands.filter(cmd => 
        cmd.toLowerCase().startsWith(partial.toLowerCase())
    );
}

function getCommandArguments(commandName) {
    const argsMap = {
        'ping': ['localhost', 'google.com', '8.8.8.8', 'github.com'],
        'traceroute': ['localhost', 'google.com', '8.8.8.8', 'github.com'],
        'nslookup': ['localhost', 'google.com', 'github.com', 'stackoverflow.com'],
        'whois': ['google.com', 'github.com', 'stackoverflow.com', 'example.com'],
        'cd': ['..', '~', '/', '/usr', '/usr/bin', '/etc'],
        'cat': ['README', '.profile', 'startup'],
        'ls': ['/', '/usr', '/usr/bin', '/etc', '/var'],
        'echo': ['Hello World', 'UNIX/32V', 'PDP-11/70'],
        'sudo': getAllAvailableCommands().filter(cmd => cmd !== 'sudo')
    };
    return argsMap[commandName] || [];
}

function smartAutocomplete(input) {
    const parts = input.trim().split(/\s+/);
    
    if (parts.length === 1) {
        // Autocomplete command
        return findMatchingCommands(parts[0]);
    } else if (parts.length === 2) {
        // Autocomplete argument for command
        const command = parts[0];
        const partialArg = parts[1];
        const possibleArgs = getCommandArguments(command);
        
        return possibleArgs.filter(arg => 
            arg.toLowerCase().startsWith(partialArg.toLowerCase())
        ).map(arg => `${command} ${arg}`);
    }
    
    return [];
}

describe('Autocomplete System', () => {
    describe('getAllAvailableCommands', () => {
        test('should return all available commands', () => {
            const commands = getAllAvailableCommands();
            expect(commands).toContain('help');
            expect(commands).toContain('ping');
            expect(commands).toContain('traceroute');
            expect(commands).toContain('sudo');
            expect(commands.length).toBeGreaterThan(20);
        });
    });

    describe('findMatchingCommands', () => {
        test('should find commands starting with partial input', () => {
            const matches = findMatchingCommands('pi');
            expect(matches).toContain('ping');
            expect(matches.length).toBeGreaterThan(0);
        });

        test('should be case insensitive', () => {
            const matches1 = findMatchingCommands('PI');
            const matches2 = findMatchingCommands('pi');
            expect(matches1).toEqual(matches2);
        });

        test('should return empty array for no matches', () => {
            const matches = findMatchingCommands('xyz123');
            expect(matches).toEqual([]);
        });

        test('should find exact matches', () => {
            const matches = findMatchingCommands('help');
            expect(matches).toContain('help');
        });
    });

    describe('getCommandArguments', () => {
        test('should return arguments for ping command', () => {
            const args = getCommandArguments('ping');
            expect(args).toContain('localhost');
            expect(args).toContain('google.com');
            expect(args.length).toBeGreaterThan(0);
        });

        test('should return arguments for cd command', () => {
            const args = getCommandArguments('cd');
            expect(args).toContain('..');
            expect(args).toContain('~');
            expect(args).toContain('/');
        });

        test('should return empty array for unknown command', () => {
            const args = getCommandArguments('unknowncommand');
            expect(args).toEqual([]);
        });

        test('should return sudo commands for sudo', () => {
            const args = getCommandArguments('sudo');
            expect(args).toContain('help');
            expect(args).not.toContain('sudo');
        });
    });

    describe('smartAutocomplete', () => {
        test('should autocomplete single command', () => {
            const suggestions = smartAutocomplete('pi');
            expect(suggestions).toContain('ping');
        });

        test('should autocomplete command with argument', () => {
            const suggestions = smartAutocomplete('ping g');
            expect(suggestions).toContain('ping google.com');
        });

        test('should autocomplete cd command', () => {
            const suggestions = smartAutocomplete('cd /u');
            expect(suggestions).toContain('cd /usr');
        });

        test('should autocomplete cat command', () => {
            const suggestions = smartAutocomplete('cat R');
            expect(suggestions).toContain('cat README');
        });

        test('should return empty array for invalid input', () => {
            const suggestions = smartAutocomplete('xyz123');
            expect(suggestions).toEqual([]);
        });

        test('should return all commands for empty string', () => {
            const suggestions = smartAutocomplete('');
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions).toContain('help');
            expect(suggestions).toContain('ping');
        });

        test('should handle multiple spaces', () => {
            const suggestions = smartAutocomplete('ping  g');
            expect(suggestions).toContain('ping google.com');
        });
    });

    describe('Command completion scenarios', () => {
        test('should complete help command', () => {
            const suggestions = smartAutocomplete('h');
            expect(suggestions).toContain('help');
            expect(suggestions).toContain('history');
        });

        test('should complete system commands', () => {
            const suggestions = smartAutocomplete('m');
            expect(suggestions).toContain('motd');
            expect(suggestions).toContain('matrix');
        });

        test('should complete admin commands', () => {
            const suggestions = smartAutocomplete('p');
            expect(suggestions).toContain('ping');
            expect(suggestions).toContain('projects');
        });

        test('should complete API commands', () => {
            const suggestions = smartAutocomplete('show');
            expect(suggestions).toContain('show api connections');
            expect(suggestions).toContain('show api con');
            expect(suggestions).toContain('show motd db');
        });
    });

    describe('Argument completion scenarios', () => {
        test('should complete ping arguments', () => {
            const suggestions = smartAutocomplete('ping l');
            expect(suggestions).toContain('ping localhost');
        });

        test('should complete traceroute arguments', () => {
            const suggestions = smartAutocomplete('traceroute g');
            expect(suggestions).toContain('traceroute google.com');
        });

        test('should complete nslookup arguments', () => {
            const suggestions = smartAutocomplete('nslookup g');
            expect(suggestions).toContain('nslookup google.com');
        });

        test('should complete whois arguments', () => {
            const suggestions = smartAutocomplete('whois g');
            expect(suggestions).toContain('whois google.com');
        });

        test('should complete cd arguments', () => {
            const suggestions = smartAutocomplete('cd /');
            expect(suggestions).toContain('cd /usr');
            expect(suggestions).toContain('cd /usr/bin');
        });

        test('should complete cat arguments', () => {
            const suggestions = smartAutocomplete('cat R');
            expect(suggestions).toContain('cat README');
        });

        test('should complete echo arguments', () => {
            const suggestions = smartAutocomplete('echo H');
            expect(suggestions).toContain('echo Hello World');
        });
    });
}); 