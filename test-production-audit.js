const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      if (typeof data === 'object') {
        req.write(JSON.stringify(data));
      } else {
        req.write(data);
      }
    }
    req.end();
  });
}

async function runProductionHardeningAudit() {
  console.log('🛡️  Starting Production Hardening Audit Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check & Security Headers
    console.log('--- 1. Health Check & Security Headers ---');
    const health = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    assert(health.statusCode === 200, 'Health endpoint returns 200 OK');
    assert(health.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options is nosniff');
    assert(health.headers['x-frame-options'] === 'DENY', 'X-Frame-Options is DENY');
    assert(health.headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Referrer-Policy is strict-origin-when-cross-origin');

    // 2. CORS Verification
    console.log('\n--- 2. Production CORS Verification ---');
    const corsVercel = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://glace-icecream.vercel.app',
        'Access-Control-Request-Method': 'GET'
      }
    });
    assert(corsVercel.headers['access-control-allow-origin'] === 'https://glace-icecream.vercel.app', 'Vercel domain allowed by CORS');
    assert(corsVercel.headers['access-control-allow-credentials'] === 'true', 'CORS credentials allowed');

    // 3. Unauthorized API Protection (401 on protected endpoints)
    console.log('\n--- 3. Unauthenticated Access Protection (401) ---');
    const adminOrders = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/orders',
      method: 'GET'
    });
    assert(adminOrders.statusCode === 401, 'GET /api/admin/orders returns 401 without auth token');

    const customerAddresses = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/customers/me/addresses',
      method: 'GET'
    });
    assert(customerAddresses.statusCode === 401, 'GET /api/customers/me/addresses returns 401 without auth token');

    const wishlist = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/wishlist',
      method: 'GET'
    });
    assert(wishlist.statusCode === 401, 'GET /api/wishlist returns 401 without auth token');

    // 4. Public Endpoints
    console.log('\n--- 4. Public API Availability ---');
    const products = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/products',
      method: 'GET'
    });
    assert(products.statusCode === 200, 'GET /api/products returns 200');
    assert(Array.isArray(products.data?.data?.products || products.data?.products), 'Products list is an array');

    const categories = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/categories',
      method: 'GET'
    });
    assert(categories.statusCode === 200, 'GET /api/categories returns 200');

    // 5. 404 Endpoint Handling
    console.log('\n--- 5. Safe 404 Handling ---');
    const notFound = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/non-existent-route-xyz',
      method: 'GET'
    });
    assert(notFound.statusCode === 404, 'Non-existent route returns 404 JSON');
    assert(notFound.data?.success === false, '404 response body has success: false');

    console.log('\n========================================');
    console.log('🏁 Audit Completed!');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Audit test runner error:', err);
    process.exit(1);
  }
}

runProductionHardeningAudit();
