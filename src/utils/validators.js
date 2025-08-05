const Joi = require('joi');
const { logSecurity } = require('./logger');

/**
 * Input validation utilities
 */
class Validators {
    /**
     * Hostname validation schema
     */
    static hostnameSchema = Joi.string()
        .min(1)
        .max(253)
        .pattern(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)
        .messages({
            'string.empty': 'Hostname cannot be empty',
            'string.max': 'Hostname cannot exceed 253 characters',
            'string.pattern.base': 'Invalid hostname format'
        });

    /**
     * Domain validation schema
     */
    static domainSchema = Joi.string()
        .min(1)
        .max(253)
        .pattern(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/)
        .messages({
            'string.empty': 'Domain cannot be empty',
            'string.max': 'Domain cannot exceed 253 characters',
            'string.pattern.base': 'Invalid domain format'
        });

    /**
     * IP address validation schema
     */
    static ipSchema = Joi.string()
        .pattern(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)
        .messages({
            'string.pattern.base': 'Invalid IP address format'
        });

    /**
     * Command validation schema
     */
    static commandSchema = Joi.string()
        .min(1)
        .max(1000)
        .pattern(/^[a-zA-Z0-9\s\-_\.\/]+$/)
        .messages({
            'string.empty': 'Command cannot be empty',
            'string.max': 'Command cannot exceed 1000 characters',
            'string.pattern.base': 'Invalid command characters'
        });

    /**
     * Query validation schema
     */
    static querySchema = Joi.string()
        .min(1)
        .max(2000)
        .messages({
            'string.empty': 'Query cannot be empty',
            'string.max': 'Query cannot exceed 2000 characters'
        });

    /**
     * Arguments validation schema
     */
    static argsSchema = Joi.array()
        .items(Joi.string().max(100))
        .max(10)
        .messages({
            'array.max': 'Too many arguments',
            'string.max': 'Argument too long'
        });

    /**
     * Language validation schema
     */
    static languageSchema = Joi.string()
        .valid('en', 'ru', 'ja', 'fr', 'uk')
        .default('en')
        .messages({
            'any.only': 'Invalid language code'
        });

    /**
     * Admin flag validation schema
     */
    static adminSchema = Joi.boolean()
        .default(false);

    /**
     * Limit validation schema
     */
    static limitSchema = Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .messages({
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        });

    /**
     * Validates hostname
     * @param {string} hostname - Hostname to validate
     * @returns {Object} - Validation result
     */
    static validateHostname(hostname) {
        const { error, value } = this.hostnameSchema.validate(hostname);
        
        if (error) {
            logSecurity('Hostname validation failed', { hostname, error: error.message });
            return { isValid: false, error: error.message };
        }
        
        return { isValid: true, value };
    }

    /**
     * Validates domain
     * @param {string} domain - Domain to validate
     * @returns {Object} - Validation result
     */
    static validateDomain(domain) {
        const { error, value } = this.domainSchema.validate(domain);
        
        if (error) {
            logSecurity('Domain validation failed', { domain, error: error.message });
            return { isValid: false, error: error.message };
        }
        
        return { isValid: true, value };
    }

    /**
     * Validates IP address
     * @param {string} ip - IP address to validate
     * @returns {Object} - Validation result
     */
    static validateIP(ip) {
        const { error, value } = this.ipSchema.validate(ip);
        
        if (error) {
            logSecurity('IP validation failed', { ip, error: error.message });
            return { isValid: false, error: error.message };
        }
        
        return { isValid: true, value };
    }

    /**
     * Validates command
     * @param {string} command - Command to validate
     * @returns {Object} - Validation result
     */
    static validateCommand(command) {
        const { error, value } = this.commandSchema.validate(command);
        
        if (error) {
            logSecurity('Command validation failed', { command, error: error.message });
            return { isValid: false, error: error.message };
        }
        
        return { isValid: true, value };
    }

