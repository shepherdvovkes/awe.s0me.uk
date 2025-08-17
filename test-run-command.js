#!/usr/bin/env node

/**
 * Тест команды run для эмуляторов
 */

// Простой тест без зависимости от OpenAI
function testRunCommandBasic() {
    console.log('=== Testing RUN Command Basic ===\n');

    const testCommands = [
        'run help',
        'run asm help',
        'run pascal help',
        'run dos help',
        'run qemu help',
        'run ssh help',
        'run unknown'
    ];

    console.log('Available test commands:');
    testCommands.forEach((cmd, index) => {
        console.log(`${index + 1}. ${cmd}`);
    });

    console.log('\nTo test these commands, run them in the terminal:');
    console.log('1. Start the server: npm start');
    console.log('2. Open the terminal in browser');
    console.log('3. Try the commands above');

    console.log('\nExpected behavior:');
    console.log('- run help: Shows general help');
    console.log('- run asm help: Shows assembler help');
    console.log('- run pascal help: Shows Pascal help');
    console.log('- run dos help: Shows DOS help');
    console.log('- run qemu help: Shows QEMU help');
    console.log('- run ssh help: Shows SSH help');
    console.log('- run unknown: Shows error message');

    console.log('\n=== Test completed ===');
}

// Запуск тестов
if (require.main === module) {
    testRunCommandBasic();
}

module.exports = { testRunCommandBasic }; 