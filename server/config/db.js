const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

let poolConfig;

if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
  const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;
  poolConfig = {
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    queueLimit: 0
  };
  if (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'icecream_db',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    queueLimit: 0
  };
  if (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

const pool = mysql.createPool(poolConfig);

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Database connected successfully.');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL Database connection failed:');
    console.error(err.message);
  });

module.exports = pool;
