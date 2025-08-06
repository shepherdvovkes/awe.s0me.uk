const AssemblerEmulator = require('./assembler');
const TurboPascalEmulator = require('./turbopascal');
const fs = require('fs');
const path = require('path');

class EmulationManager {
    constructor() {
        this.assembler = new AssemblerEmulator();
        this.turbopascal = new TurboPascalEmulator();
        this.currentEmulator = null;
        this.currentFile = null;
        this.workspace = './Emulation/workspace';
        this.ensureWorkspace();
    }

    // Ensure workspace directory exists
    ensureWorkspace() {
        if (!fs.existsSync(this.workspace)) {
            fs.mkdirSync(this.workspace, { recursive: true });
        }
    }

    // Initialize emulator based on type
    initializeEmulator(type) {
        switch (type.toLowerCase()) {
            case 'asm':
            case 'assembler':
            case 'x86':
                this.currentEmulator = this.assembler;
                return {
                    success: true,
                    message: 'Turbo Assembler 3.0 initialized',
                    header: this.assembler.displayHeader()
                };
            
            case 'pascal':
            case 'turbopascal':
            case 'tp':
                this.currentEmulator = this.turbopascal;
                return {
                    success: true,
                    message: 'Turbo Pascal 7.0 initialized',
                    header: this.turbopascal.displayHeader()
                };
            
            default:
                return {
                    success: false,
                    message: `Unknown emulator type: ${type}. Supported types: asm, pascal`
                };
        }
    }

    // Load source code from file
    loadFile(filename) {
        if (!this.currentEmulator) {
            return {
                success: false,
                message: 'No emulator initialized. Use "run asm" or "run pascal" first.'
            };
        }

        const filePath = path.join(this.workspace, filename);
        
        try {
            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    message: `File not found: ${filename}`
                };
            }

            const sourceCode = fs.readFileSync(filePath, 'utf8');
            this.currentFile = filename;
            
