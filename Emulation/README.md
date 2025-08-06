# Emulation Modules

This directory contains emulation modules for classic programming languages and development environments.

## Available Emulators

### Turbo Assembler 3.0 (x86)
- **File**: `assembler.js`
- **Description**: Emulates the classic Borland Turbo Assembler 3.0
- **Features**:
  - x86 instruction set emulation
  - Memory and register simulation
  - Assembly directives support
  - Object code generation
  - Program execution simulation

### Turbo Pascal 7.0
- **File**: `turbopascal.js`
- **Description**: Emulates the classic Borland Turbo Pascal 7.0 IDE
- **Features**:
  - Pascal language compilation
  - Variable and procedure declarations
  - Control structures (if, while, for)
  - Input/output operations
  - Debug mode with breakpoints

## Usage

### Command Line Interface

```bash
# Initialize assembler
run asm

# Create sample program
run asm sample hello

# Compile and execute file
run asm hello.asm

# Initialize Pascal
run pascal

# Create sample program
run pascal sample hello

# Compile and execute file
run pascal hello.pas

# List workspace files
run list

# Get help
run help
run asm help
run pascal help
```

### Sample Programs

#### Assembler Samples
- `hello.asm` - Hello World program
- `add.asm` - Simple addition program

#### Pascal Samples
- `hello.pas` - Hello World program
- `factorial.pas` - Factorial calculation
- `calculator.pas` - Simple calculator

## Architecture

### EmulationManager
- **File**: `emulation_manager.js`
- **Purpose**: Central manager for all emulation modules
- **Features**:
  - Emulator initialization
  - File management
  - Compilation and execution coordination
  - Sample program generation
  - Help system

### Workspace
- **Directory**: `workspace/`
- **Purpose**: Storage for source code files
- **Features**:
  - Automatic directory creation
  - File listing and management
  - Sample program storage

## Technical Details

### Assembler Emulator
- **Memory**: 64KB simulated memory
- **Registers**: Full x86 register set (AX, BX, CX, DX, SI, DI, SP, BP)
- **Instructions**: Basic x86 instruction set
- **Directives**: .model, .stack, .data, .code
- **Interrupts**: DOS interrupt simulation (INT 21h)

### Pascal Emulator
- **Memory**: 64KB simulated memory
- **Variables**: Dynamic variable management
- **Types**: integer, real, boolean, char, string
- **Statements**: write, writeln, read, readln, if, while, for
- **Debug**: Breakpoint support and debug mode

## Retro Interface

Both emulators feature authentic retro interfaces that recreate the look and feel of classic Borland development environments:

- ASCII box-drawing characters for borders
- Authentic copyright headers
- Classic compilation messages
- Register and memory dumps
- Error and warning displays

## Integration

The emulation modules are integrated into the main command processor and can be accessed through the `run` command in the retro terminal interface.

## Future Enhancements

- More comprehensive instruction sets
- Advanced debugging features
- File I/O simulation
- Network programming support
- Graphics mode emulation
- Sound and music programming
- More sample programs and tutorials 