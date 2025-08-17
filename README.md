# Retro Terminal Server

A comprehensive retro-style terminal server with AI-powered command processing, network diagnostics, legal database integration, and Docker-based emulation systems.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Legal Database Integration](#legal-database-integration)
- [Docker Emulation System](#docker-emulation-system)
- [Development](#development)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)

## Features

### Core Features
- **AI-Powered Commands**: Intelligent command processing using OpenAI
- **Network Diagnostics**: Real ping, traceroute, nslookup, whois, netstat
- **System Monitoring**: Real-time system information and health checks
- **Security**: Rate limiting, input validation, and security logging
- **MOTD Generation**: Bender-style Message of the Day
- **Database Storage**: SQLite database for logs, requests, and legal searches
- **HTTPS Support**: Secure connections with SSL certificates

### Legal Database Integration
- **Ukrainian Legal Database**: Full integration with "Закон Онлайн" API
- **Intelligent Detection**: Automatic detection of legal requests
- **Two-Stage Search**: Metadata search followed by full text retrieval
- **Query Extraction**: Smart extraction of search queries from Ukrainian legal text
- **Statistics**: Track search history and popular queries

### Docker Emulation System
- **NASM Assembler**: x86 assembly language emulation
- **Free Pascal Compiler**: Modern Turbo Pascal replacement
- **DOSBox**: DOS environment emulation
- **QEMU**: Full operating system emulation
- **Retro Interface**: Authentic retro development environment look

### Retro Terminal Interface
- **CRT Monitor Effects**: Green phosphor display simulation
- **Authentic Commands**: Classic UNIX terminal commands
- **Auto-complete**: Fish-style command completion
- **Audio Feedback**: Retro terminal sounds
- **Cross-platform**: Works on Windows, macOS, and Linux

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key
- Docker (for emulation features)
- Network tools (ping, traceroute, nslookup, whois)

### Installation

```bash
git clone <repository-url>
cd awe.s0me.uk
npm install
```

### Configuration

Create a `.env` file:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
PORT=3000
NODE_ENV=development
ZAKON_TOKEN=your_zakon_online_token_here
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
COMMAND_TIMEOUT=10000
MAX_BUFFER_SIZE=1048576
CACHE_TTL=300
LOG_LEVEL=info
```

### Running the Server

```bash
# Development
npm start

# Production
npm run start:prod

# HTTPS (with SSL)
npm run start:https
```

## Architecture

```
src/
├── config/
│   └── app.js              # Application configuration
├── modules/
│   ├── commandExecutor.js   # Safe command execution
│   ├── aiProcessor.js       # AI request processing
│   ├── database.js          # Database management
│   ├── cache.js            # Caching system
│   ├── dockerEmulator.js   # Docker emulation
│   └── security.js         # Security validation
├── middleware/
│   ├── security.js         # Security middleware
│   └── errorHandler.js     # Error handling
├── routes/
│   ├── network.js          # Network command routes
│   ├── ai.js              # AI routes
│   ├── docker.js          # Docker emulation routes
│   └── zakonOnline.js     # Legal database routes
├── services/
│   ├── aiService.js        # AI service logic
│   ├── networkService.js   # Network service logic
│   └── zakonOnlineService.js # Legal database service
├── utils/
│   ├── logger.js           # Logging utilities
│   ├── formatters.js       # Output formatting
│   └── validators.js       # Input validation
└── server.js              # Main server file
```

## API Endpoints

### Core Endpoints

- `POST /api/ping` - Network ping
- `POST /api/traceroute` - Network path tracing
- `POST /api/nslookup` - DNS lookup
- `POST /api/whois` - Domain information
- `POST /api/netstat` - Network statistics
- `POST /api/motd` - Generate MOTD
- `POST /api/process-command` - Process unknown commands
- `GET /api/system` - System information
- `GET /api/health` - Health check

### AI Endpoints

- `POST /api/detect-legal` - Detect legal requests
- `POST /api/legal-search` - Search legal database
- `POST /api/court-cases` - Process court case requests
- `POST /api/tcc` - Process TCC requests

### Legal Database Endpoints (Закон Онлайн)

- `GET /api/zakon-online/search` - Search legal database
- `GET /api/zakon-online/courts` - Get courts list
- `GET /api/zakon-online/judgment-forms` - Get judgment forms
- `GET /api/zakon-online/justice-kinds` - Get justice kinds
- `GET /api/zakon-online/history` - Search history
- `GET /api/zakon-online/stats` - Search statistics
- `GET /api/zakon-online/top-searches` - Top search queries
- `GET /api/zakon-online/search/:id` - Search details

### Docker Emulation Endpoints

- `POST /api/docker/assembler` - Compile and run assembly code
- `POST /api/docker/pascal` - Compile and run Pascal code
- `POST /api/docker/dos` - Run DOS program
- `POST /api/docker/qemu` - Run QEMU emulation
- `GET /api/docker/files` - List workspace files
- `POST /api/docker/sample` - Create sample program
- `GET /api/docker/status` - Container status

### History & Statistics

- `GET /api/motd/history` - MOTD history
- `GET /api/openai/history` - OpenAI requests history
- `GET /api/commands` - Available commands
- `GET /api/status` - AI service status

## Legal Database Integration

The system includes full integration with the Ukrainian legal database "Закон Онлайн" API for searching court decisions and legal information.

### Features

- **Automatic Detection**: System automatically detects legal requests and activates search
- **Two-Stage Search**: Metadata search followed by full text retrieval
- **Query Extraction**: Intelligent extraction of search queries from Ukrainian legal text
- **Database Storage**: All search results are stored in local database
- **Statistics**: Track search history and popular queries
- **Filtering**: Search by court, judgment form, and justice kind

### Ukrainian Legal Keywords

The system recognizes Ukrainian legal terms with weights:

- **High Priority (9-10)**: `житло`, `мешканець`, `реєстрація місця проживання`, `колишній мешканець`
- **Medium Priority (7-8)**: `приватизація`, `власник`, `виселення`, `право власності`
- **Low Priority (5-6)**: `адвокат`, `юрист`, `судова практика`

### Usage Examples

```bash
# Search for housing-related cases
"найди судові справи про виселення з житла"

# Search for inheritance cases  
"потрібна юридична консультація щодо спадщини"

# Get court practice
"надати судову практику по житлових питаннях"
```

### API Configuration

To use the legal database features, set the `ZAKON_TOKEN` environment variable:

```env
ZAKON_TOKEN=your_zakon_online_api_token_here
```

## Docker Emulation System

The system provides comprehensive emulation of classic development environments through Docker containers.

### Available Emulators

#### NASM Assembler
- **Features**: Full x86 instruction set emulation, ELF64 output format, automatic linking
- **Usage**: `POST /api/docker/assembler`
- **Sample**: Hello World assembly program

#### Free Pascal Compiler
- **Features**: Turbo Pascal compatibility, modern capabilities, cross-platform
- **Usage**: `POST /api/docker/pascal`
- **Sample**: Hello World Pascal program

#### DOSBox
- **Features**: DOS environment emulation, old games and programs support
- **Usage**: `POST /api/docker/dos`
- **Configuration**: Custom dosbox.conf

#### QEMU
- **Features**: Full OS emulation, multiple architectures, KVM virtualization
- **Usage**: `POST /api/docker/qemu`
- **Support**: FreeDOS, Linux, Windows

### Sample Programs

#### Assembly (hello.asm)
```nasm
; Hello World program for NASM
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
    int 0x80
```

#### Pascal (hello.pas)
```pascal
program HelloWorld;
begin
    writeln('Hello, World!');
    writeln('Welcome to Free Pascal!');
end.
```

### Docker Configuration

```yaml
services:
  retro-emulator:
    build: .
    volumes:
      - ./Emulation/workspace:/workspace
    ports:
      - "8080:8080"
```

## Database Schema

The system uses SQLite with the following main tables:

- `motd_history` - MOTD generation history
- `openai_requests` - AI request logs
- `command_logs` - Command execution logs
- `security_events` - Security event logs
- `zakon_online_searches` - Legal search history
- `zakon_online_cases` - Found court cases
- `zakon_online_full_texts` - Full text of court decisions

## Development

### Project Structure

```
src/
├── config/          # Configuration
├── middleware/      # Express middleware
├── modules/         # Core modules
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utilities
└── server.js        # Main server file
```

### Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- tests/zakonOnlineService.test.js

# Run with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Security Features

### Input Validation
- Hostname and domain validation
- Command sanitization
- Malicious character detection
- Request size limits

### Rate Limiting
- General API rate limiting (100 requests per 15 minutes)
- AI-specific rate limiting (10 requests per minute)
- Configurable limits via environment variables

### Command Security
- Whitelist of allowed commands
- Argument validation
- Command timeout protection
- Buffer size limits

### CORS and Headers
- Configurable CORS origins
- Security headers (Helmet)
- Content Security Policy
- HSTS headers

## Performance Optimizations

### Caching
- Network command results cached for 5-60 minutes
- AI responses cached for 10-60 minutes
- Configurable cache TTL
- Automatic cache cleanup

### Database Optimization
- Connection pooling
- Prepared statements
- Indexed queries
- Efficient data storage

### Logging
- Structured JSON logging
- Separate log files for different concerns
- Log rotation and size limits
- Performance monitoring

## Monitoring

### Health Checks

```bash
curl http://localhost:3000/api/health
```

### System Information

```bash
curl http://localhost:3000/api/system
```

### Legal Database Statistics

```bash
curl http://localhost:3000/api/zakon-online/stats
```

## Deployment

### Production Setup

1. Set environment variables
2. Configure SSL certificates
3. Set up reverse proxy (nginx)
4. Configure logging
5. Set up monitoring

### Docker Support

```bash
# Build image
docker build -t retro-terminal .

# Run container
docker run -p 3000:3000 retro-terminal
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Change port in .env file
   PORT=3001
   ```

2. **Network tools not found:**
   - Windows: Install Windows Subsystem for Linux (WSL)
   - macOS: Install via Homebrew: `brew install traceroute`
   - Linux: Install via package manager

3. **Permission denied:**
   - Ensure you're logged in as admin
   - Check file permissions

4. **OpenAI API errors:**
   - Verify API key in `.env` file
   - Check API quota and billing
   - Ensure network connectivity

### Network Tool Installation

#### macOS
```bash
brew install traceroute whois
```

#### Ubuntu/Debian
```bash
sudo apt-get install traceroute whois
```

#### CentOS/RHEL
```bash
sudo yum install traceroute whois
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the API documentation

---

**Note**: This server includes integration with Ukrainian legal databases. Ensure compliance with local laws and regulations when using legal data features. 