# Retro Terminal with Real Networking Tools

A retro-styled UNIX terminal emulator with real networking tools powered by a Node.js backend, featuring enhanced security, modular architecture, and AI integration.

## Features

- **Authentic Retro UI**: CRT monitor effects with green phosphor display
- **Real Networking Tools**: Actual ping, traceroute, nslookup, netstat, whois
- **Enhanced Security**: Input validation, rate limiting, command sanitization
- **AI Integration**: OpenAI-powered MOTD generation and command processing
- **Modular Architecture**: Clean separation of concerns with dedicated modules
- **Caching System**: Performance optimization with intelligent caching
- **Comprehensive Logging**: Structured logging with Winston
- **Database Storage**: SQLite for MOTD history and AI requests
- **Cross-platform**: Works on Windows, macOS, and Linux

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
│   └── security.js         # Security validation
├── middleware/
│   ├── security.js         # Security middleware
│   └── errorHandler.js     # Error handling
├── routes/
│   ├── network.js          # Network command routes
│   └── ai.js              # AI routes
├── utils/
│   ├── logger.js           # Logging utilities
│   └── formatters.js       # Output formatting
└── server.js              # Main server file
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Network tools (ping, traceroute, nslookup, netstat, whois)
- OpenAI API key (for AI features)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the project root:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   NODE_ENV=development
   PORT=3000
   RATE_LIMIT_MAX=100
   RATE_LIMIT_WINDOW=900000
   COMMAND_TIMEOUT=10000
   MAX_BUFFER_SIZE=1048576
   CACHE_TTL=300
   LOG_LEVEL=info
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Development

### Development Mode
```bash
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Security audit
npm run security-check
```

## API Endpoints

### Network Commands
- `POST /api/ping` - Execute ping command
- `POST /api/traceroute` - Execute traceroute command
- `POST /api/nslookup` - Execute nslookup command
- `POST /api/netstat` - Execute netstat command
- `POST /api/whois` - Execute whois command
- `GET /api/system` - Get system information
- `GET /api/health` - Health check
- `GET /api/commands` - Available commands

### AI Features
- `POST /api/motd` - Generate Bender-style MOTD using OpenAI
- `POST /api/process-command` - Process unknown commands with AI
- `POST /api/detect-legal` - Detect legal requests
- `POST /api/legal-search` - Search legal database
- `POST /api/court-cases` - Process court case requests
- `POST /api/tcc` - Process TCC requests
- `GET /api/motd/history` - MOTD history
- `GET /api/openai/history` - OpenAI requests history
- `GET /api/status` - AI service status

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

## Usage

### Login
- **Regular User**: Login with any username (e.g., `user`, `guest`)
- **Admin User**: Login with username `admin` to access networking tools

### Available Commands

#### Regular Commands
- `help` - Show available commands
- `about` - System information
- `projects` - Project list
- `contact` - Contact information
- `clear` - Clear terminal
- `date` - Current date/time
- `who` - Current user
- `uname` - System name
- `ls` - List files
- `pwd` - Current directory
- `logout` - Exit terminal

#### Admin Commands (requires admin login)
- `networking` - Show networking tools
- `ping <hostname>` - Test connectivity
- `traceroute <hostname>` - Trace network path
- `nslookup <hostname>` - DNS lookup
- `netstat` - Network statistics
- `whois <domain>` - Domain information
- `system` - System information

#### System Commands
- `motd` - Generate Bender-style message of the day
- `show motd db` - Display MOTD database history

### Examples

```bash
# Login as admin
login: admin

# Test connectivity
# ping google.com

# Trace network path
# traceroute github.com

# DNS lookup
# nslookup example.com

# Network statistics
# netstat

# Domain information
# whois google.com

# Generate MOTD
motd
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment |
| `OPENAI_API_KEY` | - | OpenAI API key |
| `RATE_LIMIT_MAX` | 100 | Max requests per window |
| `RATE_LIMIT_WINDOW` | 900000 | Rate limit window (ms) |
| `COMMAND_TIMEOUT` | 10000 | Command execution timeout |
| `MAX_BUFFER_SIZE` | 1048576 | Max command output size |
| `CACHE_TTL` | 300 | Cache time-to-live (seconds) |
| `LOG_LEVEL` | info | Logging level |

### Database Configuration

The application uses SQLite for data storage with the following tables:
- `motd_history` - MOTD messages and prompts
- `openai_requests` - AI request history
- `command_logs` - Command execution logs
- `security_events` - Security event tracking

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

## Security Notes

- The server executes system commands with the same privileges as the Node.js process
- Only use on trusted networks
- Commands have configurable timeout to prevent hanging
- All inputs are validated and sanitized
- Rate limiting prevents abuse
- Comprehensive logging for security monitoring

## License

MIT License - see LICENSE file for details. 