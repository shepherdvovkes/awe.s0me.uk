const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('./terminal_data.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database');
    migrateDatabase();
});

function migrateDatabase() {
    console.log('Starting database migration...');
    
    // Check if language column exists
    db.get("PRAGMA table_info(motd_history)", (err, rows) => {
        if (err) {
            console.error('Error checking table structure:', err);
            return;
        }
        
        // Add language column if it doesn't exist
        db.run(`ALTER TABLE motd_history ADD COLUMN language TEXT DEFAULT 'en'`, (err) => {
            if (err) {
                console.log('Language column already exists or error:', err.message);
            } else {
                console.log('Successfully added language column');
            }
            
            // Update existing records to have language 'en'
            db.run(`UPDATE motd_history SET language = 'en' WHERE language IS NULL`, (err) => {
                if (err) {
                    console.error('Error updating existing records:', err);
                } else {
                    console.log('Updated existing records with default language');
                }
                
                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                    } else {
                        console.log('Database migration completed');
                    }
                });
            });
        });
    });
} 