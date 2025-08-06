const EmulationManager = require('../Emulation/emulation_manager');
const TurboPascalEmulator = require('../Emulation/turbopascal');
const AssemblerEmulator = require('../Emulation/assembler');
const fs = require('fs');
const path = require('path');

describe('Emulation Tests', () => {
    let emulationManager;
    let turboPascal;
    let assembler;

    beforeEach(() => {
        emulationManager = new EmulationManager();
        turboPascal = new TurboPascalEmulator();
        assembler = new AssemblerEmulator();
    });

    describe('EmulationManager', () => {
        test('should initialize assembler emulator', () => {
            const result = emulationManager.initializeEmulator('asm');
            expect(result.success).toBe(true);
            expect(result.message).toContain('Turbo Assembler 3.0 initialized');
            expect(result.header).toContain('Turbo Assembler 3.0');
        });

        test('should initialize pascal emulator', () => {
            const result = emulationManager.initializeEmulator('pascal');
            expect(result.success).toBe(true);
            expect(result.message).toContain('Turbo Pascal 7.0 initialized');
            expect(result.header).toContain('Turbo Pascal 7.0');
        });

        test('should reject unknown emulator', () => {
            const result = emulationManager.initializeEmulator('unknown');
            expect(result.success).toBe(false);
            expect(result.message).toContain('Unknown emulator type');
        });

        test('should create sample assembler program', () => {
            const result = emulationManager.createSample('asm', 'hello');
            expect(result.success).toBe(true);
            expect(result.sourceCode).toContain('.model small');
            expect(result.sourceCode).toContain('int 21h');
        });

        test('should create sample pascal program', () => {
            const result = emulationManager.createSample('pascal', 'hello');
            expect(result.success).toBe(true);
            expect(result.sourceCode).toContain('program');
            expect(result.sourceCode).toContain('writeln');
        });

        test('should list files in workspace', () => {
            const result = emulationManager.listFiles();
            expect(result.success).toBe(true);
            expect(Array.isArray(result.files)).toBe(true);
        });

        test('should get help for assembler', () => {
            const result = emulationManager.getHelp('asm');
            expect(result.success).toBe(true);
            expect(result.help).toContain('Available commands');
        });

        test('should get help for pascal', () => {
            const result = emulationManager.getHelp('pascal');
            expect(result.success).toBe(true);
            expect(result.help).toContain('Available commands');
        });
    });

    describe('TurboPascalEmulator', () => {
        test('should display header correctly', () => {
            const header = turboPascal.displayHeader();
            expect(header).toContain('Turbo Pascal 7.0');
            expect(header).toContain('Borland International');
        });

        test('should tokenize simple pascal code', () => {
            const sourceCode = 'program test; begin writeln("Hello"); end.';
            const tokens = turboPascal.tokenize(sourceCode);
            expect(tokens.length).toBeGreaterThan(0);
            expect(tokens.some(t => t.value === 'program')).toBe(true);
            expect(tokens.some(t => t.value === 'writeln')).toBe(true);
            expect(tokens.some(t => t.value === '"hello"')).toBe(true);
        });

        test('should compile simple pascal program', () => {
            const sourceCode = 'program test; begin writeln("Hello"); end.';
            const result = turboPascal.compile(sourceCode);
            expect(result.success).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        test('should execute simple pascal program', () => {
            const sourceCode = 'program test; begin writeln("Hello"); end.';
            const compileResult = turboPascal.compile(sourceCode);
            expect(compileResult.success).toBe(true);
            const result = turboPascal.execute();
            expect(result.success).toBe(true);
            expect(result.output.length).toBeGreaterThan(0);
        });


    });

    describe('AssemblerEmulator', () => {
        test('should display header correctly', () => {
            const header = assembler.displayHeader();
            expect(header).toContain('Turbo Assembler 3.0');
            expect(header).toContain('Borland International');
        });

        test('should parse assembler directives', () => {
            const directive = assembler.parseDirective('.model small');
            expect(directive).toBeDefined();
            expect(directive.type).toBe('directive');
            expect(directive.name).toBe('model');
        });

        test('should parse assembler instructions', () => {
            const instruction = assembler.parseInstruction('mov ax, 1');
            expect(instruction).toBeDefined();
            expect(instruction.type).toBe('instruction');
            expect(instruction.name).toBe('mov');
        });

        test('should assemble simple program', () => {
            const sourceCode = `
.model small
.code
start:
    mov ax, 1
    int 21h
end start
`;
            const result = assembler.assemble(sourceCode);
            expect(result.success).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        test('should execute simple assembler program', () => {
            const sourceCode = `
.model small
.code
start:
    mov ax, 1
    int 21h
end start
`;
            const assembleResult = assembler.assemble(sourceCode);
            expect(assembleResult.success).toBe(true);
            const result = assembler.execute();
            expect(result.success).toBe(true);
        });

        test('should handle assembly errors', () => {
            const sourceCode = `
.model small
.code
start:
    mov ax, 1
    invalid_instruction
end start
`;
            const result = assembler.assemble(sourceCode);
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('File Operations', () => {
        const testFile = 'test.pas';
        const testContent = 'program test; begin writeln("Hello"); end.';

        afterEach(() => {
            // Clean up test files
            const filePath = path.join(emulationManager.workspace, testFile);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        test('should save and load files', () => {
            // Initialize emulator first
            emulationManager.initializeEmulator('pascal');
            
            // Save file
            const saveResult = emulationManager.saveFile(testFile, testContent);
            expect(saveResult.success).toBe(true);

            // Load file
            const loadResult = emulationManager.loadFile(testFile);
            expect(loadResult.success).toBe(true);
            expect(loadResult.sourceCode).toBe(testContent);
        });

        test('should handle non-existent file', () => {
            // Initialize emulator first
            emulationManager.initializeEmulator('pascal');
            
            const result = emulationManager.loadFile('nonexistent.pas');
            expect(result.success).toBe(false);
            expect(result.message).toContain('File not found');
        });
    });

    describe('Integration Tests', () => {
        test('should compile and execute pascal program through manager', () => {
            // Initialize pascal emulator
            emulationManager.initializeEmulator('pascal');
            
            // Create sample program
            const sampleResult = emulationManager.createSample('pascal', 'hello');
            expect(sampleResult.success).toBe(true);

            // Compile program
            const compileResult = emulationManager.compile(sampleResult.sourceCode);
            expect(compileResult.success).toBe(true);

            // Execute program
            const executeResult = emulationManager.execute();
            expect(executeResult.success).toBe(true);
        });


    });
}); 