    /**
     * Validates query
     * @param {string} query - Query to validate
     * @returns {Object} - Validation result
     */
    static validateQuery(query) {
        const { error, value } = this.querySchema.validate(query);
        
        if (error) {
            logSecurity('Query validation failed', { query, error: error.message });
            return { isValid: false, error: error.message };
        }
        
        return { isValid: true, value };
    }

    /**
     * Validates arguments
     * @param {Array} args - Arguments to validate
     * @returns {Object} - Validation result
     */
    static validateArgs(args) {
        const { error, value } = this.argsSchema.validate(args);
        
        if (error) {
            logSecurity('Arguments validation failed', { args, error: error.message });
            return { isValid: false, error: error.message };
        }
        
        return { isValid: true, value };
    }

    /**
     * Validates language
     * @param {string} language - Language to validate
     * @returns {Object} - Validation result
     */
    static validateLanguage(language) {
        const { error, value } = this.languageSchema.validate(language);
        
        if (error) {
            logSecurity('Language validation failed', { language, error: error.message });
            return { isValid: false, error: error.message };
        }
        
        return { isValid: true, value };
    }

    /**
     * Validates admin flag
     * @param {boolean} isAdmin - Admin flag to validate
     * @returns {Object} - Validation result
     */
    static validateAdmin(isAdmin) {
        const { error, value } = this.adminSchema.validate(isAdmin);
        
        if (error) {
            logSecurity('Admin validation failed', { isAdmin, error: error.message });
            return { isValid: false, error: error.message };
        }
        
        return { isValid: true, value };
    }

    /**
     * Validates limit
     * @param {number} limit - Limit to validate
     * @returns {Object} - Validation result
     */
    static validateLimit(limit) {
        const { error, value } = this.limitSchema.validate(limit);
        
        if (error) {
            logSecurity('Limit validation failed', { limit, error: error.message });
            return { isValid: false, error: error.message };
        }
        
        return { isValid: true, value };
    }

    /**
     * Sanitizes input string
     * @param {string} input - Input to sanitize
     * @returns {string} - Sanitized input
     */
    static sanitizeInput(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        return input
            .replace(/[;&|`$(){}[\]<>]/g, '') // Remove shell metacharacters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Validates request body against schema
     * @param {Object} body - Request body
     * @param {Joi.Schema} schema - Validation schema
     * @returns {Object} - Validation result
     */
    static validateBody(body, schema) {
        const { error, value } = schema.validate(body, { 
            abortEarly: false,
            stripUnknown: true 
        });
        
        if (error) {
            const errors = error.details.map(detail => detail.message);
            logSecurity('Request body validation failed', { body, errors });
            return { isValid: false, errors };
        }
        
        return { isValid: true, value };
    }

    /**
     * Validates query parameters against schema
     * @param {Object} query - Query parameters
     * @param {Joi.Schema} schema - Validation schema
     * @returns {Object} - Validation result
     */
    static validateQueryParams(query, schema) {
        const { error, value } = schema.validate(query, { 
            abortEarly: false,
            stripUnknown: true 
        });
        
        if (error) {
            const errors = error.details.map(detail => detail.message);
            logSecurity('Query parameters validation failed', { query, errors });
            return { isValid: false, errors };
        }
        
        return { isValid: true, value };
    }

    /**
     * Creates a validation middleware
     * @param {Joi.Schema} schema - Validation schema
     * @returns {Function} - Express middleware
     */
    static createValidationMiddleware(schema) {
        return (req, res, next) => {
            const result = this.validateBody(req.body, schema);
            
            if (!result.isValid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: result.errors
                });
            }
            
            req.validatedBody = result.value;
            next();
        };
    }

    /**
     * Creates a query validation middleware
     * @param {Joi.Schema} schema - Validation schema
     * @returns {Function} - Express middleware
     */
    static createQueryValidationMiddleware(schema) {
        return (req, res, next) => {
            const result = this.validateQueryParams(req.query, schema);
            
            if (!result.isValid) {
                return res.status(400).json({
                    error: 'Query validation failed',
                    details: result.errors
                });
            }
            
            req.validatedQuery = result.value;
            next();
        };
    }
}

module.exports = Validators; 