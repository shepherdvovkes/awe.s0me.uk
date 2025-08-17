#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const readline = require('readline');

// Подключение к базе данных
const db = new sqlite3.Database('./terminal_data.db');

// Создание интерфейса для чтения ввода
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Функция для хеширования пароля
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Функция для отображения меню
function showMenu() {
    console.log('\n🔐 Retro Terminal User Management');
    console.log('==================================');
    console.log('1. List all users');
    console.log('2. Add new user');
    console.log('3. Delete user');
    console.log('4. Make user admin');
    console.log('5. Clear session tokens');
    console.log('6. Show database info');
    console.log('0. Exit');
    console.log('==================================');
}

// Функция для отображения всех пользователей
function listUsers() {
    db.all(`
        SELECT 
            id,
            ip_address,
            username,
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

        console.log(`\n👥 Found ${rows.length} user(s):\n`);

        rows.forEach((user, index) => {
            console.log(`📋 User #${user.id}:`);
            console.log(`   IP Address: ${user.ip_address}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Is Admin: ${user.is_admin ? 'Yes' : 'No'}`);
            console.log(`   Session Token: ${user.session_token ? 'Active' : 'None'}`);
            console.log(`   Last Login: ${user.last_login}`);
            console.log(`   Created: ${user.created_at}`);
            console.log('');
        });
    });
}

// Функция для добавления пользователя
function addUser() {
    rl.question('Enter IP address: ', (ipAddress) => {
        rl.question('Enter username: ', (username) => {
            rl.question('Enter password: ', (password) => {
                rl.question('Make admin? (y/n): ', (isAdmin) => {
                    const passwordHash = hashPassword(password);
                    const adminFlag = isAdmin.toLowerCase() === 'y' ? 1 : 0;

                    db.run(`
                        INSERT INTO users (ip_address, username, password_hash, is_admin)
                        VALUES (?, ?, ?, ?)
                    `, [ipAddress, username, passwordHash, adminFlag], function(err) {
                        if (err) {
                            console.error('❌ Error adding user:', err.message);
                        } else {
                            console.log(`✅ User ${username} added successfully with ID: ${this.lastID}`);
                        }
                    });
                });
            });
        });
    });
}

// Функция для удаления пользователя
function deleteUser() {
    rl.question('Enter user ID to delete: ', (userId) => {
        db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
            if (err) {
                console.error('❌ Error deleting user:', err.message);
            } else if (this.changes > 0) {
                console.log(`✅ User with ID ${userId} deleted successfully`);
            } else {
                console.log(`❌ User with ID ${userId} not found`);
            }
        });
    });
}

// Функция для назначения администратора
function makeAdmin() {
    rl.question('Enter user ID to make admin: ', (userId) => {
        db.run('UPDATE users SET is_admin = 1 WHERE id = ?', [userId], function(err) {
            if (err) {
                console.error('❌ Error updating user:', err.message);
            } else if (this.changes > 0) {
                console.log(`✅ User with ID ${userId} is now admin`);
            } else {
                console.log(`❌ User with ID ${userId} not found`);
            }
        });
    });
}

// Функция для очистки токенов сессий
function clearSessions() {
    db.run('UPDATE users SET session_token = NULL', [], function(err) {
        if (err) {
            console.error('❌ Error clearing sessions:', err.message);
        } else {
            console.log(`✅ Cleared ${this.changes} session tokens`);
        }
    });
}

// Функция для отображения информации о базе данных
function showDatabaseInfo() {
    console.log('\n📊 Database Information:');
    console.log('========================');
    
    // Размер файла базы данных
    const fs = require('fs');
    const stats = fs.statSync('./terminal_data.db');
    console.log(`Database file size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Количество пользователей
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
        if (!err) {
            console.log(`Total users: ${row.count}`);
        }
        
        // Количество администраторов
        db.get('SELECT COUNT(*) as count FROM users WHERE is_admin = 1', [], (err, row) => {
            if (!err) {
                console.log(`Admin users: ${row.count}`);
            }
            
            // Активные сессии
            db.get('SELECT COUNT(*) as count FROM users WHERE session_token IS NOT NULL', [], (err, row) => {
                if (!err) {
                    console.log(`Active sessions: ${row.count}`);
                }
                
                console.log(`Database location: ${process.cwd()}/terminal_data.db`);
                console.log('========================');
            });
        });
    });
}

// Основной цикл меню
function mainMenu() {
    showMenu();
    rl.question('Select option: ', (choice) => {
        switch (choice) {
            case '1':
                listUsers();
                setTimeout(mainMenu, 1000);
                break;
            case '2':
                addUser();
                setTimeout(mainMenu, 2000);
                break;
            case '3':
                deleteUser();
                setTimeout(mainMenu, 1000);
                break;
            case '4':
                makeAdmin();
                setTimeout(mainMenu, 1000);
                break;
            case '5':
                clearSessions();
                setTimeout(mainMenu, 1000);
                break;
            case '6':
                showDatabaseInfo();
                setTimeout(mainMenu, 1000);
                break;
            case '0':
                console.log('👋 Goodbye!');
                db.close();
                rl.close();
                break;
            default:
                console.log('❌ Invalid option');
                setTimeout(mainMenu, 1000);
        }
    });
}

// Запуск программы
console.log('🔐 Retro Terminal User Management Tool');
console.log('=====================================');
mainMenu(); 