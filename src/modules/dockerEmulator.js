const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/app');

/**
 * Manages emulators in Docker containers
 */
class DockerEmulator {
    constructor() {
        this.workspacePath = path.join(__dirname, '../../Emulation/workspace');
    }

    /**
     * Runs NASM assembler in Docker
     * @param {string} sourceCode - Source code
     * @param {Object} options - Compilation options
     * @returns {Promise<Object>} - Execution result
     */
    async runAssembler(sourceCode, options = {}) {
        try {
            // Save source code to file
            const fileName = options.fileName || 'program.asm';
            const filePath = path.join(this.workspacePath, 'asm', fileName);
            
            // Run compilation in Docker
            const command = `docker run --rm -v "${this.workspacePath}:/workspace" nasm:latest bash -c "cd /workspace/asm && nasm -f elf64 ${fileName} -o ${fileName.replace('.asm', '.o')} && ld ${fileName.replace('.asm', '.o')} -o ${fileName.replace('.asm', '')} && ./${fileName.replace('.asm', '')}"`;
            
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                output: result,
                fileName: fileName
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                output: error.stdout || error.stderr || ''
            };
        }
    }

    /**
     * Runs Free Pascal Compiler in Docker
     * @param {string} sourceCode - Source code
     * @param {Object} options - Compilation options
     * @returns {Promise<Object>} - Execution result
     */
    async runPascal(sourceCode, options = {}) {
        try {
            // Save source code to file
            const fileName = options.fileName || 'program.pas';
            const filePath = path.join(this.workspacePath, 'pascal', fileName);
            
            // Run compilation in Docker
            const command = `docker run --rm -v "${this.workspacePath}:/workspace" fpc:latest bash -c "cd /workspace/pascal && fpc ${fileName} && ./${fileName.replace('.pas', '')}"`;
            
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                output: result,
                fileName: fileName
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                output: error.stdout || error.stderr || ''
            };
        }
    }

    /**
     * Runs DOS program through DOSBox
     * @param {string} programName - Program name
     * @param {Object} options - Execution options
     * @returns {Promise<Object>} - Execution result
     */
    async runDOS(programName, options = {}) {
        try {
            const command = `docker run --rm -v "${this.workspacePath}:/workspace" dosbox:latest bash -c "cd /workspace/dos && dosbox -c 'mount c /workspace/dos' -c 'c:' -c '${programName}' -c 'exit'"`;
            
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                output: result,
                programName: programName
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                output: error.stdout || error.stderr || ''
            };
        }
    }

    /**
     * Runs QEMU emulation
     * @param {string} imagePath - Path to disk image
     * @param {Object} options - Emulation options
     * @returns {Promise<Object>} - Execution result
     */
    async runQEMU(imagePath, options = {}) {
        try {
            const command = `docker run --rm -v "${this.workspacePath}:/workspace" qemu:latest qemu-system-x86_64 -hda /workspace/${imagePath} -m 512 -display sdl`;
            
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                output: result,
                imagePath: imagePath
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                output: error.stdout || error.stderr || ''
            };
        }
    }

    /**
     * Gets list of available files in workspace
     * @param {string} subdirectory - Subdirectory to list
     * @returns {Promise<Array>} - List of files
     */
    async getFiles(subdirectory = '') {
        try {
            const targetPath = path.join(this.workspacePath, subdirectory);
            const files = await fs.readdir(targetPath);
            
            return {
                success: true,
                files: files,
                path: targetPath
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Creates sample program
     * @param {string} type - Program type (asm, pascal, dos)
     * @param {Object} options - Creation options
     * @returns {Promise<Object>} - Creation result
     */
    async createSample(type, options = {}) {
        const samples = {
            'hello.asm': `; Hello World program for NASM
section .data
    message db 'Hello, World!', 0xa
    message_length equ $ - message

section .text
    global _start

_start:
    ; Print message
    mov eax, 4          ; sys_write
    mov ebx, 1          ; stdout
    mov ecx, message    ; message
    mov edx, message_length ; length
    int 0x80

    ; Exit
    mov eax, 1          ; sys_exit
    mov ebx, 0          ; exit code 0
    int 0x80`,
            
            'hello.pas': `program HelloWorld;
begin
    writeln('Hello, World!');
    writeln('Welcome to Free Pascal!');
end.`,
            
            'hello.bat': `@echo off
echo Hello, World!
echo Welcome to DOS!
pause`
        };

        try {
            const fileName = options.fileName || `hello.${type}`;
            const filePath = path.join(this.workspacePath, type === 'asm' ? 'asm' : type === 'pascal' ? 'pascal' : 'dos', fileName);
            
            await fs.writeFile(filePath, samples[fileName] || '');
            
            return {
                success: true,
                fileName: fileName,
                content: samples[fileName]
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Checks Docker container status
     * @returns {Promise<Object>} - Container status
     */
    async getStatus() {
        try {
            const command = 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"';
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                status: result,
                containers: result.split('\n').filter(line => line.trim())
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Starts Docker containers
     * @returns {Promise<Object>} - Start result
     */
    async startContainers() {
        try {
            const command = 'docker-compose up -d';
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                message: 'Containers started',
                output: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stops Docker containers
     * @returns {Promise<Object>} - Stop result
     */
    async stopContainers() {
        try {
            const command = 'docker-compose down';
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                message: 'Containers stopped',
                output: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Executes command in system
     * @param {string} command - Command to execute
     * @returns {Promise<string>} - Execution result
     */
    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    reject({ error, stdout, stderr });
                } else {
                    resolve(stdout);
                }
            });
        });
    }
}

module.exports = DockerEmulator; 