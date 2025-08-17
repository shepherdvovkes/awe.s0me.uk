const fs = require('fs');
const path = require('path');

class AssemblerEmulator {
    constructor() {
        this.memory = new Array(65536).fill(0); // 64KB memory
        this.registers = {
            ax: 0, bx: 0, cx: 0, dx: 0,
            si: 0, di: 0, sp: 0xFFFE, bp: 0,
            cs: 0x1000, ds: 0x1000, es: 0x1000, ss: 0x1000,
            ip: 0, flags: 0
        };
        this.labels = new Map();
        this.symbols = new Map();
        this.currentAddress = 0x100;
        this.sourceCode = '';
        this.objectCode = [];
        this.errors = [];
        this.warnings = [];
    }

    // Turbo Assembler style interface
    displayHeader() {
        return [
            '╔══════════════════════════════════════════════════════════════╗',
            '║                    Turbo Assembler 3.0                       ║',
            '║                    Copyright (C) 1989-1992                   ║',
            '║                    Borland International                     ║',
            '╚══════════════════════════════════════════════════════════════╝',
            '',
            'Assembling file...',
            ''
        ].join('\n');
    }

    // Parse assembler directives and instructions
    parseDirective(line) {
        const trimmed = line.trim().toLowerCase();
        
        if (trimmed.startsWith('.model')) {
            return { type: 'directive', name: 'model', value: trimmed.split(/\s+/)[1] };
        }
        if (trimmed.startsWith('.code')) {
            return { type: 'directive', name: 'code' };
        }
        if (trimmed.startsWith('.data')) {
            return { type: 'directive', name: 'data' };
        }
        if (trimmed.startsWith('.stack')) {
            return { type: 'directive', name: 'stack', value: trimmed.split(/\s+/)[1] };
        }
        if (trimmed.startsWith('db ') || trimmed.startsWith('dw ') || trimmed.startsWith('dd ')) {
            const parts = trimmed.split(/\s+/);
            return { type: 'data', size: parts[0], value: parts.slice(1).join(' ') };
        }
        if (trimmed.includes(' db ')) {
            const parts = trimmed.split(/\s+/);
            return { type: 'data', size: 'db', value: parts.slice(2).join(' ') };
        }
        if (trimmed.startsWith('end ')) {
            return { type: 'directive', name: 'end', value: trimmed.split(/\s+/)[1] };
        }
        if (trimmed === 'end start') {
            return { type: 'directive', name: 'end', value: 'start' };
        }
        if (trimmed === 'end') {
            return { type: 'directive', name: 'end', value: '' };
        }
        
        return null;
    }

    // Parse x86 instructions
    parseInstruction(line) {
        const trimmed = line.trim().toLowerCase();
        const parts = trimmed.split(/\s+/);
        const instruction = parts[0];
        const operands = parts.slice(1).join(' ');

        const instructions = {
            'mov': { opcode: 0x88, size: 2 },
            'add': { opcode: 0x00, size: 2 },
            'sub': { opcode: 0x28, size: 2 },
            'cmp': { opcode: 0x38, size: 2 },
            'jmp': { opcode: 0xE9, size: 3 },
            'je': { opcode: 0x74, size: 2 },
            'jne': { opcode: 0x75, size: 2 },
            'call': { opcode: 0xE8, size: 3 },
            'ret': { opcode: 0xC3, size: 1 },
            'int': { opcode: 0xCD, size: 2 },
            'push': { opcode: 0x50, size: 1 },
            'pop': { opcode: 0x58, size: 1 }
        };

        if (instructions[instruction]) {
            return {
                type: 'instruction',
                name: instruction,
                operands: operands,
                ...instructions[instruction]
            };
        }

        // Handle special cases
        if (instruction === 'mov' && operands.includes('ah')) {
            return {
                type: 'instruction',
                name: 'mov',
                operands: operands,
                opcode: 0xB4,
                size: 2
            };
        }
        if (instruction === 'mov' && operands.includes('dx')) {
            return {
                type: 'instruction',
                name: 'mov',
                operands: operands,
                opcode: 0xBA,
                size: 3
            };
        }
        if (instruction === 'mov' && operands.includes('ax') && operands.includes('@data')) {
            return {
                type: 'instruction',
                name: 'mov',
                operands: operands,
                opcode: 0xB8,
                size: 3
            };
        }
        if (instruction === 'mov' && operands.includes('ds') && operands.includes('ax')) {
            return {
                type: 'instruction',
                name: 'mov',
                operands: operands,
                opcode: 0x8E,
                size: 2
            };
        }
        if (instruction === 'int' && operands.includes('21h')) {
            return {
                type: 'instruction',
                name: 'int',
                operands: operands,
                opcode: 0xCD,
                size: 2
            };
        }

        return null;
    }

