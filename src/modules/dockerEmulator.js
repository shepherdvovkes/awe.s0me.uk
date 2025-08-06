const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { logInfo, logError } = require('../utils/logger');

/**
 * Docker Emulator Manager
 * Управляет эмуляторами в Docker контейнерах
 */
class DockerEmulator {
    constructor() {
        this.containerName = 'retro-emulator';
        this.workspacePath = './Emulation/workspace';
        this.outputPath = './docker/output';
    }

    /**
     * Запускает ассемблер NASM в Docker
     * @param {string} sourceCode - Исходный код
     * @param {string} filename - Имя файла
     * @returns {Promise<Object>} - Результат выполнения
     */
    async runAssembler(sourceCode, filename) {
        try {
            // Сохраняем исходный код в файл
            const filePath = path.join(this.workspacePath, 'asm', filename);
            fs.writeFileSync(filePath, sourceCode, 'utf8');

            // Запускаем компиляцию в Docker
            const command = `docker exec ${this.containerName} /usr/local/bin/run-assembler.sh ${filename}`;
            
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                output: result,
                filename: filename,
                type: 'assembler'
            };

        } catch (error) {
            logError('Docker assembler execution failed', error);
            return {
                success: false,
                error: error.message,
                type: 'assembler'
            };
        }
    }

    /**
     * Запускает Free Pascal Compiler в Docker
     * @param {string} sourceCode - Исходный код
     * @param {string} filename - Имя файла
     * @returns {Promise<Object>} - Результат выполнения
     */
    async runPascal(sourceCode, filename) {
        try {
            // Сохраняем исходный код в файл
            const filePath = path.join(this.workspacePath, 'pascal', filename);
            fs.writeFileSync(filePath, sourceCode, 'utf8');

            // Запускаем компиляцию в Docker
            const command = `docker exec ${this.containerName} /usr/local/bin/run-pascal.sh ${filename}`;
            
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                output: result,
                filename: filename,
                type: 'pascal'
            };

        } catch (error) {
            logError('Docker Pascal execution failed', error);
            return {
                success: false,
                error: error.message,
                type: 'pascal'
            };
        }
    }

    /**
     * Запускает DOS программу через DOSBox
     * @param {string} programName - Имя программы
     * @returns {Promise<Object>} - Результат выполнения
     */
    async runDOSProgram(programName) {
        try {
            const command = `docker exec dosbox-emulator /usr/local/bin/run-dosbox.sh ${programName}`;
            
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                output: result,
                program: programName,
                type: 'dos'
            };

        } catch (error) {
            logError('Docker DOS execution failed', error);
            return {
                success: false,
                error: error.message,
                type: 'dos'
            };
        }
    }

    /**
     * Запускает QEMU эмуляцию
     * @param {string} isoFile - ISO файл
     * @param {number} memory - Размер памяти в MB
     * @returns {Promise<Object>} - Результат выполнения
     */
    async runQEMU(isoFile = 'freedos.iso', memory = 128) {
        try {
            const command = `docker exec qemu-emulator /usr/local/bin/run-qemu.sh ${isoFile} ${memory}`;
            
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                output: result,
                iso: isoFile,
                memory: memory,
                type: 'qemu'
            };

        } catch (error) {
            logError('Docker QEMU execution failed', error);
            return {
                success: false,
                error: error.message,
                type: 'qemu'
            };
        }
    }

    /**
     * Получает список доступных файлов в workspace
     * @param {string} type - Тип файлов (asm, pascal, dos)
     * @returns {Promise<Array>} - Список файлов
     */
    async listFiles(type = 'asm') {
        try {
            const command = `docker exec ${this.containerName} ls -la /workspace/${type}/`;
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                files: result,
                type: type
            };

        } catch (error) {
            logError('Docker list files failed', error);
            return {
                success: false,
                error: error.message,
                type: type
            };
        }
    }

    /**
     * Создает образец программы
     * @param {string} type - Тип программы (asm, pascal)
     * @param {string} name - Имя программы
     * @returns {Promise<Object>} - Результат создания
     */
    async createSample(type, name) {
        try {
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
    int 0x80`
                },

                pascal: {
                    'hello.pas': `program HelloWorld;
begin
    writeln('Hello, World!');
    writeln('Welcome to Free Pascal!');
end.`
                }
            };

            if (!samples[type] || !samples[type][name]) {
                throw new Error(`Неизвестный тип или имя: ${type}/${name}`);
            }

            const sourceCode = samples[type][name];
            const filePath = path.join(this.workspacePath, type, name);
            fs.writeFileSync(filePath, sourceCode, 'utf8');

            return {
                success: true,
                message: `Образец ${name} создан в /workspace/${type}/`,
                filename: name,
                type: type
            };

        } catch (error) {
            logError('Docker create sample failed', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Проверяет статус Docker контейнеров
     * @returns {Promise<Object>} - Статус контейнеров
     */
    async getStatus() {
        try {
            const command = 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"';
            const result = await this.executeCommand(command);
            
            return {
                success: true,
                status: result
            };

        } catch (error) {
            logError('Docker status check failed', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Запускает Docker контейнеры
     * @returns {Promise<Object>} - Результат запуска
     */
    async startContainers() {
        try {
            const command = 'docker-compose up -d';
            const result = await this.executeCommand(command);
            
            logInfo('Docker containers started', { result });
            
            return {
                success: true,
                message: 'Контейнеры запущены',
                output: result
            };

        } catch (error) {
            logError('Docker containers start failed', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Останавливает Docker контейнеры
     * @returns {Promise<Object>} - Результат остановки
     */
    async stopContainers() {
        try {
            const command = 'docker-compose down';
            const result = await this.executeCommand(command);
            
            logInfo('Docker containers stopped', { result });
            
            return {
                success: true,
                message: 'Контейнеры остановлены',
                output: result
            };

        } catch (error) {
            logError('Docker containers stop failed', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Выполняет команду в системе
     * @param {string} command - Команда для выполнения
     * @returns {Promise<string>} - Результат выполнения
     */
    executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Command failed: ${error.message}`));
                } else {
                    resolve(stdout || stderr || '');
                }
            });
        });
    }
}

module.exports = DockerEmulator; 