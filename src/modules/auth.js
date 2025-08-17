const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/app');
const { logInfo, logError } = require('../utils/logger');

/**
 * Authentication module
 */
class AuthModule {
    constructor() {
        this.secretKey = config.jwt?.secret || 'your-secret-key';
        this.expiresIn = config.jwt?.expiresIn || '24h';
    }

    /**
     * Generates JWT token
     * @param {Object} payload - Token payload
     * @returns {string} - JWT token
     */
    generateToken(payload) {
        return jwt.sign(payload, this.secretKey, { expiresIn: this.expiresIn });
    }

    /**
     * Verifies JWT token
     * @param {string} token - JWT token
     * @returns {Object} - Decoded token payload
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.secretKey);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    /**
     * Hashes password
     * @param {string} password - Plain password
     * @returns {Promise<string>} - Hashed password
     */
    async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * Compares password with hash
     * @param {string} password - Plain password
     * @param {string} hash - Hashed password
     * @returns {Promise<boolean>} - Whether passwords match
     */
    async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Registers new user
     * @param {string} username - Username
     * @param {string} password - Password
     * @param {Object} userData - Additional user data
     * @returns {Promise<Object>} - Registration result
     */
    async registerUser(username, password, userData = {}) {
        try {
            // Check if user already exists
            const existingUser = await this.getUserByUsername(username);
            if (existingUser) {
                return {
                    success: false,
                    error: 'User already exists'
                };
            }

            // Hash password
            const hashedPassword = await this.hashPassword(password);

            // Create user object
            const user = {
                username,
                password: hashedPassword,
                email: userData.email || '',
                role: userData.role || 'user',
                created_at: new Date().toISOString(),
                ...userData
            };

            // Save user to database
            const savedUser = await this.saveUser(user);

            // Generate token
            const token = this.generateToken({
                id: savedUser.id,
                username: savedUser.username,
                role: savedUser.role
            });

            logInfo('User registered successfully', { username });

            return {
                success: true,
                user: {
                    id: savedUser.id,
                    username: savedUser.username,
                    email: savedUser.email,
                    role: savedUser.role
                },
                token
            };
        } catch (error) {
            logError('User registration failed', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Authenticates user
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} - Authentication result
     */
    async authenticateUser(username, password) {
        try {
            // Get user by username
            const user = await this.getUserByUsername(username);
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            // Verify password
            const isPasswordValid = await this.comparePassword(password, user.password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    error: 'Invalid password'
                };
            }

            // Generate token
            const token = this.generateToken({
                id: user.id,
                username: user.username,
                role: user.role
            });

            logInfo('User authenticated successfully', { username });

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            };
        } catch (error) {
            logError('User authentication failed', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Logs out user
     * @param {string} token - JWT token
     * @returns {Promise} - Logout result
     */
    async logoutUser(token) {
        try {
            // In a real application, you might want to blacklist the token
            // For now, we'll just verify it's valid
            const decoded = this.verifyToken(token);
            
            logInfo('User logged out successfully', { userId: decoded.id });

            return {
                success: true,
                message: 'Logged out successfully'
            };
        } catch (error) {
            logError('User logout failed', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Gets user by username
     * @param {string} username - Username
     * @returns {Promise<Object>} - User object
     */
    async getUserByUsername(username) {
        // This should be implemented based on your database structure
        // For now, returning null
        return null;
    }

    /**
     * Saves user to database
     * @param {Object} user - User object
     * @returns {Promise<Object>} - Saved user
     */
    async saveUser(user) {
        // This should be implemented based on your database structure
        // For now, returning the user with a mock ID
        return {
            ...user,
            id: Math.floor(Math.random() * 1000000)
        };
    }
}

module.exports = AuthModule; 