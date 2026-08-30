const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load env vars (dotenv won't override already set process.env in production)
dotenv.config();

/**
 * Safely determines if a config value contains an unresolved template placeholder
 * e.g., "${RAILWAY_PRIVATE_DOMAIN}", "${MYSQLHOST}", "$RAILWAY_PRIVATE_DOMAIN", etc.
 */
function isUnresolvedPlaceholder(val) {
  if (!val || typeof val !== 'string') return false;
  const str = val.trim();
  return str.includes('${') || str.includes('$RAILWAY') || str.includes('{RAILWAY') || str.includes('undefined') || str.includes('null');
}

/**
 * Checks if a host or URI references an inaccessible private Railway internal domain
 */
function isPrivateRailwayDomain(val) {
  if (!val || typeof val !== 'string') return false;
  return val.includes('railway.internal') || val.includes('RAILWAY_PRIVATE_DOMAIN');
}

/**
 * Resolve database configuration with safe fallback and priority ordering:
 * 1. Explicit DB_* variables (Render standard)
 * 2. MYSQLHOST / MYSQLPORT / MYSQLUSER / MYSQLPASSWORD / MYSQLDATABASE (Railway public variables)
 * 3. MYSQL_PUBLIC_URL (Railway external public URI)
 * 4. DATABASE_URL / MYSQL_URL (if valid and not an unresolved placeholder)
 * 5. Localhost fallback (development only)
 */
function getDatabaseConfig() {
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Check explicit host variables
  let host = process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_PUBLIC_HOST;
  let port = process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PUBLIC_PORT;
  let user = process.env.DB_USER || process.env.MYSQLUSER;
  let password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD;
  let database = process.env.DB_NAME || process.env.MYSQLDATABASE;
  let ssl = process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true';

  // Check if explicit host is an unresolved placeholder
  if (isUnresolvedPlaceholder(host)) {
    console.warn(`⚠️ Warning: DB_HOST contains unresolved placeholder "${host}". Ignoring.`);
    host = null;
  }

  if (isPrivateRailwayDomain(host)) {
    console.warn(`⚠️ Warning: DB_HOST is set to Railway internal domain "${host}". Render is outside Railway network and requires Railway Public/External domain (e.g., *.proxy.rlwy.net).`);
  }

  // 2. Check for public URL if host is not cleanly set
  const publicUri = process.env.MYSQL_PUBLIC_URL;
  const genericUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

  // Prefer explicit parameters if valid host exists
  if (host && !isUnresolvedPlaceholder(host)) {
    const config = {
      host: host.trim(),
      port: parseInt(port || '3306', 10),
      user: (user || 'root').trim(),
      password: password || '',
      database: (database || 'icecream_db').trim(),
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 30000
    };

    if (ssl || isProduction) {
      config.ssl = { rejectUnauthorized: false };
    }

    return { type: 'params', config, host, port: config.port, user: config.user, database: config.database, ssl: Boolean(config.ssl) };
  }

  // Check public URI
  const targetUri = (publicUri && !isUnresolvedPlaceholder(publicUri)) ? publicUri : genericUri;

  if (targetUri && !isUnresolvedPlaceholder(targetUri) && !isPrivateRailwayDomain(targetUri)) {
    const config = {
      uri: targetUri.trim(),
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 30000
    };

    if (ssl || isProduction) {
      config.ssl = { rejectUnauthorized: false };
    }

    return { type: 'uri', config, host: '[Connection URI]', port: 'default', user: '[Configured in URI]', database: '[Configured in URI]', ssl: Boolean(config.ssl) };
  }

  // Fallback for local development
  const localConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'icecream_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  return { type: 'local_fallback', config: localConfig, host: 'localhost', port: 3306, user: 'root', database: 'icecream_db', ssl: false };
}

const dbInfo = getDatabaseConfig();
const pool = mysql.createPool(dbInfo.config);

// Log safe, non-sensitive startup diagnostics
console.log('--- Database Startup Diagnostics ---');
console.log(`Database host configured: ${dbInfo.host ? 'YES' : 'NO'}`);
console.log(`Database port configured: ${dbInfo.port ? 'YES' : 'NO'}`);
console.log(`Database user configured: ${dbInfo.user ? 'YES' : 'NO'}`);
console.log(`Database name configured: ${dbInfo.database ? 'YES' : 'NO'}`);
console.log(`Database SSL: ${dbInfo.ssl ? 'true' : 'false'}`);
console.log('-------------------------------------');

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Database connected successfully.');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL Database connection failed:');
    console.error(err.message);
    if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
      console.error('💡 Hint for Render + Railway: Ensure Render is using Railway Public/TCP Proxy Host (e.g. *.proxy.rlwy.net and assigned public port), not internal domain or ${RAILWAY_PRIVATE_DOMAIN}.');
    }
  });

module.exports = pool;
