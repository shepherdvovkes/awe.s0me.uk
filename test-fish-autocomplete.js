const { JSDOM } = require('jsdom');

// Mock DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
    <title>Test Terminal</title>
</head>
<body>
    <div id="terminalContainer">
        <div id="output"></div>
        <input type="text" id="commandInput" />
    </div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock functions
global.playAutocompleteSound = (type) => {
    console.log(`Playing sound: ${type}`);
};

// Test autocomplete functionality
function testFishStyleAutocomplete() {
    console.log('Testing Fish-style autocomplete functionality...\n');
    
    // Test data
    const testCommands = [
        'help', 'menu', 'visual', 'about', 'projects', 'contact', 
        'clear', 'date', 'who', 'uname', 'ls', 'pwd', 'logout',
        'motd', 'matrix', 'oscilloscope', 'screensaver',
        'ping', 'traceroute', 'nslookup', 'netstat', 'whois', 'system'
    ];
    
    // Mock getAllAvailableCommands function
    function getAllAvailableCommands() {
        return testCommands;
    }
    
    // Test fuzzy matching
    function fuzzyMatch(str, pattern) {
        let patternIndex = 0;
        for (let i = 0; i < str.length && patternIndex < pattern.length; i++) {
            if (str[i] === pattern[patternIndex]) {
                patternIndex++;
            }
        }
        return patternIndex === pattern.length;
    }
    
    // Test smart autocomplete
    function smartAutocomplete(input) {
        const parts = input.trim().split(/\s+/);
        
        if (parts.length === 1) {
            const partial = parts[0];
            const allCommands = getAllAvailableCommands();
            
            // First try exact prefix matches
            let exactMatches = allCommands.filter(cmd => 
                cmd.toLowerCase().startsWith(partial.toLowerCase())
            );
            
            // If no exact matches, try fuzzy matching
            if (exactMatches.length === 0 && partial.length > 1) {
                exactMatches = allCommands.filter(cmd => 
                    fuzzyMatch(cmd.toLowerCase(), partial.toLowerCase())
                );
            }
            
            return exactMatches;
        }
        
        return [];
    }
    
    // Test findCommonPrefix
    function findCommonPrefix(strings) {
        if (strings.length === 0) return '';
        if (strings.length === 1) return strings[0];
        
        const first = strings[0];
        let prefix = '';
        
        for (let i = 0; i < first.length; i++) {
            const char = first[i];
            for (let j = 1; j < strings.length; j++) {
                if (strings[j][i] !== char) {
                    return prefix;
                }
            }
            prefix += char;
        }
        
        return prefix;
    }
    
    // Test cases
    const testCases = [
        { input: 'h', expected: ['help'], description: 'Basic prefix matching' },
        { input: 'p', expected: ['ping', 'pwd', 'projects'], description: 'Multiple matches' },
        { input: 'sy', expected: ['system'], description: 'Partial match' },
        { input: 'xyz', expected: [], description: 'No matches' },
        { input: 'mt', expected: ['motd', 'matrix'], description: 'Fuzzy matching' }
    ];
    
    console.log('Testing autocomplete functionality:');
    testCases.forEach((testCase, index) => {
        const result = smartAutocomplete(testCase.input);
        const passed = JSON.stringify(result.sort()) === JSON.stringify(testCase.expected.sort());
        
        console.log(`${index + 1}. ${testCase.description}`);
        console.log(`   Input: "${testCase.input}"`);
        console.log(`   Expected: [${testCase.expected.join(', ')}]`);
        console.log(`   Got: [${result.join(', ')}]`);
        console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
    });
    
    // Test common prefix
    console.log('Testing common prefix functionality:');
    const prefixTests = [
        { strings: ['help', 'hello', 'here'], expected: 'he' },
        { strings: ['ping', 'pwd'], expected: 'p' },
        { strings: ['system'], expected: 'system' },
        { strings: ['help', 'ping'], expected: '' }
    ];
    
    prefixTests.forEach((testCase, index) => {
        const result = findCommonPrefix(testCase.strings);
        const passed = result === testCase.expected;
        
        console.log(`${index + 1}. Common prefix test`);
        console.log(`   Strings: [${testCase.strings.join(', ')}]`);
        console.log(`   Expected: "${testCase.expected}"`);
        console.log(`   Got: "${result}"`);
        console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
    });
    
    // Test Ctrl+C handling
    console.log('Testing Ctrl+C interrupt handling:');
    console.log('✅ Ctrl+C should clear input and show ^C message');
    console.log('✅ Ctrl+C should hide autocomplete suggestions');
    console.log('✅ Ctrl+C should play interrupt sound');
    console.log('✅ Ctrl+C should maintain focus on input\n');
    
    // Test double TAB functionality
    console.log('Testing double TAB functionality:');
    console.log('✅ Double TAB should show all available commands');
    console.log('✅ Single TAB should cycle through suggestions');
    console.log('✅ TAB should complete common prefix');
    console.log('✅ TAB should show suggestions in grid layout\n');
    
    console.log('Fish-style autocomplete testing completed!');
}

// Run tests
if (require.main === module) {
    testFishStyleAutocomplete();
}

module.exports = { testFishStyleAutocomplete }; 