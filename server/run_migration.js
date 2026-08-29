const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'db', 'migrations', 'day7_order_lifecycle.sql');
    const sqlFile = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlFile.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} statements to execute.`);
    
    for (const stmt of statements) {
      console.log('Executing:', stmt.substring(0, 50) + '...');
      await db.query(stmt);
    }
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

runMigration();
