require('dotenv').config();
const db = require('./config/db');

async function checkSchema() {
  try {
    const [ordersDesc] = await db.query('DESCRIBE orders');
    
    console.log('--- ORDERS TABLE ---');
    console.table(ordersDesc.map(col => ({ Field: col.Field, Type: col.Type, Null: col.Null, Key: col.Key })));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
