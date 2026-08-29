require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables:');
    
    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      console.log(`\n--- ${tableName} ---`);
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      columns.forEach(col => {
        console.log(`  ${col.Field} (${col.Type})`);
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkDb();
