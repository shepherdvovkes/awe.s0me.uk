const { 
    processUnknownCommand, 
    processRunCommand, 
    processAssemblerCommand, 
    processPascalCommand,
    processListCommand,
    processHelpCommand
} = require('../command_processor.docker');

describe('Docker Emulation Commands', () => {
    describe('processUnknownCommand', () => {
        test('should handle run asm command', async () => {
            const result = await processUnknownCommand('run asm');
            expect(result).toContain('Turbo Assembler 3.0');
        });

        test('should handle run pascal command', async () => {
            const result = await processUnknownCommand('run pascal');
            expect(result).toContain('Turbo Pascal 7.0');
        });

        test('should handle run asm sample command', async () => {
            const result = await processUnknownCommand('run asm sample hello');
            expect(result).toContain('Sample program created');
            expect(result).toContain('.model small');
        });

        test('should handle run pascal sample command', async () => {
            const result = await processUnknownCommand('run pascal sample hello');
            expect(result).toContain('Sample program created');
            expect(result).toContain('program');
        });

        test('should handle unknown command', async () => {
            const result = await processUnknownCommand('unknown-command');
            expect(result).toContain('Command not found');
            expect(result).toContain('Docker version');
        });

        test('should handle matrix screensaver command', async () => {
            const result = await processUnknownCommand('matrix');
            expect(result).toContain('Activating Matrix screensaver');
        });

        test('should handle oscilloscope screensaver command', async () => {
            const result = await processUnknownCommand('oscilloscope');
            expect(result).toContain('Activating Oscilloscope screensaver');
        });
    });

    describe('processRunCommand', () => {
        test('should handle run asm', () => {
            const result = processRunCommand('run asm');
            expect(result).toContain('Turbo Assembler 3.0');
        });

        test('should handle run pascal', () => {
            const result = processRunCommand('run pascal');
            expect(result).toContain('Turbo Pascal 7.0');
        });

        test('should handle run asm sample', () => {
            const result = processRunCommand('run asm sample hello');
            expect(result).toContain('Sample program created');
            expect(result).toContain('.model small');
        });

        test('should handle run pascal sample', () => {
            const result = processRunCommand('run pascal sample hello');
            expect(result).toContain('Sample program created');
            expect(result).toContain('program');
        });

        test('should handle run asm help', () => {
            const result = processRunCommand('run asm help');
            expect(result).toContain('run asm');
        });

        test('should handle run pascal help', () => {
            const result = processRunCommand('run pascal help');
            expect(result).toContain('run pascal');
        });

        test('should handle run list', () => {
            const result = processRunCommand('run list');
            expect(result).toContain('WORKSPACE FILES');
        });

        test('should handle run help', () => {
            const result = processRunCommand('run help');
            expect(result).toContain('Emulation Manager Help');
        });

        test('should handle unknown emulator', () => {
            const result = processRunCommand('run unknown');
            expect(result).toContain('Unknown emulator');
        });

        test('should handle run without arguments', () => {
            const result = processRunCommand('run');
            expect(result).toContain('Usage: run');
        });

        test('should handle run assembler alias', () => {
            const result = processRunCommand('run assembler');
            expect(result).toContain('Turbo Assembler 3.0');
        });

        test('should handle run turbopascal alias', () => {
            const result = processRunCommand('run turbopascal');
            expect(result).toContain('Turbo Pascal 7.0');
        });

        test('should handle run tp alias', () => {
            const result = processRunCommand('run tp');
            expect(result).toContain('Turbo Pascal 7.0');
        });
    });

    describe('processAssemblerCommand', () => {
        test('should initialize assembler', () => {
            const result = processAssemblerCommand([]);
            expect(result).toContain('Turbo Assembler 3.0');
        });

        test('should handle help', () => {
            const result = processAssemblerCommand(['help']);
            expect(result).toContain('run asm');
        });

        test('should handle sample hello', () => {
            const result = processAssemblerCommand(['sample', 'hello']);
            expect(result).toContain('Sample program created');
            expect(result).toContain('.model small');
        });

        test('should handle sample add', () => {
            const result = processAssemblerCommand(['sample', 'add']);
            expect(result).toContain('Sample program created');
            expect(result).toContain('.model small');
        });

        test('should handle sample without type', () => {
            const result = processAssemblerCommand(['sample']);
            expect(result).toContain('Usage: run asm sample');
        });

        test('should handle compile without filename', () => {
            const result = processAssemblerCommand(['compile']);
            expect(result).toContain('Usage: run asm compile');
        });

        test('should handle execute without filename', () => {
            const result = processAssemblerCommand(['execute']);
            expect(result).toContain('Usage: run asm execute');
        });

        test('should handle filename directly', () => {
            const result = processAssemblerCommand(['test.asm']);
            expect(result).toContain('File not found');
        });
    });

    describe('processPascalCommand', () => {
        test('should initialize pascal', () => {
            const result = processPascalCommand([]);
            expect(result).toContain('Turbo Pascal 7.0');
        });

        test('should handle help', () => {
            const result = processPascalCommand(['help']);
            expect(result).toContain('run pascal');
        });

        test('should handle sample hello', () => {
            const result = processPascalCommand(['sample', 'hello']);
            expect(result).toContain('Sample program created');
            expect(result).toContain('program');
        });

        test('should handle sample factorial', () => {
            const result = processPascalCommand(['sample', 'factorial']);
            expect(result).toContain('Sample program created');
            expect(result).toContain('program');
        });

        test('should handle sample calculator', () => {
            const result = processPascalCommand(['sample', 'calculator']);
            expect(result).toContain('Sample program created');
            expect(result).toContain('program');
        });

        test('should handle sample without type', () => {
            const result = processPascalCommand(['sample']);
            expect(result).toContain('Usage: run pascal sample');
        });

        test('should handle compile without filename', () => {
            const result = processPascalCommand(['compile']);
            expect(result).toContain('Usage: run pascal compile');
        });

        test('should handle execute without filename', () => {
            const result = processPascalCommand(['execute']);
            expect(result).toContain('Usage: run pascal execute');
        });

        test('should handle filename directly', () => {
            const result = processPascalCommand(['test.pas']);
            expect(result).toContain('File not found');
        });
    });

    describe('processListCommand', () => {
        test('should list files', () => {
            const result = processListCommand();
            expect(result).toContain('WORKSPACE FILES');
        });
    });

    describe('processHelpCommand', () => {
        test('should show general help', () => {
            const result = processHelpCommand([]);
            expect(result).toContain('Emulation Manager Help');
        });

        test('should show assembler help', () => {
            const result = processHelpCommand(['asm']);
            expect(result).toContain('run asm');
        });

        test('should show pascal help', () => {
            const result = processHelpCommand(['pascal']);
            expect(result).toContain('run pascal');
        });
    });

    describe('Error Handling', () => {
        test('should handle unknown sample types', () => {
            const result = processAssemblerCommand(['sample', 'unknown']);
            expect(result).toContain('Unknown sample type');
        });

        test('should handle file not found', () => {
            const result = processAssemblerCommand(['compile', 'nonexistent.asm']);
            expect(result).toContain('File not found');
        });
    });
}); 