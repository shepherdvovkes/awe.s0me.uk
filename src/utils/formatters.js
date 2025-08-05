/**
 * Форматирование вывода команд
 */
class OutputFormatter {
    /**
     * Форматирует общий вывод команды
     * @param {string} output - Сырой вывод команды
     * @returns {string} - Отформатированный вывод
     */
    static formatOutput(output) {
        if (!output) return '';

        return `${output
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n')}\n`;
    }

    /**
     * Специальное форматирование для ping команды
     * @param {string} output - Сырой вывод ping
     * @returns {string} - Отформатированный вывод
     */
    static formatPingOutput(output) {
        if (!output) return '';

        const lines = output.split('\n');
        const formattedLines = [];

        for (let line of lines) {
            line = line.trim();
            if (line.length > 0) {
                // Добавляем пустую строку после каждого ответа ping
                if (line.includes('icmp_seq=') || line.includes('bytes from')) {
                    formattedLines.push(line);
                    formattedLines.push(''); // Пустая строка после каждого ответа
                } else {
                    formattedLines.push(line);
                }
            }
        }

        return `${formattedLines.join('\n')}\n`;
    }

    /**
     * Форматирует системную информацию
     * @param {Object} systemInfo - Информация о системе
     * @returns {string} - Отформатированная информация
     */
    static formatSystemInfo(systemInfo) {
        return `Platform: ${systemInfo.platform}
Architecture: ${systemInfo.arch}
Node Version: ${systemInfo.nodeVersion}
Uptime: ${Math.floor(systemInfo.uptime / 60)} minutes
`;
    }

    /**
     * Форматирует MOTD сообщения
     * @param {Array} multilingualMotds - Многоязычные MOTD
     * @returns {string} - Отформатированный MOTD
     */
    static formatMOTD(multilingualMotds) {
        if (!multilingualMotds || multilingualMotds.length === 0) {
            return 'No MOTD available\n';
        }

        let formattedOutput = '';

        // Начинаем с английского сообщения
        formattedOutput += multilingualMotds[0].message;

        // Добавляем переводы на новых строках
        for (let i = 1; i < multilingualMotds.length; i++) {
            formattedOutput += `\n${multilingualMotds[i].message}`;
        }

        return `${formattedOutput}\n`;
    }

    /**
     * Форматирует историю MOTD
     * @param {Array} history - История MOTD
     * @returns {string} - Отформатированная история
     */
    static formatMOTDHistory(history) {
        if (!history || history.length === 0) {
            return 'No MOTD history available\n';
        }

        let formattedOutput = 'MOTD History:\n\n';

        history.forEach((item, index) => {
            formattedOutput += `${index + 1}. [${item.language}] ${item.message}\n`;
            formattedOutput += `   Date: ${item.created_at}\n\n`;
        });

        return formattedOutput;
    }

    /**
     * Форматирует ошибку
     * @param {string} error - Сообщение об ошибке
     * @returns {string} - Отформатированная ошибка
     */
    static formatError(error) {
        return `Error: ${error}\n`;
    }

    /**
     * Форматирует результат поиска в юридической базе
     * @param {Object} searchResult - Результат поиска
     * @returns {string} - Отформатированный результат
     */
    static formatLegalSearchResult(searchResult) {
        if (!searchResult) {
            return 'No legal information found\n';
        }

        let formattedOutput = 'Legal Search Results:\n\n';

        if (searchResult.query) {
            formattedOutput += `Query: ${searchResult.query}\n\n`;
        }

        if (searchResult.results && searchResult.results.length > 0) {
            searchResult.results.forEach((result, index) => {
                formattedOutput += `${index + 1}. ${result.title || 'No title'}\n`;
                if (result.description) {
                    formattedOutput += `   ${result.description}\n`;
                }
                if (result.date) {
                    formattedOutput += `   Date: ${result.date}\n`;
                }
                formattedOutput += '\n';
            });
        } else {
            formattedOutput += 'No results found\n';
        }

        return formattedOutput;
    }

    /**
     * Обрезает длинный текст
     * @param {string} text - Исходный текст
     * @param {number} maxLength - Максимальная длина
     * @returns {string} - Обрезанный текст
     */
    static truncateText(text, maxLength = 2000) {
        if (!text || text.length <= maxLength) {
            return text;
        }

        return `${text.substring(0, maxLength)}...\n\n[Text truncated for brevity]`;
    }
}

module.exports = OutputFormatter;