    // Assemble source code
    assemble(sourceCode) {
        this.sourceCode = sourceCode;
        this.errors = [];
        this.warnings = [];
        this.objectCode = [];
        this.currentAddress = 0x100;
        this.labels.clear();
        this.symbols.clear();

        const lines = sourceCode.split('\n');
        let inCodeSegment = false;
        let inDataSegment = false;

        // First pass - collect labels
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith(';')) continue;

            const labelMatch = line.match(/^(\w+):/);
            if (labelMatch) {
                this.labels.set(labelMatch[1], this.currentAddress);
            }

            const directive = this.parseDirective(line);
            if (directive) {
                if (directive.name === 'code') inCodeSegment = true;
                if (directive.name === 'data') inDataSegment = true;
                continue;
            }

            const instruction = this.parseInstruction(line);
            if (instruction) {
                this.currentAddress += instruction.size;
            }
        }

        // Second pass - generate object code
        this.currentAddress = 0x100;
        inCodeSegment = false;
        inDataSegment = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith(';')) continue;

            const directive = this.parseDirective(line);
            if (directive) {
                if (directive.name === 'code') {
                    inCodeSegment = true;
                    inDataSegment = false;
                }
                if (directive.name === 'data') {
                    inDataSegment = true;
                    inCodeSegment = false;
                }
                continue;
            }

            const instruction = this.parseInstruction(line);
            if (instruction) {
                this.generateObjectCode(instruction, line, i + 1);
            } else if (line.trim() && !line.startsWith(';') && !line.match(/^\w+:/)) {
                // Unknown instruction
                this.errors.push(`Line ${i + 1}: Unknown instruction or directive`);
            }
        }

        return {
            success: this.errors.length === 0,
            objectCode: this.objectCode,
            errors: this.errors,
            warnings: this.warnings,
            labels: this.labels,
            symbols: this.symbols
        };
    }

    // Generate object code for instruction
    generateObjectCode(instruction, sourceLine, lineNumber) {
        try {
            const { name, operands, opcode, size } = instruction;
            
            // Simple object code generation
            const code = [opcode];
            
            if (size > 1) {
                // Add operand bytes (simplified)
                const operandBytes = this.parseOperands(operands);
                code.push(...operandBytes);
            }

            this.objectCode.push({
                address: this.currentAddress,
                bytes: code,
                source: sourceLine,
                line: lineNumber
            });

            this.currentAddress += size;
        } catch (error) {
            this.errors.push(`Line ${lineNumber}: ${error.message}`);
        }
    }

    // Parse operands (simplified)
    parseOperands(operands) {
        if (!operands) return [];
        
        // Simple operand parsing
        const parts = operands.split(',');
        const bytes = [];
        
        for (const part of parts) {
            const trimmed = part.trim();
            
            // Register
            if (['ax', 'bx', 'cx', 'dx', 'si', 'di', 'sp', 'bp'].includes(trimmed)) {
                bytes.push(0x00); // Register byte
            }
            // Immediate value
            else if (trimmed.match(/^\d+$/)) {
                const value = parseInt(trimmed);
                bytes.push(value & 0xFF);
                if (value > 255) bytes.push((value >> 8) & 0xFF);
            }
            // Label reference
            else if (this.labels.has(trimmed)) {
                const address = this.labels.get(trimmed);
                bytes.push(address & 0xFF);
                bytes.push((address >> 8) & 0xFF);
            }
            else {
                bytes.push(0x00); // Default
            }
        }
        
        return bytes;
    }

    // Execute assembled code
    execute() {
        this.registers.ip = 0x100;
        this.registers.sp = 0xFFFE;
        
        const output = [];
        let instructionsExecuted = 0;
        const maxInstructions = 1000; // Prevent infinite loops

        while (this.registers.ip < this.objectCode.length && instructionsExecuted < maxInstructions) {
            const instruction = this.objectCode.find(obj => obj.address === this.registers.ip);
            if (!instruction) break;

            const result = this.executeInstruction(instruction);
            if (result) output.push(result);
            
            instructionsExecuted++;
        }

        return {
            success: this.errors.length === 0,
            registers: { ...this.registers },
            memory: this.memory.slice(0, 256), // First 256 bytes
            output: output,
            instructionsExecuted: instructionsExecuted
        };
    }

    // Execute single instruction
    executeInstruction(instruction) {
        const { bytes, source } = instruction;
        const opcode = bytes[0];

        switch (opcode) {
            case 0x88: // MOV
                return this.executeMOV(instruction);
            case 0x00: // ADD
                return this.executeADD(instruction);
            case 0x28: // SUB
                return this.executeSUB(instruction);
            case 0xCD: // INT
                return this.executeINT(instruction);
            case 0xC3: // RET
                this.registers.ip = this.memory[this.registers.sp] | (this.memory[this.registers.sp + 1] << 8);
                this.registers.sp += 2;
                return `RET executed`;
            default:
                this.registers.ip += bytes.length;
                return `Unknown instruction: ${source}`;
        }
    }

    executeMOV(instruction) {
        this.registers.ip += instruction.bytes.length;
        return `MOV executed: ${instruction.source}`;
    }

    executeADD(instruction) {
        this.registers.ip += instruction.bytes.length;
        return `ADD executed: ${instruction.source}`;
    }

    executeSUB(instruction) {
        this.registers.ip += instruction.bytes.length;
        return `SUB executed: ${instruction.source}`;
    }

    executeINT(instruction) {
        const interrupt = instruction.bytes[1];
        this.registers.ip += instruction.bytes.length;
        
        if (interrupt === 0x21) {
            return `INT 21h - DOS interrupt executed`;
        }
        return `INT ${interrupt.toString(16)}h executed`;
    }

    // Display assembly results
    displayResults(result) {
        const output = [];
        
        output.push(this.displayHeader());
        
        if (result.success) {
            output.push('Assembly completed successfully.');
            output.push(`Object code size: ${result.objectCode.length} bytes`);
            output.push('');
            
            if (result.warnings.length > 0) {
                output.push('Warnings:');
                result.warnings.forEach(warning => output.push(`  ${warning}`));
                output.push('');
            }
            
            output.push('Object code:');
            result.objectCode.forEach(obj => {
                const hexBytes = obj.bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
                output.push(`  ${obj.address.toString(16).padStart(4, '0').toUpperCase()}: ${hexBytes.toUpperCase()}  ; ${obj.source}`);
            });
        } else {
            output.push('Assembly failed with errors:');
            result.errors.forEach(error => output.push(`  ${error}`));
        }
        
        return output.join('\n');
    }

    // Display execution results
    displayExecutionResults(executionResult) {
        const output = [];
        
        output.push('╔══════════════════════════════════════════════════════════════╗');
        output.push('║                    Program Execution Results                  ║');
        output.push('╚══════════════════════════════════════════════════════════════╝');
        output.push('');
        
        output.push('Registers:');
        output.push(`  AX: ${executionResult.registers.ax.toString(16).padStart(4, '0').toUpperCase()}h`);
        output.push(`  BX: ${executionResult.registers.bx.toString(16).padStart(4, '0').toUpperCase()}h`);
        output.push(`  CX: ${executionResult.registers.cx.toString(16).padStart(4, '0').toUpperCase()}h`);
        output.push(`  DX: ${executionResult.registers.dx.toString(16).padStart(4, '0').toUpperCase()}h`);
        output.push(`  SI: ${executionResult.registers.si.toString(16).padStart(4, '0').toUpperCase()}h`);
        output.push(`  DI: ${executionResult.registers.di.toString(16).padStart(4, '0').toUpperCase()}h`);
        output.push(`  SP: ${executionResult.registers.sp.toString(16).padStart(4, '0').toUpperCase()}h`);
        output.push(`  BP: ${executionResult.registers.bp.toString(16).padStart(4, '0').toUpperCase()}h`);
        output.push(`  IP: ${executionResult.registers.ip.toString(16).padStart(4, '0').toUpperCase()}h`);
        output.push('');
        
        output.push('Program output:');
        executionResult.output.forEach(line => output.push(`  ${line}`));
        output.push('');
        
        output.push(`Instructions executed: ${executionResult.instructionsExecuted}`);
        
        return output.join('\n');
    }
}

module.exports = AssemblerEmulator; 