            return {
                success: true,
                message: `File loaded: ${filename}`,
                sourceCode: sourceCode,
                lines: sourceCode.split('\n').length
            };
        } catch (error) {
            return {
                success: false,
                message: `Error loading file: ${error.message}`
            };
        }
    }

    // Save source code to file
    saveFile(filename, sourceCode) {
        const filePath = path.join(this.workspace, filename);
        
        try {
            fs.writeFileSync(filePath, sourceCode, 'utf8');
            this.currentFile = filename;
            
            return {
                success: true,
                message: `File saved: ${filename}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Error saving file: ${error.message}`
            };
        }
    }

    // Compile current source code
    compile(sourceCode) {
        if (!this.currentEmulator) {
            return {
                success: false,
                message: 'No emulator initialized'
            };
        }

        if (this.currentEmulator === this.assembler) {
            const result = this.assembler.assemble(sourceCode);
            return {
                success: result.success,
                message: result.success ? 'Assembly completed successfully' : 'Assembly failed',
                result: result,
                display: this.assembler.displayResults(result)
            };
        } else if (this.currentEmulator === this.turbopascal) {
            const result = this.turbopascal.compile(sourceCode);
            return {
                success: result.success,
                message: result.success ? 'Compilation completed successfully' : 'Compilation failed',
                result: result,
                display: this.turbopascal.displayResults(result)
            };
        }
    }

    // Execute compiled code
    execute() {
        if (!this.currentEmulator) {
            return {
                success: false,
                message: 'No emulator initialized'
            };
        }

        if (this.currentEmulator === this.assembler) {
            const result = this.assembler.execute();
            return {
                success: true,
                message: 'Program executed successfully',
                result: result,
                display: this.assembler.displayExecutionResults(result)
            };
        } else if (this.currentEmulator === this.turbopascal) {
            const result = this.turbopascal.execute();
            return {
                success: true,
                message: 'Program executed successfully',
                result: result,
                display: this.turbopascal.displayExecutionResults(result)
            };
        }
    }

    // Compile and execute in one step
    compileAndExecute(sourceCode) {
        const compileResult = this.compile(sourceCode);
        
        if (!compileResult.success) {
            return compileResult;
        }

        const executeResult = this.execute();
        
        return {
            success: executeResult.success,
            message: `${compileResult.message}. ${executeResult.message}`,
            compileResult: compileResult.result,
            executeResult: executeResult.result,
            display: `${compileResult.display}\n\n${executeResult.display}`
        };
    }

    // List workspace files
    listFiles() {
        try {
            const files = fs.readdirSync(this.workspace);
            const fileList = files.map(file => {
                const filePath = path.join(this.workspace, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime,
                    type: path.extname(file).toLowerCase()
                };
            });

            return {
                success: true,
                files: fileList,
                message: `Found ${fileList.length} files in workspace`
            };
        } catch (error) {
            return {
                success: false,
                message: `Error listing files: ${error.message}`
            };
        }
    }

    // Create sample programs
    createSample(emulatorType, programType) {
        let sourceCode = '';
        let filename = '';

        if (emulatorType === 'asm') {
            switch (programType) {
                case 'hello':
                    filename = 'hello.asm';
                    sourceCode = [
                        '.model small',
                        '.stack 100h',
                        '.data',
                        '    message db "Hello, World!$"',
                        '.code',
                        'start:',
                        '    mov ah, 09h',
                        '    mov dx, offset message',
                        '    int 21h',
                        '    mov ah, 4Ch',
                        '    int 21h',
                        'end start'
                    ].join('\n');
                    break;
                
                case 'add':
                    filename = 'add.asm';
                    sourceCode = [
                        '.model small',
                        '.stack 100h',
                        '.data',
                        '    num1 db 5',
                        '    num2 db 3',
                        '    result db ?',
                        '.code',
                        'start:',
                        '    mov al, num1',
                        '    add al, num2',
                        '    mov result, al',
                        '    mov ah, 4Ch',
                        '    int 21h',
                        'end start'
                    ].join('\n');
                    break;
                
                default:
                    return {
                        success: false,
                        message: `Unknown sample type: ${programType}. Available: hello, add`
                    };
            }
        } else if (emulatorType === 'pascal') {
            switch (programType) {
                case 'hello':
                    filename = 'hello.pas';
                    sourceCode = [
                        'program Hello;',
                        'begin',
                        '    writeln("Hello, World!");',
                        'end.'
                    ].join('\n');
                    break;
                
                case 'factorial':
                    filename = 'factorial.pas';
                    sourceCode = [
                        'program Factorial;',
                        'var',
                        '    n, i, fact: integer;',
                        'begin',
                        '    n := 5;',
                        '    fact := 1;',
                        '    for i := 1 to n do',
                        '        fact := fact * i;',
                        '    writeln("Factorial of ", n, " is ", fact);',
                        'end.'
                    ].join('\n');
                    break;
                
                case 'calculator':
                    filename = 'calculator.pas';
                    sourceCode = [
                        'program Calculator;',
                        'var',
                        '    a, b, sum: integer;',
                        'begin',
                        '    a := 10;',
                        '    b := 20;',
                        '    sum := a + b;',
                        '    writeln(a, " + ", b, " = ", sum);',
                        'end.'
                    ].join('\n');
                    break;
                
                default:
                    return {
                        success: false,
                        message: `Unknown sample type: ${programType}. Available: hello, factorial, calculator`
                    };
            }
        } else {
            return {
                success: false,
                message: `Unknown emulator type: ${emulatorType}`
            };
        }

        const saveResult = this.saveFile(filename, sourceCode);
        
        if (saveResult.success) {
            return {
                success: true,
                message: `Sample program created: ${filename}`,
                filename: filename,
                sourceCode: sourceCode
            };
        } else {
            return saveResult;
        }
    }

    // Get help information
    getHelp(emulatorType) {
        if (emulatorType === 'asm') {
            return {
                success: true,
                message: 'Turbo Assembler 3.0 Help',
                help: [
                    'Available commands:',
                    '  run asm <filename> - Load and assemble file',
                    '  run asm compile <filename> - Compile only',
                    '  run asm execute <filename> - Execute only',
                    '  run asm sample <type> - Create sample program',
                    '',
                    'Sample types:',
                    '  hello - Hello World program',
                    '  add - Simple addition program',
                    '',
                    'Supported directives:',
                    '  .model, .stack, .data, .code',
                    '',
                    'Supported instructions:',
                    '  mov, add, sub, cmp, jmp, je, jne, call, ret, int, push, pop'
                ].join('\n')
            };
        } else if (emulatorType === 'pascal') {
            return {
                success: true,
                message: 'Turbo Pascal 7.0 Help',
                help: [
                    'Available commands:',
                    '  run pascal <filename> - Load and compile file',
                    '  run pascal compile <filename> - Compile only',
                    '  run pascal execute <filename> - Execute only',
                    '  run pascal sample <type> - Create sample program',
                    '',
                    'Sample types:',
                    '  hello - Hello World program',
                    '  factorial - Factorial calculation',
                    '  calculator - Simple calculator',
                    '',
                    'Supported statements:',
                    '  write, writeln, read, readln, if, while, for, assignment',
                    '',
                    'Supported types:',
                    '  integer, real, boolean, char, string'
                ].join('\n')
            };
        } else {
            return {
                success: true,
                message: 'Emulation Manager Help',
                help: [
                    'Available emulators:',
                    '  asm - Turbo Assembler 3.0 (x86)',
                    '  pascal - Turbo Pascal 7.0',
                    '',
                    'General commands:',
                    '  run <emulator> - Initialize emulator',
                    '  run <emulator> <filename> - Load and process file',
                    '  run <emulator> sample <type> - Create sample program',
                    '  run <emulator> help - Show emulator help',
                    '  run list - List workspace files'
                ].join('\n')
            };
        }
    }

    // Get current status
    getStatus() {
        return {
            currentEmulator: this.currentEmulator ? 
                (this.currentEmulator === this.assembler ? 'Turbo Assembler 3.0' : 'Turbo Pascal 7.0') : 
                'None',
            currentFile: this.currentFile || 'None',
            workspace: this.workspace
        };
    }
}

module.exports = EmulationManager; 