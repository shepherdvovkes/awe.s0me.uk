const { logInfo } = require('./logger');

/**
 * Formats search result in legal database
 * @param {Object} searchResult - Search result
 * @returns {string} - Formatted result
 */
function formatLegalSearchResult(searchResult) {
    if (!searchResult.success) {
        return `Error: ${searchResult.error}`;
    }

    let formatted = `🔍 LEGAL SEARCH RESULTS\n`;
    formatted += `==========================================\n\n`;

    if (searchResult.metadata?.results) {
        formatted += `📋 Found ${searchResult.metadata.results.length} decisions:\n\n`;
        
        searchResult.metadata.results.forEach((decision, index) => {
            formatted += `${index + 1}. ${decision.court_name || 'Unknown Court'}\n`;
            formatted += `   📅 Date: ${decision.date || 'Unknown'}\n`;
            formatted += `   📄 Case: ${decision.case_number || 'Unknown'}\n`;
            formatted += `   👥 Parties: ${decision.parties || 'Unknown'}\n`;
            
            if (searchResult.fullTexts?.find(ft => ft.id === decision.id)) {
                formatted += `   📖 Full text available\n`;
            }
            
            formatted += `\n`;
        });
    } else {
        formatted += `❌ No results found.\n`;
    }

    return formatted;
}

/**
 * Formats network command result
 * @param {string} command - Command name
 * @param {Object} result - Command result
 * @returns {string} - Formatted result
 */
function formatNetworkResult(command, result) {
    if (!result.success) {
        return `❌ ${command.toUpperCase()} failed: ${result.error}`;
    }

    let formatted = `🌐 ${command.toUpperCase()} RESULT\n`;
    formatted += `==========================================\n\n`;
    formatted += result.output || 'No output available';

    return formatted;
}

/**
 * Formats system information
 * @param {Object} systemInfo - System information
 * @returns {string} - Formatted result
 */
function formatSystemInfo(systemInfo) {
    let formatted = `💻 SYSTEM INFORMATION\n`;
    formatted += `==========================================\n\n`;
    
    if (systemInfo.platform) {
        formatted += `🖥️  Platform: ${systemInfo.platform}\n`;
    }
    
    if (systemInfo.arch) {
        formatted += `🏗️  Architecture: ${systemInfo.arch}\n`;
    }
    
    if (systemInfo.nodeVersion) {
        formatted += `📦 Node.js: ${systemInfo.nodeVersion}\n`;
    }
    
    if (systemInfo.uptime) {
        formatted += `⏱️  Uptime: ${systemInfo.uptime}\n`;
    }
    
    if (systemInfo.memory) {
        formatted += `💾 Memory: ${systemInfo.memory.used} / ${systemInfo.memory.total} MB\n`;
    }
    
    if (systemInfo.cpu) {
        formatted += `🖥️  CPU: ${systemInfo.cpu.model} (${systemInfo.cpu.cores} cores)\n`;
    }

    return formatted;
}

/**
 * Formats error message
 * @param {Error} error - Error object
 * @param {string} context - Error context
 * @returns {string} - Formatted error
 */
function formatError(error, context = '') {
    let formatted = `❌ ERROR`;
    if (context) {
        formatted += ` (${context})`;
    }
    formatted += `\n==========================================\n\n`;
    formatted += `Message: ${error.message}\n`;
    
    if (error.stack) {
        formatted += `\nStack trace:\n${error.stack}\n`;
    }

    return formatted;
}

/**
 * Formats success message
 * @param {string} message - Success message
 * @param {Object} data - Additional data
 * @returns {string} - Formatted success message
 */
function formatSuccess(message, data = {}) {
    let formatted = `✅ SUCCESS\n`;
    formatted += `==========================================\n\n`;
    formatted += `${message}\n`;
    
    if (Object.keys(data).length > 0) {
        formatted += `\nAdditional data:\n`;
        for (const [key, value] of Object.entries(data)) {
            formatted += `  ${key}: ${value}\n`;
        }
    }

    return formatted;
}

/**
 * Formats help information
 * @param {Array} commands - Available commands
 * @returns {string} - Formatted help
 */
function formatHelp(commands) {
    let formatted = `📚 AVAILABLE COMMANDS\n`;
    formatted += `==========================================\n\n`;
    
    commands.forEach(command => {
        formatted += `🔹 ${command.name}\n`;
        if (command.description) {
            formatted += `   ${command.description}\n`;
        }
        if (command.usage) {
            formatted += `   Usage: ${command.usage}\n`;
        }
        formatted += `\n`;
    });

    return formatted;
}

/**
 * Formats MOTD (Message of the Day)
 * @param {string} message - MOTD message
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted MOTD
 */
function formatMOTD(message, options = {}) {
    const {
        showTimestamp = true,
        showBorder = true,
        maxWidth = 80
    } = options;

    let formatted = '';
    
    if (showBorder) {
        formatted += `╔${'═'.repeat(maxWidth - 2)}╗\n`;
    }
    
    formatted += `║ ${'MESSAGE OF THE DAY'.padEnd(maxWidth - 4)} ║\n`;
    
    if (showBorder) {
        formatted += `╠${'═'.repeat(maxWidth - 2)}╣\n`;
    }
    
    // Split message into lines that fit within maxWidth
    const words = message.split(' ');
    let currentLine = '';
    const lines = [];
    
    words.forEach(word => {
        if ((currentLine + word).length <= maxWidth - 6) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    });
    if (currentLine) lines.push(currentLine);
    
    lines.forEach(line => {
        formatted += `║ ${line.padEnd(maxWidth - 4)} ║\n`;
    });
    
    if (showTimestamp) {
        const timestamp = new Date().toLocaleString();
        formatted += `║ ${timestamp.padEnd(maxWidth - 4)} ║\n`;
    }
    
    if (showBorder) {
        formatted += `╚${'═'.repeat(maxWidth - 2)}╝\n`;
    }
    
    return formatted;
}

module.exports = {
    formatLegalSearchResult,
    formatNetworkResult,
    formatSystemInfo,
    formatError,
    formatSuccess,
    formatHelp,
    formatMOTD
};
