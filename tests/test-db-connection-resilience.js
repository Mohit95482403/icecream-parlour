const assert = require('assert');

console.log('🧪 Testing Database Connection Configuration Resilience...\n');

// Test 1: Load config/db module
const db = require('../backend/config/db');

async function testConnection() {
  try {
    const [result] = await db.query('SELECT 1 as test_val');
    assert(result[0].test_val === 1, 'Database returned expected query result');
    console.log('✅ PASS: Database pool connected and executed query successfully.');
    
    console.log('\n========================================');
    console.log('🏁 DB Connection Resilience Test Passed!');
    console.log('========================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ FAIL: Database connection test error:', err);
    process.exit(1);
  }
}

testConnection();
