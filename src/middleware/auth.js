const authManager = require('../modules/auth');
const { logInfo, logError } = require('../utils/logger');

/**
 * Middleware для проверки аутентификации
 */
function requireAuth(req, res, next) {
    const sessionToken = req.cookies?.sessionToken || req.headers['x-session-token'];
    
    if (!sessionToken) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Follow the white rabbit...'
        });
    }

    authManager.validateSession(sessionToken)
        .then(user => {
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session',
                    message: 'Follow the white rabbit...'
                });
            }
            
            req.user = user;
            next();
        })
        .catch(error => {
            logError('Auth middleware error', error);
            res.status(500).json({
                success: false,
                error: 'Authentication error',
                message: 'System error occurred'
            });
        });
}

/**
 * Middleware для проверки администратора
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Follow the white rabbit...'
        });
    }

    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required',
            message: 'Access denied. Admin privileges required.'
        });
    }

    next();
}

/**
 * Middleware для получения IP адреса
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.ip;
}

/**
 * Middleware для установки пользователя в запрос
 */
function setUserFromSession(req, res, next) {
    const sessionToken = req.cookies?.sessionToken || req.headers['x-session-token'];
    
    if (sessionToken) {
        authManager.validateSession(sessionToken)
            .then(user => {
                if (user) {
                    req.user = user;
                }
                next();
            })
            .catch(error => {
                logError('Session validation error', error);
                next();
            });
    } else {
        next();
    }
}

module.exports = {
    requireAuth,
    requireAdmin,
    getClientIP,
    setUserFromSession
}; 