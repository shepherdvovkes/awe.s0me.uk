#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

// Подключение к базе данных
const db = new sqlite3.Database('./terminal_data.db');

console.log('🔐 Retro Terminal Users Database');
console.log('================================\n');

// Функция для хеширования пароля (для проверки)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Получить всех пользователей
db.all(`
    SELECT 
        id,
        ip_address,
        username,
        password_hash,
        is_admin,
        session_token,
        last_login,
        created_at
    FROM users 
    ORDER BY created_at DESC
`, [], (err, rows) => {
    if (err) {
        console.error('❌ Error reading database:', err.message);
        return;
    }

    if (rows.length === 0) {
        console.log('📭 No users found in database');
        return;
    }

    console.log(`👥 Found ${rows.length} user(s):\n`);

    rows.forEach((user, index) => {
        console.log(`📋 User #${user.id}:`);
        console.log(`   IP Address: ${user.ip_address}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Password Hash: ${user.password_hash}`);
        console.log(`   Is Admin: ${user.is_admin ? 'Yes' : 'No'}`);
        console.log(`   Session Token: ${user.session_token ? 'Active' : 'None'}`);
        console.log(`   Last Login: ${user.last_login}`);
        console.log(`   Created: ${user.created_at}`);
        
        // Попробуем угадать пароль (для демонстрации)
        const commonPasswords = ['admin123', 'password', '123456', 'admin', 'user'];
        const guessedPassword = commonPasswords.find(pwd => 
            hashPassword(pwd) === user.password_hash
        );
        
        if (guessedPassword) {
            console.log(`   🔍 Guessed Password: ${guessedPassword}`);
        }
        
        console.log('');
    });

    // Статистика
    const adminCount = rows.filter(u => u.is_admin).length;
    const activeSessions = rows.filter(u => u.session_token).length;
    
    console.log('📊 Statistics:');
    console.log(`   Total Users: ${rows.length}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Active Sessions: ${activeSessions}`);
    console.log(`   Regular Users: ${rows.length - adminCount}`);

    // Показать структуру таблицы
    console.log('\n📋 Table Structure:');
    db.get("PRAGMA table_info(users)", [], (err, tableInfo) => {
        if (!err) {
            console.log('   users table columns:');
            console.log('   - id (INTEGER PRIMARY KEY)');
            console.log('   - ip_address (TEXT NOT NULL UNIQUE)');
            console.log('   - username (TEXT NOT NULL)');
            console.log('   - password_hash (TEXT NOT NULL)');
            console.log('   - is_admin (BOOLEAN DEFAULT 0)');
            console.log('   - session_token (TEXT)');
            console.log('   - last_login (DATETIME DEFAULT CURRENT_TIMESTAMP)');
            console.log('   - created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)');
        }
        
        db.close();
    });
});

console.log('🔍 Reading user data...\n'); 