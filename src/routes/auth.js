const express = require('express');
const router = express.Router();
const authManager = require('../modules/auth');
const { getClientIP } = require('../middleware/auth');
const { logInfo, logError } = require('../utils/logger');

/**
 * Регистрация нового пользователя
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const ipAddress = getClientIP(req);

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Username and password are required'
            });
        }

        // Проверяем, существует ли уже пользователь
        const existingUser = await authManager.getUserByIP(ipAddress);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
                message: 'User with this IP address is already registered'
            });
        }

        const result = await authManager.registerUser(ipAddress, username, password);

        // Устанавливаем cookie с токеном сессии
        res.cookie('sessionToken', result.sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 часа
        });

        res.json({
            success: true,
            message: 'User registered successfully',
            user: {
                username: result.user.username,
                isAdmin: result.user.isAdmin
            }
        });

    } catch (error) {
        logError('Registration failed', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed',
            message: error.message
        });
    }
});

/**
 * Аутентификация пользователя
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const ipAddress = getClientIP(req);

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Username and password are required'
            });
        }

        const result = await authManager.authenticateUser(ipAddress, username, password);

        // Устанавливаем cookie с токеном сессии
        res.cookie('sessionToken', result.sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 часа
        });

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                username: result.user.username,
                isAdmin: result.user.isAdmin
            }
        });

    } catch (error) {
        logError('Login failed', error);
        res.status(401).json({
            success: false,
            error: 'Authentication failed',
            message: error.message
        });
    }
});

/**
 * Выход пользователя
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
    try {
        const ipAddress = getClientIP(req);
        await authManager.logoutUser(ipAddress);

        // Удаляем cookie
        res.clearCookie('sessionToken');

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        logError('Logout failed', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed',
            message: error.message
        });
    }
});

/**
 * Проверка статуса аутентификации
 * GET /api/auth/status
 */
router.get('/status', async (req, res) => {
    try {
        const sessionToken = req.cookies?.sessionToken || req.headers['x-session-token'];
        
        if (!sessionToken) {
            return res.json({
                success: true,
                authenticated: false,
                message: 'Follow the white rabbit...'
            });
        }

        const user = await authManager.validateSession(sessionToken);
        
        if (!user) {
            return res.json({
                success: true,
                authenticated: false,
                message: 'Follow the white rabbit...'
            });
        }

        res.json({
            success: true,
            authenticated: true,
            user: {
                username: user.username,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        logError('Auth status check failed', error);
        res.status(500).json({
            success: false,
            error: 'Status check failed',
            message: error.message
        });
    }
});

/**
 * Создание администратора (только для первого запуска)
 * POST /api/auth/create-admin
 */
router.post('/create-admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const ipAddress = getClientIP(req);

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Username and password are required'
            });
        }

        // Проверяем, есть ли уже администраторы в системе
        const existingUser = await authManager.getUserByIP(ipAddress);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
                message: 'User with this IP address is already registered'
            });
        }

        const result = await authManager.registerUser(ipAddress, username, password, true);

        // Устанавливаем cookie с токеном сессии
        res.cookie('sessionToken', result.sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 часа
        });

        res.json({
            success: true,
            message: 'Admin user created successfully',
            user: {
                username: result.user.username,
                isAdmin: result.user.isAdmin
            }
        });

    } catch (error) {
        logError('Admin creation failed', error);
        res.status(500).json({
            success: false,
            error: 'Admin creation failed',
            message: error.message
        });
    }
});

module.exports = router; 