const fs = require('fs');
const path = require('path');

class TurboPascalEmulator {
    constructor() {
        this.memory = new Array(65536).fill(0); // 64KB memory
        this.stack = [];
        this.variables = new Map();
        this.procedures = new Map();
        this.functions = new Map();
        this.currentLine = 0;
        this.sourceCode = '';
        this.compiledCode = [];
        this.errors = [];
        this.warnings = [];
        this.output = [];
        this.isRunning = false;
        this.debugMode = false;
        this.breakpoints = new Set();
    }

    // Turbo Pascal IDE style interface
    displayHeader() {
        return [
            '╔══════════════════════════════════════════════════════════════╗',
            '║                    Turbo Pascal 7.0                          ║',
            '║                    Copyright (C) 1983-1992                   ║',
            '║                    Borland International                     ║',
            '╚══════════════════════════════════════════════════════════════╝',
            '',
            'Compiling...',
            ''
        ].join('\n');
    }

    // Parse Pascal tokens
    tokenize(sourceCode) {
        const tokens = [];
        const lines = sourceCode.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('{') || line.startsWith('(*')) continue;
            
            const lineTokens = this.parseLine(line, i + 1);
            tokens.push(...lineTokens);
        }
        
        return tokens;
    }

    // Parse single line
    parseLine(line, lineNumber) {
        const tokens = [];
        let currentWord = '';
        let inString = false;
        let stringDelimiter = '';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (inString) {
                if (char === stringDelimiter) {
                    currentWord += char;
                    tokens.push({
                        type: 'string',
                        value: currentWord.toLowerCase(),
                        line: lineNumber,
                        original: currentWord
                    });
                    currentWord = '';
                    inString = false;
                    stringDelimiter = '';
                } else {
                    currentWord += char;
                }
            } else if (char === '"' || char === "'") {
                if (currentWord) {
                    const cleanWord = currentWord.replace(/[;(),]/g, '');
                    if (cleanWord) {
                        tokens.push({
                            type: this.getTokenType(cleanWord),
                            value: cleanWord.toLowerCase(),
                            line: lineNumber,
                            original: currentWord
                        });
                    }
                    currentWord = '';
                }
                inString = true;
                stringDelimiter = char;
                currentWord = char;
            } else if (char === ' ' || char === '\t') {
                if (currentWord) {
                    const cleanWord = currentWord.replace(/[;(),]/g, '');
                    if (cleanWord) {
                        tokens.push({
                            type: this.getTokenType(cleanWord),
                            value: cleanWord.toLowerCase(),
                            line: lineNumber,
                            original: currentWord
                        });
                    }
                    currentWord = '';
                }
            } else {
                currentWord += char;
            }
        }
        
        // Handle remaining word
        if (currentWord) {
            const cleanWord = currentWord.replace(/[;(),]/g, '');
            if (cleanWord) {
                tokens.push({
                    type: this.getTokenType(cleanWord),
                    value: cleanWord.toLowerCase(),
                    line: lineNumber,
                    original: currentWord
                });
            }
        }
        
        return tokens;
    }

    // Determine token type
    getTokenType(word) {
        const keywords = [
            'program', 'var', 'const', 'type', 'begin', 'end', 'if', 'then', 'else',
            'while', 'do', 'for', 'to', 'downto', 'repeat', 'until', 'case', 'of',
            'procedure', 'function', 'forward', 'external', 'inline', 'assembler',
            'write', 'writeln', 'read', 'readln', 'exit', 'halt', 'break', 'continue'
        ];
        
        const types = [
            'integer', 'real', 'boolean', 'char', 'string', 'array', 'record', 'set'
        ];
        
        if (keywords.includes(word.toLowerCase())) return 'keyword';
        if (types.includes(word.toLowerCase())) return 'type';
        if (word.match(/^\d+$/)) return 'number';
        if (word.match(/^['"][^'"]*['"]$/)) return 'string';
        if (word.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) return 'identifier';
        
        return 'operator';
    }

    // Compile Pascal source code
    compile(sourceCode) {
        this.sourceCode = sourceCode;
        this.errors = [];
        this.warnings = [];
        this.compiledCode = [];
        this.variables.clear();
        this.procedures.clear();
        this.functions.clear();
        
        const tokens = this.tokenize(sourceCode);
        
        // Basic syntax validation
        this.validateSyntax(tokens);
        
        // First pass - collect declarations
        if (this.errors.length === 0) {
            this.parseDeclarations(tokens);
        }
        
        // Second pass - compile code
        if (this.errors.length === 0) {
            this.compileCode(tokens);
        }
        
        return {
            success: this.errors.length === 0,
            compiledCode: this.compiledCode,
            errors: this.errors,
            warnings: this.warnings,
            variables: this.variables,
            procedures: this.procedures,
            functions: this.functions
        };
    }

    // Validate basic syntax
    validateSyntax(tokens) {
        let beginCount = 0;
        let endCount = 0;
        let parenCount = 0;
        
        for (const token of tokens) {
            if (token.value === 'begin') beginCount++;
            if (token.value === 'end') endCount++;
            if (token.value === '(') parenCount++;
            if (token.value === ')') parenCount--;
        }
        
        // Ignore end. (end with dot) for basic validation
        const endWithDot = tokens.some(t => t.value === 'end.');
        if (endWithDot) {
            endCount = Math.max(endCount, beginCount);
        }
        
        if (beginCount !== endCount) {
            this.errors.push('Mismatched begin/end blocks');
        }
        
        if (parenCount !== 0) {
            this.errors.push('Mismatched parentheses');
        }
        
        // Check for basic syntax errors
        for (let i = 0; i < tokens.length - 1; i++) {
            const current = tokens[i];
            const next = tokens[i + 1];
            
            // Check for missing semicolon after writeln
            if (current.value === 'writeln' && next.value === 'end') {
                this.errors.push('Missing semicolon after writeln statement');
            }
        }
    }

    // Parse variable and procedure declarations
    parseDeclarations(tokens) {
        let inVarSection = false;
        let inProcedureSection = false;
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (token.value === 'var') {
                inVarSection = true;
                inProcedureSection = false;
                continue;
            }
            
            if (token.value === 'procedure' || token.value === 'function') {
                inProcedureSection = true;
                inVarSection = false;
                continue;
            }
            
            if (token.value === 'begin') {
                inVarSection = false;
                inProcedureSection = false;
                break;
            }
            
            if (inVarSection && token.type === 'identifier') {
                // Parse variable declaration
                this.parseVariableDeclaration(tokens, i);
            }
            
            if (inProcedureSection && token.type === 'identifier') {
                // Parse procedure/function declaration
                this.parseProcedureDeclaration(tokens, i);
            }
        }
    }

    // Parse variable declaration
    parseVariableDeclaration(tokens, index) {
        const varName = tokens[index].value;
        let i = index + 1;
        
        // Skip to type declaration
        while (i < tokens.length && tokens[i].value !== ':' && tokens[i].value !== ';') {
            i++;
        }
        
        if (i < tokens.length && tokens[i].value === ':') {
            i++;
            if (i < tokens.length) {
                const type = tokens[i].value;
                this.variables.set(varName, {
                    type: type,
                    value: this.getDefaultValue(type),
                    address: this.variables.size * 4
                });
            }
        }
    }

    // Parse procedure declaration
    parseProcedureDeclaration(tokens, index) {
        const procName = tokens[index].value;
        this.procedures.set(procName, {
            name: procName,
            parameters: [],
            localVars: [],
            startAddress: this.compiledCode.length
        });
    }

    // Get default value for type
    getDefaultValue(type) {
        switch (type) {
            case 'integer': return 0;
            case 'real': return 0.0;
            case 'boolean': return false;
            case 'char': return '';
            case 'string': return '';
            default: return null;
        }
    }

    // Compile executable code
    compileCode(tokens) {
        let inBeginEnd = false;
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (token.value === 'begin') {
                inBeginEnd = true;
                continue;
            }
            
            if (token.value === 'end') {
                inBeginEnd = false;
                this.compiledCode.push({ type: 'end', line: token.line });
                continue;
            }
            
            if (inBeginEnd) {
                this.compileStatement(tokens, i);
            }
        }
    }

    // Compile single statement
    compileStatement(tokens, index) {
        const token = tokens[index];
        
        switch (token.value) {
            case 'write':
            case 'writeln':
                this.compileWriteStatement(tokens, index);
                break;
            case 'read':
            case 'readln':
                this.compileReadStatement(tokens, index);
                break;
            case 'if':
                this.compileIfStatement(tokens, index);
                break;
            case 'while':
                this.compileWhileStatement(tokens, index);
                break;
            case 'for':
                this.compileForStatement(tokens, index);
                break;
            default:
                if (token.type === 'identifier') {
                    this.compileAssignment(tokens, index);
                }
                break;
        }
    }

    // Compile write statement
    compileWriteStatement(tokens, index) {
        const isWriteln = tokens[index].value === 'writeln';
        const params = this.parseParameters(tokens, index + 1);
        
        this.compiledCode.push({
            type: 'write',
            isWriteln: isWriteln,
            parameters: params,
            line: tokens[index].line
        });
    }

    // Compile read statement
    compileReadStatement(tokens, index) {
        const isReadln = tokens[index].value === 'readln';
        const params = this.parseParameters(tokens, index + 1);
        
        this.compiledCode.push({
            type: 'read',
            isReadln: isReadln,
            parameters: params,
            line: tokens[index].line
        });
    }

    // Compile if statement
    compileIfStatement(tokens, index) {
        this.compiledCode.push({
            type: 'if',
            condition: this.parseCondition(tokens, index + 1),
            line: tokens[index].line
        });
    }

    // Compile while statement
    compileWhileStatement(tokens, index) {
        this.compiledCode.push({
            type: 'while',
            condition: this.parseCondition(tokens, index + 1),
            line: tokens[index].line
        });
    }

    // Compile for statement
    compileForStatement(tokens, index) {
        this.compiledCode.push({
            type: 'for',
            variable: tokens[index + 1]?.value,
            startValue: this.parseExpression(tokens, index + 3),
            endValue: this.parseExpression(tokens, index + 5),
            line: tokens[index].line
        });
    }

    // Compile assignment
    compileAssignment(tokens, index) {
        const varName = tokens[index].value;
        
        if (tokens[index + 1]?.value === ':=') {
            const value = this.parseExpression(tokens, index + 2);
            this.compiledCode.push({
                type: 'assignment',
                variable: varName,
                value: value,
                line: tokens[index].line
            });
        }
    }

    // Parse parameters
    parseParameters(tokens, startIndex) {
        const params = [];
        let i = startIndex;
        
        while (i < tokens.length && tokens[i].value !== ';' && tokens[i].value !== ')') {
            if (tokens[i].type === 'identifier' || tokens[i].type === 'string' || tokens[i].type === 'number') {
                params.push(tokens[i].value);
            }
            i++;
        }
        
        return params;
    }

    // Parse condition
    parseCondition(tokens, startIndex) {
        const condition = [];
        let i = startIndex;
        
        while (i < tokens.length && tokens[i].value !== 'then' && tokens[i].value !== 'do') {
            condition.push(tokens[i].value);
            i++;
        }
        
        return condition.join(' ');
    }

    // Parse expression
    parseExpression(tokens, startIndex) {
        const expression = [];
        let i = startIndex;
        
        while (i < tokens.length && tokens[i].value !== ';' && tokens[i].value !== 'do' && tokens[i].value !== 'to') {
            expression.push(tokens[i].value);
            i++;
        }
        
        return expression.join(' ');
    }

    // Execute compiled code
    execute() {
        this.isRunning = true;
        this.output = [];
        this.currentLine = 0;
        
        for (let i = 0; i < this.compiledCode.length; i++) {
            const instruction = this.compiledCode[i];
            this.currentLine = instruction.line;
            
            if (this.debugMode && this.breakpoints.has(i)) {
                this.output.push(`Breakpoint at line ${instruction.line}`);
                break;
            }
            
            const result = this.executeInstruction(instruction);
            if (result) this.output.push(result);
        }
        
        this.isRunning = false;
        
        return {
            output: this.output,
            variables: this.variables,
            success: this.errors.length === 0
        };
    }

    // Execute single instruction
    executeInstruction(instruction) {
        switch (instruction.type) {
            case 'write':
                return this.executeWrite(instruction);
            case 'read':
                return this.executeRead(instruction);
            case 'assignment':
                return this.executeAssignment(instruction);
            case 'if':
                return this.executeIf(instruction);
            case 'while':
                return this.executeWhile(instruction);
            case 'for':
                return this.executeFor(instruction);
            case 'end':
                return 'Program ended';
            default:
                return `Unknown instruction: ${instruction.type}`;
        }
    }

    // Execute write statement
    executeWrite(instruction) {
        let output = '';
        
        for (const param of instruction.parameters) {
            if (param.startsWith("'") && param.endsWith("'")) {
                // String literal
                output += param.slice(1, -1);
            } else if (param.startsWith('"') && param.endsWith('"')) {
                // String literal with double quotes
                output += param.slice(1, -1);
            } else if (this.variables.has(param)) {
                // Variable
                output += this.variables.get(param).value;
            } else if (!isNaN(param)) {
                // Number
                output += param;
            }
        }
        
        if (instruction.isWriteln) {
            output += '\n';
        }
        
        this.output.push(output);
        return output;
    }

    // Execute read statement
    executeRead(instruction) {
        for (const param of instruction.parameters) {
            if (this.variables.has(param)) {
                // Simulate reading input
                const variable = this.variables.get(param);
                if (variable.type === 'integer') {
                    variable.value = Math.floor(Math.random() * 100);
                } else if (variable.type === 'real') {
                    variable.value = Math.random() * 100;
                } else if (variable.type === 'string') {
                    variable.value = 'input';
                }
            }
        }
        
        return `Read: ${instruction.parameters.join(', ')}`;
    }

    // Execute assignment
    executeAssignment(instruction) {
        const variable = this.variables.get(instruction.variable);
        if (variable) {
            // Simple expression evaluation
            if (typeof instruction.value === 'number') {
                variable.value = instruction.value;
            } else if (instruction.value.match(/^\d+$/)) {
                variable.value = parseInt(instruction.value);
            } else if (this.variables.has(instruction.value)) {
                variable.value = this.variables.get(instruction.value).value;
            }
        }
        
        return `Assignment: ${instruction.variable} := ${instruction.value}`;
    }

    // Execute if statement
    executeIf(instruction) {
        // Simple condition evaluation
        const condition = instruction.condition;
        const parts = condition.split(/\s+/);
        
        if (parts.length >= 3) {
            const left = this.variables.get(parts[0])?.value || parts[0];
            const operator = parts[1];
            const right = this.variables.get(parts[2])?.value || parts[2];
            
            let result = false;
            switch (operator) {
                case '=': result = left == right; break;
                case '<>': result = left != right; break;
                case '<': result = left < right; break;
                case '>': result = left > right; break;
                case '<=': result = left <= right; break;
                case '>=': result = left >= right; break;
            }
            
            return `If condition: ${condition} = ${result}`;
        }
        
        return `If condition: ${condition}`;
    }

    // Execute while statement
    executeWhile(instruction) {
        return `While loop: ${instruction.condition}`;
    }

    // Execute for statement
    executeFor(instruction) {
        return `For loop: ${instruction.variable} := ${instruction.startValue} to ${instruction.endValue}`;
    }

    // Display compilation results
    displayResults(result) {
        const output = [];
        
        output.push(this.displayHeader());
        
        if (result.success) {
            output.push('Compilation completed successfully.');
            output.push(`Compiled code size: ${result.compiledCode.length} instructions`);
            output.push('');
            
            if (result.warnings.length > 0) {
                output.push('Warnings:');
                result.warnings.forEach(warning => output.push(`  ${warning}`));
                output.push('');
            }
            
            output.push('Variables:');
            result.variables.forEach((value, key) => {
                output.push(`  ${key}: ${value.type} = ${value.value}`);
            });
            output.push('');
            
            output.push('Compiled code:');
            result.compiledCode.forEach((instruction, index) => {
                output.push(`  ${index}: ${instruction.type} - ${JSON.stringify(instruction)}`);
            });
        } else {
            output.push('Compilation failed with errors:');
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
        
        output.push('Program output:');
        executionResult.output.forEach(line => output.push(`  ${line}`));
        output.push('');
        
        output.push('Final variable values:');
        executionResult.variables.forEach((value, key) => {
            output.push(`  ${key}: ${value.value}`);
        });
        
        return output.join('\n');
    }

    // Set breakpoint
    setBreakpoint(line) {
        this.breakpoints.add(line);
        return `Breakpoint set at line ${line}`;
    }

    // Clear breakpoint
    clearBreakpoint(line) {
        this.breakpoints.delete(line);
        return `Breakpoint cleared at line ${line}`;
    }

    // Enable debug mode
    enableDebug() {
        this.debugMode = true;
        return 'Debug mode enabled';
    }

    // Disable debug mode
    disableDebug() {
        this.debugMode = false;
        return 'Debug mode disabled';
    }
}

module.exports = TurboPascalEmulator; 