const EmulationManager = require('../Emulation/emulation_manager');
const TurboPascalEmulator = require('../Emulation/turbopascal');
const AssemblerEmulator = require('../Emulation/assembler');
const { processRunCommand, processAssemblerCommand, processPascalCommand } = require('../command_processor.docker');

const path = require('path');
const fs = require('fs');

describe('Emulation System Tests', () => {
    let emulationManager;

    beforeEach(() => {
        emulationManager = new EmulationManager();
    });

    afterEach(() => {
        // Clean up test files
        const testFiles = ['test.asm', 'test.pas', 'hello.asm', 'hello.pas'];
        testFiles.forEach(file => {
            const filePath = path.join(emulationManager.workspace, file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
    });

    describe('EmulationManager', () => {
        test('should initialize assembler emulator', () => {
            const result = emulationManager.initializeEmulator('asm');
            expect(result.success).toBe(true);
            expect(result.header).toContain('Assembler');
        });

        test('should initialize pascal emulator', () => {
            const result = emulationManager.initializeEmulator('pascal');
            expect(result.success).toBe(true);
            expect(result.header).toContain('Pascal');
        });

        test('should handle unknown emulator', () => {
            const result = emulationManager.initializeEmulator('unknown');
            expect(result.success).toBe(false);
            expect(result.message).toContain('Unknown emulator');
        });

        test('should create assembler sample', () => {
            const result = emulationManager.createSample('asm', 'hello');
            expect(result.success).toBe(true);
            expect(result.sourceCode).toContain('.model small');
        });

        test('should create pascal sample', () => {
            const result = emulationManager.createSample('pascal', 'hello');
            expect(result.success).toBe(true);
            expect(result.sourceCode).toContain('program');
        });

        test('should list files', () => {
            const result = emulationManager.listFiles();
            expect(result.success).toBe(true);
            expect(Array.isArray(result.files)).toBe(true);
        });

        test('should get assembler help', () => {
            const result = emulationManager.getHelp('asm');
            expect(result.success).toBe(true);
            expect(result.help).toContain('run asm');
        });

        test('should get pascal help', () => {
            const result = emulationManager.getHelp('pascal');
            expect(result.success).toBe(true);
            expect(result.help).toContain('run pascal');
        });
    });

    describe('File Operations', () => {
        test('should save and load assembler file', () => {
            const testContent = 'section .data\n    msg db "Hello, World!", 0\nsection .text\n    global _start';
            const testFile = 'test.asm';
            
            emulationManager.initializeEmulator('asm');
            const saveResult = emulationManager.saveFile(testFile, testContent);
            expect(saveResult.success).toBe(true);
            
            const loadResult = emulationManager.loadFile(testFile);
            expect(loadResult.success).toBe(true);
            expect(loadResult.sourceCode).toBe(testContent);
        });

        test('should save and load pascal file', () => {
            const testContent = 'program Test;\nbegin\n  writeln("Hello, World!");\nend.';
            const testFile = 'test.pas';
            
            emulationManager.initializeEmulator('pascal');
            const saveResult = emulationManager.saveFile(testFile, testContent);
            expect(saveResult.success).toBe(true);
            
            const loadResult = emulationManager.loadFile(testFile);
            expect(loadResult.success).toBe(true);
            expect(loadResult.sourceCode).toBe(testContent);
        });

        test('should handle non-existent file', () => {
            emulationManager.initializeEmulator('pascal');
            const result = emulationManager.loadFile('nonexistent.pas');
            expect(result.success).toBe(false);
            expect(result.message).toContain('File not found');
        });
    });

    describe('Compilation and Execution', () => {
        test('should compile and execute assembler sample', () => {
            emulationManager.initializeEmulator('asm');
            const sampleResult = emulationManager.createSample('asm', 'hello');
            expect(sampleResult.success).toBe(true);
            
            const compileResult = emulationManager.compile(sampleResult.sourceCode);
            expect(compileResult.success).toBe(true);
            
            const executeResult = emulationManager.execute();
            expect(executeResult.success).toBe(true);
            expect(executeResult.display).toContain('Program Execution Results');
        });

        test('should compile and execute pascal sample', () => {
            emulationManager.initializeEmulator('pascal');
            const sampleResult = emulationManager.createSample('pascal', 'hello');
            expect(sampleResult.success).toBe(true);
            
            const compileResult = emulationManager.compile(sampleResult.sourceCode);
            expect(compileResult.success).toBe(true);
            
            const executeResult = emulationManager.execute();
            expect(executeResult.success).toBe(true);
            expect(executeResult.display).toContain('Program Execution Results');
        });
    });

    describe('Command Processor Integration', () => {
        test('debug: check processRunCommand return type', async () => {
            const result = await processRunCommand('run asm');
            console.log('processRunCommand result:', result);
            console.log('typeof result:', typeof result);
            if (typeof result === 'object') {
                console.log('result keys:', Object.keys(result));
            }
            expect(typeof result).toBe('string');
        });

        test('should process run asm command', async () => {
            const result = await processRunCommand('run asm');
            expect(typeof result).toBe('string');
            expect(result).toContain('Assembler');
        });

        test('should process run pascal command', async () => {
            const result = await processRunCommand('run pascal');
            expect(typeof result).toBe('string');
            expect(result).toContain('Pascal');
        });

        test('should process run asm sample command', async () => {
            const result = await processRunCommand('run asm sample hello');
            expect(typeof result).toBe('string');
            expect(result).toContain('Sample program created');
        });

        test('should process run pascal sample command', async () => {
            const result = await processRunCommand('run pascal sample hello');
            expect(typeof result).toBe('string');
            expect(result).toContain('Sample program created');
        });

        test('should process run asm help command', async () => {
            const result = await processRunCommand('run asm help');
            expect(typeof result).toBe('string');
            expect(result).toContain('run asm');
        });

        test('should process run pascal help command', async () => {
            const result = await processRunCommand('run pascal help');
            expect(typeof result).toBe('string');
            expect(result).toContain('run pascal');
        });

        test('should process run list command', async () => {
            const result = await processRunCommand('run list');
            expect(typeof result).toBe('string');
            expect(result).toContain('WORKSPACE FILES');
        });

        test('should handle unknown run command', async () => {
            const result = await processRunCommand('run unknown');
            expect(typeof result).toBe('string');
            expect(result).toContain('Unknown emulator');
        });

        test('should handle run command without arguments', async () => {
            const result = await processRunCommand('run');
            expect(typeof result).toBe('string');
            expect(result).toContain('Usage: run');
        });
    });

    describe('Assembler Commands', () => {
        test('should process assembler help', () => {
            const result = processAssemblerCommand(['help']);
            expect(result).toContain('run asm');
        });

        test('should process assembler sample', () => {
            const result = processAssemblerCommand(['sample', 'hello']);
            expect(result).toContain('Sample program created');
            expect(result).toContain('.model small');
        });

        test('should handle assembler sample without type', () => {
            const result = processAssemblerCommand(['sample']);
            expect(result).toContain('Usage: run asm sample');
        });

        test('should handle assembler compile without filename', () => {
            const result = processAssemblerCommand(['compile']);
            expect(result).toContain('Usage: run asm compile');
        });

        test('should handle assembler execute without filename', () => {
            const result = processAssemblerCommand(['execute']);
            expect(result).toContain('Usage: run asm execute');
        });
    });

    describe('Pascal Commands', () => {
        test('should process pascal help', () => {
            const result = processPascalCommand(['help']);
            expect(result).toContain('run pascal');
        });

        test('should process pascal sample', () => {
            const result = processPascalCommand(['sample', 'hello']);
            expect(result).toContain('Sample program created');
            expect(result).toContain('program');
        });

        test('should handle pascal sample without type', () => {
            const result = processPascalCommand(['sample']);
            expect(result).toContain('Usage: run pascal sample');
        });

        test('should handle pascal compile without filename', () => {
            const result = processPascalCommand(['compile']);
            expect(result).toContain('Usage: run pascal compile');
        });

        test('should handle pascal execute without filename', () => {
            const result = processPascalCommand(['execute']);
            expect(result).toContain('Usage: run pascal execute');
        });
    });

    describe('Error Handling', () => {
        test('should handle compilation errors', () => {
            emulationManager.initializeEmulator('asm');
            const invalidCode = 'invalid assembler code';
            const result = emulationManager.compile(invalidCode);
            expect(result.success).toBe(false);
            expect(result.display).toContain('Assembly failed');
        });

        test('should handle execution without compilation', () => {
            emulationManager.initializeEmulator('asm');
            const result = emulationManager.execute();
            expect(result.success).toBe(true);
            expect(result.display).toContain('Program Execution Results');
        });

        test('should handle file operations without initialization', () => {
            const result = emulationManager.loadFile('test.asm');
            expect(result.success).toBe(false);
            expect(result.message).toContain('No emulator initialized');
        });
    });
}); 