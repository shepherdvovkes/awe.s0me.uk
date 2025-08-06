# Retro Terminal Server

A retro-style terminal server with AI-powered command processing and network diagnostics.

## Features

- 🤖 **AI-Powered Commands**: Intelligent command processing using OpenAI
- 🌐 **Network Diagnostics**: Ping, traceroute, nslookup, whois
- 📊 **System Monitoring**: Real-time system information and health checks
- 🔒 **Security**: Rate limiting, input validation, and security logging
- 📝 **MOTD Generation**: Bender-style Message of the Day
- ⚖️ **Legal Database Integration**: Search Ukrainian legal database via "Закон Онлайн" API
- 🗄️ **Database Storage**: SQLite database for logs, requests, and legal searches
- 🚀 **HTTPS Support**: Secure connections with SSL certificates

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

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

## API Endpoints

### Core Endpoints

- `POST /api/ping` - Network ping
- `POST /api/traceroute` - Network path tracing
- `POST /api/nslookup` - DNS lookup
- `POST /api/whois` - Domain information
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
- **Database Storage**: All search results are stored in local database
- **Statistics**: Track search history and popular queries
- **Filtering**: Search by court, judgment form, and justice kind

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

- **Rate Limiting**: Configurable rate limits for API endpoints
- **Input Validation**: Comprehensive input sanitization
- **Security Logging**: All security events are logged
- **CORS Protection**: Configurable CORS settings
- **Helmet**: Security headers via Helmet middleware

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