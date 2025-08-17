const AssemblerEmulator = require('./assembler');
const TurboPascalEmulator = require('./turbopascal');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class EmulationManager {
    constructor() {
        this.assembler = new AssemblerEmulator();
        this.turbopascal = new TurboPascalEmulator();
        this.currentEmulator = null;
        this.currentFile = null;
        this.workspace = './Emulation/workspace';
        this.dockerContainer = 'retro-emulator';
        this.ensureWorkspace();
    }

    // Ensure workspace directory exists
    ensureWorkspace() {
        if (!fs.existsSync(this.workspace)) {
            fs.mkdirSync(this.workspace, { recursive: true });
        }
    }

    // Initialize Docker emulator
    async initializeDockerEmulator(type) {
        try {
            // Start Docker container if not running
            await this.startDockerContainer();
            
            switch (type.toLowerCase()) {
                case 'asm':
                case 'assembler':
                case 'x86':
                    this.currentEmulator = this.assembler;
                    return {
                        success: true,
                        message: 'Turbo Assembler 3.0 initialized in Docker container',
                        header: this.formatCRTOutput(this.assembler.displayHeader())
                    };
                
                case 'pascal':
                case 'turbopascal':
                case 'tp':
                    this.currentEmulator = this.turbopascal;
                    return {
                        success: true,
                        message: 'Turbo Pascal 7.0 initialized in Docker container',
                        header: this.formatCRTOutput(this.turbopascal.displayHeader())
                    };
                
                default:
                    return {
                        success: false,
                        message: `Unknown emulator type: ${type}. Supported types: asm, pascal`
                    };
            }
        } catch (error) {
            return {
                success: false,
                message: `Failed to initialize Docker emulator: ${error.message}`
            };
        }
    }

    // Start Docker container
    async startDockerContainer() {
        return new Promise((resolve, reject) => {
            exec(`docker start ${this.dockerContainer}`, (error, stdout, stderr) => {
                if (error && !error.message.includes('already started')) {
                    // Try to run container if it doesn't exist
                    exec(`docker-compose up -d retro-emulator`, (error2, stdout2, stderr2) => {
                        if (error2) {
                            reject(new Error(`Failed to start Docker container: ${error2.message}`));
                        } else {
                            resolve(stdout2);
                        }
                    });
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    // Load file from Docker container
    async loadDockerFile(filename) {
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

    // Compile in Docker container
    async compileDocker(sourceCode, type) {
        if (!this.currentEmulator) {
            return {
                success: false,
                display: 'No emulator initialized. Use "run asm" or "run pascal" first.'
            };
        }

        try {
            let result;
            if (type === 'asm') {
                result = await this.executeDockerCommand(`/usr/local/bin/run-assembler.sh ${this.currentFile}`);
            } else if (type === 'pascal') {
                result = await this.executeDockerCommand(`/usr/local/bin/run-pascal.sh ${this.currentFile}`);
            } else {
                return {
                    success: false,
                    display: `Unknown compilation type: ${type}`
                };
            }

            return {
                success: true,
                display: this.formatCRTOutput(result)
            };
        } catch (error) {
            return {
                success: false,
                display: this.formatCRTOutput(`Compilation error: ${error.message}`)
            };
        }
    }

    // Execute in Docker container
    async executeDocker(type) {
        if (!this.currentEmulator) {
            return {
                success: false,
                display: 'No emulator initialized. Use "run asm" or "run pascal" first.'
            };
        }

        try {
            let result;
            if (type === 'asm') {
                result = await this.executeDockerCommand(`cd /workspace/output && ./${this.currentFile.replace('.asm', '')}`);
            } else if (type === 'pascal') {
                result = await this.executeDockerCommand(`cd /workspace/output && ./${this.currentFile.replace('.pas', '')}`);
            } else {
                return {
                    success: false,
                    display: `Unknown execution type: ${type}`
                };
            }

            return {
                success: true,
                display: this.formatCRTOutput(result)
            };
        } catch (error) {
            return {
                success: false,
                display: this.formatCRTOutput(`Execution error: ${error.message}`)
            };
        }
    }

    // Execute command in Docker container
    async executeDockerCommand(command) {
        return new Promise((resolve, reject) => {
            exec(`docker exec ${this.dockerContainer} ${command}`, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Docker command failed: ${error.message}`));
                } else {
                    resolve(stdout || stderr || '');
                }
            });
        });
    }

    // Create sample program
    createSample(emulatorType, programType) {
        const samples = {
            asm: {
                'hello': `.model small
.stack 100h
.data
    message db 'Hello, World!', 0dh, 0ah, '$'
.code
    mov ax, @data
    mov ds, ax
    
    ; Вывод сообщения
    mov ah, 09h
    mov dx, offset message
    int 21h
    
    ; Выход
    mov ah, 4ch
    int 21h
end`,
                'add': `.model small
.stack 100h
.data
    msg1 db 'Enter first number: ', 0dh, 0ah, '$'
    msg2 db 'Enter second number: ', 0dh, 0ah, '$'
    msg3 db 'Sum is: ', 0dh, 0ah, '$'
.code
    mov ax, @data
    mov ds, ax
    
    ; Вывод первого сообщения
    mov ah, 09h
    mov dx, offset msg1
    int 21h
    
    ; Выход
    mov ah, 4ch
    int 21h
end`,
                'factorial': `.model small
.stack 100h
.data
    msg db 'Factorial of 5 is: ', 0dh, 0ah, '$'
.code
    mov ax, @data
    mov ds, ax
    
    ; Простой факториал 5
    mov ax, 1
    mov cx, 5

factorial_loop:
    mul cx
    dec cx
    jnz factorial_loop
    
    ; Выход
    mov ah, 4ch
    int 21h
end`
            },
            pascal: {
                'hello': `program HelloWorld;
begin
    writeln('Hello, World!');
    writeln('Welcome to Free Pascal!');
end.`,
                'calculator': `program Calculator;
var
    a, b: integer;
    choice: char;
begin
    writeln('Simple Calculator');
    writeln('Enter first number: ');
    readln(a);
    writeln('Enter second number: ');
    readln(b);
    writeln('Choose operation (+, -, *, /): ');
    readln(choice);
    
    case choice of
        '+': writeln('Result: ', a + b);
        '-': writeln('Result: ', a - b);
        '*': writeln('Result: ', a * b);
        '/': if b <> 0 then writeln('Result: ', a / b) else writeln('Division by zero!');
    else
        writeln('Invalid operation');
    end;
end.`,
                'factorial': `program Factorial;
var
    n, i, fact: integer;
begin
    writeln('Enter a number: ');
    readln(n);
    fact := 1;
    
    for i := 1 to n do
        fact := fact * i;
    
    writeln('Factorial of ', n, ' is ', fact);
end.`
            }
        };

        if (!samples[emulatorType] || !samples[emulatorType][programType]) {
            return {
                success: false,
                message: `Unknown sample type: ${emulatorType}/${programType}`
            };
        }

        const sourceCode = samples[emulatorType][programType];
        const filename = emulatorType === 'asm' ? `${programType}.asm` : `${programType}.pas`;
        const filePath = path.join(this.workspace, filename);
        fs.writeFileSync(filePath, sourceCode, 'utf8');

        return {
            success: true,
            message: `Sample program created`,
            sourceCode: sourceCode
        };
    }

    // Create Docker sample
    async createDockerSample(emulatorType, programType) {
        const samples = {
            asm: {
                'hello.asm': `; Hello World программа для NASM
section .data
    message db 'Hello, World!', 0xa
    message_length equ $ - message

section .text
    global _start

_start:
    ; Вывод сообщения
    mov eax, 4          ; sys_write
    mov ebx, 1          ; stdout
    mov ecx, message    ; сообщение
    mov edx, message_length ; длина
    int 0x80

    ; Выход
    mov eax, 1          ; sys_exit
    mov ebx, 0          ; код выхода 0
    int 0x80`,
                'add.asm': `; Программа сложения двух чисел
section .data
    msg1 db 'Enter first number: ', 0xa
    len1 equ $ - msg1
    msg2 db 'Enter second number: ', 0xa
    len2 equ $ - msg2
    msg3 db 'Sum is: ', 0xa
    len3 equ $ - msg3

section .bss
    num1 resb 2
    num2 resb 2
    sum resb 2

section .text
    global _start

_start:
    ; Вывод первого сообщения
    mov eax, 4
    mov ebx, 1
    mov ecx, msg1
    mov edx, len1
    int 0x80

    ; Выход
    mov eax, 1
    mov ebx, 0
    int 0x80`,
                'factorial.asm': `; Программа вычисления факториала
section .data
    msg db 'Factorial of 5 is: ', 0xa
    len equ $ - msg

section .text
    global _start

_start:
    ; Простой факториал 5
    mov eax, 1
    mov ecx, 5

factorial_loop:
    mul ecx
    dec ecx
    jnz factorial_loop

    ; Выход
    mov eax, 1
    mov ebx, 0
    int 0x80`
            },
            pascal: {
                'hello.pas': `program HelloWorld;
begin
    writeln('Hello, World!');
    writeln('Welcome to Free Pascal!');
end.`,
                'calculator.pas': `program Calculator;
var
    a, b: integer;
    choice: char;
begin
    writeln('Simple Calculator');
    writeln('Enter first number: ');
    readln(a);
    writeln('Enter second number: ');
    readln(b);
    writeln('Choose operation (+, -, *, /): ');
    readln(choice);
    
    case choice of
        '+': writeln('Result: ', a + b);
        '-': writeln('Result: ', a - b);
        '*': writeln('Result: ', a * b);
        '/': if b <> 0 then writeln('Result: ', a / b) else writeln('Division by zero!');
    else
        writeln('Invalid operation');
    end;
end.`,
                'factorial.pas': `program Factorial;
var
    n, i, fact: integer;
begin
    writeln('Enter a number: ');
    readln(n);
    fact := 1;
    
    for i := 1 to n do
        fact := fact * i;
    
    writeln('Factorial of ', n, ' is ', fact);
end.`
            }
        };

        if (!samples[emulatorType] || !samples[emulatorType][programType]) {
            return {
                success: false,
                message: `Unknown sample type: ${emulatorType}/${programType}`
            };
        }

        const sourceCode = samples[emulatorType][programType];
        const filePath = path.join(this.workspace, programType);
        fs.writeFileSync(filePath, sourceCode, 'utf8');

        return {
            success: true,
            message: `Sample ${programType} created in workspace`,
            sourceCode: sourceCode
        };
    }

    // Execute DOS command
    async executeDOSCommand(command) {
        return new Promise((resolve, reject) => {
            const dosCommand = `docker exec dosbox-emulator dosbox -c "${command}"`;
            
            exec(dosCommand, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        success: false,
                        display: this.formatCRTOutput(`DOS Command failed: ${error.message}`)
                    });
                } else {
                    resolve({
                        success: true,
                        display: this.formatCRTOutput(`DOS Command: ${command}\nOutput:\n${stdout || stderr || ''}`)
                    });
                }
            });
        });
    }

    // Execute QEMU command
    async executeQEMUCommand(command) {
        return new Promise((resolve, reject) => {
            const qemuCommand = `docker exec qemu-emulator qemu-system-x86_64 -h`;
            
            exec(qemuCommand, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        success: false,
                        display: this.formatCRTOutput(`QEMU Command failed: ${error.message}`)
                    });
                } else {
                    resolve({
                        success: true,
                        display: this.formatCRTOutput(`QEMU Command: ${command}\nOutput:\n${stdout || stderr || ''}`)
                    });
                }
            });
        });
    }

    // Execute SSH command
    executeSSHCommand(command) {
        return new Promise((resolve, reject) => {
            const sshCommand = `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@localhost -p 2222 "${command}"`;
            
            exec(sshCommand, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        success: false,
                        display: this.formatCRTOutput(`SSH Command failed: ${error.message}`)
                    });
                } else {
                    resolve({
                        success: true,
                        display: this.formatCRTOutput(`SSH Command: ${command}\nOutput:\n${stdout || stderr || ''}`)
                    });
                }
            });
        });
    }

    // Get Docker container status
    async getDockerStatus() {
        return new Promise((resolve, reject) => {
            exec('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Failed to get Docker status: ${error.message}`));
                } else {
                    resolve({
                        success: true,
                        display: this.formatCRTOutput(`Docker Containers Status:\n${stdout}`)
                    });
                }
            });
        });
    }

    // Start all Docker containers
    async startAllContainers() {
        return new Promise((resolve, reject) => {
            exec('docker-compose up -d', (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Failed to start containers: ${error.message}`));
                } else {
                    resolve({
                        success: true,
                        display: this.formatCRTOutput(`All containers started successfully:\n${stdout}`)
                    });
                }
            });
        });
    }

    // Stop all Docker containers
    async stopAllContainers() {
        return new Promise((resolve, reject) => {
            exec('docker-compose down', (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Failed to stop containers: ${error.message}`));
                } else {
                    resolve({
                        success: true,
                        display: this.formatCRTOutput(`All containers stopped successfully:\n${stdout}`)
                    });
                }
            });
        });
    }

    // Get container logs
    async getContainerLogs(containerName = 'retro-emulator') {
        return new Promise((resolve, reject) => {
            exec(`docker logs ${containerName} --tail 50`, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Failed to get logs: ${error.message}`));
                } else {
                    resolve({
                        success: true,
                        display: this.formatCRTOutput(`Container logs for ${containerName}:\n${stdout}`)
                    });
                }
            });
        });
    }

    // Format output in CRT monitor style
    formatCRTOutput(text) {
        const timestamp = new Date().toLocaleTimeString();
        return `[${timestamp}] ${text}\n> `;
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