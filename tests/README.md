# Tests Directory

This directory contains all test files for the UNIX/32V Terminal project.

## Directory Structure

```
tests/
├── README.md                    # This file
├── autocomplete.test.js         # Autocomplete functionality tests
├── commands.test.js             # Terminal commands tests
├── commandExecutor.test.js      # Command execution tests
├── emulation.test.js           # Docker emulation tests
├── services.test.js            # API services tests
├── setup.js                    # Test setup configuration
├── validators.test.js          # Input validation tests
├── zakonOnlineService.test.js  # Legal database service tests
├── html/                       # HTML test files
│   ├── test_api_direct.html
│   ├── test_api_simple.html
│   ├── test_command_browser.html
│   ├── test_emulation_web.html
│   ├── test_emulation_web_fixed.html
│   ├── test_input.html
│   ├── test_scroll.html
│   ├── test_show_api_connections.html
│   └── test_show_motd_db.html
├── js/                         # JavaScript test files
│   ├── test_ai_commands.js
│   ├── test_ai_detection.js
│   ├── test_court_cases.js
│   ├── test_detection.js
│   ├── test_detection_simple.js
│   ├── test_docker-emulators.js
│   ├── test_intelligent_system.js
│   ├── test_legal_detection.js
│   ├── test_motd.js
│   ├── test_query_extraction.js
│   ├── test_show_api_connections.js
│   ├── test_show_motd_db.js
│   ├── test_tcc_command.js
│   ├── test_user_query.js
│   └── test_zakon_api.js
└── api/                        # API test files
    ├── debug_api.html
    └── simple_test.html
```

## Test Categories

### Core Tests
- **autocomplete.test.js** - Tests for Fish-style autocomplete functionality
- **commands.test.js** - Tests for terminal commands (help, history, cat, etc.)
- **commandExecutor.test.js** - Tests for command execution and security
- **services.test.js** - Tests for API services and endpoints
- **validators.test.js** - Tests for input validation and sanitization

### Emulation Tests
- **emulation.test.js** - Tests for Docker-based emulation (NASM, Pascal)
- **zakonOnlineService.test.js** - Tests for legal database integration

### HTML Tests
- **html/** - Browser-based test files for UI functionality
- **api/** - API endpoint testing files

### JavaScript Tests
- **js/** - Standalone JavaScript test files for various features

## Running Tests

### Jest Tests
```bash
npm test
```

### Specific Test Files
```bash
npm test -- autocomplete.test.js
npm test -- commands.test.js
npm test -- commandExecutor.test.js
```

### HTML Tests
Open the HTML files in `tests/html/` directory in a browser to test UI functionality.

### API Tests
Use the files in `tests/api/` directory to test API endpoints.

## Test Coverage

### Autocomplete System
- Command completion (TAB key)
- Argument completion
- Smart autocomplete with context
- Audio feedback
- Visual indicators

### Terminal Commands
- Basic commands (help, ls, cd, cat, echo)
- System commands (motd, matrix, oscilloscope)
- Admin commands (ping, traceroute, nslookup)
- Command history
- Error handling

### Security
- Input validation
- Command sanitization
- Permission checks
- SQL injection prevention

### API Services
- Network tools (ping, traceroute, nslookup)
- Legal database integration
- AI command processing
- Docker emulation

## Test Environment

Tests use Jest as the testing framework with JSDOM for DOM simulation. The test environment includes:

- Mock DOM elements
- Simulated user interactions
- API endpoint mocking
- Database mocking
- Audio API mocking

## Adding New Tests

1. Create test file in appropriate subdirectory
2. Follow Jest testing patterns
3. Include comprehensive test cases
4. Test both success and error scenarios
5. Mock external dependencies
6. Add descriptive test names

## Test Maintenance

- Run tests before committing changes
- Update tests when adding new features
- Ensure all tests pass before deployment
- Keep test files organized and documented 