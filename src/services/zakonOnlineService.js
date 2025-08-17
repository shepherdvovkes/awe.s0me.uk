const axios = require('axios');
const config = require('../config/app');
const { logInfo, logError } = require('../utils/logger');

/**
 * Service for working with Zakon Online API
 */
class ZakonOnlineService {
    constructor() {
        this.baseURL = 'https://api.zakononline.com.ua';
        this.token = config.zakonOnline?.token;
        this.cache = new Map();
        this.cacheTTL = 300000; // 5 minutes
    }

    /**
     * Makes request to Zakon Online API
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} - API response
     */
    async makeRequest(endpoint, params = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const headers = {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            };

            const response = await axios.get(url, {
                headers,
                params,
                timeout: 10000
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            logError('Zakon Online API request failed', {
                endpoint,
                error: error.message,
                status: error.response?.status
            });

            return {
                success: false,
                error: error.message,
                status: error.response?.status
            };
        }
    }

    /**
     * Searches for court decisions
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} - Search results
     */
    async searchDecisions(query, options = {}) {
        const {
            court = '',
            judgmentForm = '',
            justiceKind = '',
            dateFrom = '',
            dateTo = '',
            page = 1,
            limit = 20
        } = options;

        const params = {
            q: query,
            court,
            judgment_form: judgmentForm,
            justice_kind: justiceKind,
            date_from: dateFrom,
            date_to: dateTo,
            page,
            limit
        };

        return await this.makeRequest('/search', params);
    }

    /**
     * Gets courts list
     * @returns {Promise<Object>} - Courts list
     */
    async getCourts() {
        return await this.makeRequest('/courts');
    }

    /**
     * Gets judgment forms
     * @returns {Promise<Object>} - Judgment forms
     */
    async getJudgmentForms() {
        return await this.makeRequest('/judgment-forms');
    }

    /**
     * Gets justice kinds
     * @returns {Promise<Object>} - Justice kinds
     */
    async getJusticeKinds() {
        return await this.makeRequest('/justice-kinds');
    }

    /**
     * Searches for metadata of court decisions
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} - Search results
     */
    async searchMetadata(query, options = {}) {
        const cacheKey = `metadata_${query}_${JSON.stringify(options)}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTTL) {
                return cached.data;
            }
        }

        const result = await this.searchDecisions(query, options);
        
        if (result.success) {
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
        }

        return result;
    }

    /**
     * Gets full text of court decision
     * @param {string} decisionId - Decision ID
     * @returns {Promise<Object>} - Full text
     */
    async getFullText(decisionId) {
        const cacheKey = `fulltext_${decisionId}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTTL) {
                return cached.data;
            }
        }

        const result = await this.makeRequest(`/decisions/${decisionId}/full-text`);
        
        if (result.success) {
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
        }

        return result;
    }

    /**
     * Performs two-stage search: metadata + full texts
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} - Search results
     */
    async searchWithFullTexts(query, options = {}) {
        try {
            // Step 1: Get metadata
            const metadataResult = await this.searchMetadata(query, options);
            
            if (!metadataResult.success) {
                return metadataResult;
            }

            const metadata = metadataResult.data;
            
            // Step 2: Get full texts for first results
            const fullTexts = [];
            const maxFullTexts = Math.min(5, metadata.results?.length || 0);
            
            for (let i = 0; i < maxFullTexts; i++) {
                const decision = metadata.results[i];
                if (decision.id) {
                    const fullTextResult = await this.getFullText(decision.id);
                    if (fullTextResult.success) {
                        fullTexts.push({
                            id: decision.id,
                            fullText: fullTextResult.data
                        });
                    }
                }
            }

            return {
                success: true,
                metadata: metadata,
                fullTexts: fullTexts,
                query: query
            };
        } catch (error) {
            logError('Two-stage search failed', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Saves search results to database
     * @param {Object} metadata - Metadata of results
     * @param {Array} fullTexts - Full texts
     * @returns {Promise} - Save result
     */
    async saveSearchResults(metadata, fullTexts = []) {
        try {
            // Implementation depends on your database structure
            logInfo('Search results saved', {
                query: metadata.query,
                resultsCount: metadata.results?.length || 0,
                fullTextsCount: fullTexts.length
            });

            return {
                success: true,
                saved: true
            };
        } catch (error) {
            logError('Failed to save search results', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Formats search results for display
     * @param {Object} searchResults - Search results
     * @returns {string} - Formatted result
     */
    formatSearchResults(searchResults) {
        if (!searchResults.success) {
            return `Error: ${searchResults.error}`;
        }

        let formatted = `🔍 SEARCH RESULTS: "${searchResults.query}"\n`;

        if (searchResults.metadata?.results) {
            formatted += `\n📋 Found ${searchResults.metadata.results.length} decisions:\n\n`;
            
            searchResults.metadata.results.forEach((decision, index) => {
                formatted += `${index + 1}. ${decision.court_name || 'Unknown Court'}\n`;
                formatted += `   📅 Date: ${decision.date || 'Unknown'}\n`;
                formatted += `   📄 Case: ${decision.case_number || 'Unknown'}\n`;
                formatted += `   👥 Parties: ${decision.parties || 'Unknown'}\n`;
                
                if (searchResults.fullTexts?.find(ft => ft.id === decision.id)) {
                    formatted += `   📖 Full text available\n`;
                }
                
                formatted += `\n`;
            });
        } else {
            formatted += `\n❌ No results found.\n`;
        }

        return formatted;
    }

    /**
     * Checks if service is available
     * @returns {Promise<boolean>} - Whether service is available
     */
    async isAvailable() {
        try {
            const result = await this.makeRequest('/courts');
            return result.success;
        } catch (error) {
            return false;
        }
    }
}

module.exports = ZakonOnlineService; 