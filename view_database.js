const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('./terminal_data.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database');
    viewDatabase();
});

function viewDatabase() {
    console.log('\n=== MOTD History ===');
    db.all(`SELECT id, message, language, created_at FROM motd_history ORDER BY created_at DESC LIMIT 15`, (err, rows) => {
        if (err) {
            console.error('Error fetching MOTD history:', err);
        } else {
            rows.forEach((row, index) => {
                console.log(`${index + 1}. [${row.created_at}] [${row.language || 'en'}] ${row.message}`);
            });
        }
        
        console.log('\n=== OpenAI Requests History ===');
        db.all(`SELECT id, request_type, response, created_at FROM openai_requests ORDER BY created_at DESC LIMIT 10`, (err, rows) => {
            if (err) {
                console.error('Error fetching OpenAI history:', err);
            } else {
                rows.forEach((row, index) => {
                    console.log(`${index + 1}. [${row.created_at}] ${row.request_type}: ${row.response}`);
                });
            }
            
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('\nDatabase connection closed');
                }
            });
        });
    });
} 