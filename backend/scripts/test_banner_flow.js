require('dotenv').config();
const http = require('http');
const app = require('../app');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

let server;
const PORT = 5098;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['Cookie'] = `token=${token}`;
    }

    const req = http.request(url, {
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  server = app.listen(PORT);
  console.log(`Test server running on port ${PORT}...`);

  try {
    // 1. Generate Admin Token
    const [adminUser] = await db.query("SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1");
    if (adminUser.length === 0) {
      throw new Error('No admin user found in DB');
    }
    const admin = adminUser[0];
    const [custUser] = await db.query("SELECT id, email, role FROM users WHERE role = 'customer' LIMIT 1");
    const customer = custUser.length > 0 ? custUser[0] : { id: 999, email: 'customer@test.com', role: 'customer' };
    const authService = require('../services/authService');
    const adminToken = authService.generateToken(admin);
    const customerToken = authService.generateToken(customer);

    console.log('\n--- TEST 1: Public GET active banner ---');
    const res1 = await request('GET', '/api/banner/new-flavour');
    console.log('Status:', res1.status);
    console.log('Active banner title:', res1.data?.data?.title);
    console.log('Linked product slug:', res1.data?.data?.product_slug);
    console.log('Linked product price:', res1.data?.data?.product_price);
    if (res1.status !== 200 || !res1.data?.data?.title) throw new Error('Public banner fetch failed');
    console.log('✅ TEST 1 Passed');

    console.log('\n--- TEST 2: Customer forbidden on Admin Banner endpoint ---');
    const res2 = await request('GET', '/api/admin/banner', null, customerToken);
    console.log('Status with customer token:', res2.status);
    if (res2.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res2.status}`);
    console.log('✅ TEST 2 Passed');

    console.log('\n--- TEST 3: Admin GET Banner Details and Products List ---');
    const res3 = await request('GET', '/api/admin/banner', null, adminToken);
    console.log('Status:', res3.status);
    console.log('Products available for dropdown:', res3.data?.data?.products?.length);
    if (res3.status !== 200 || !res3.data?.data?.products) throw new Error('Admin banner fetch failed');
    console.log('✅ TEST 3 Passed');

    console.log('\n--- TEST 4: Admin Update Banner Content ---');
    const updatePayload = {
      badge: 'LIMITED EDITION',
      title: 'Roasted Bronte Pistachio Crunch',
      description: 'Handcrafted with whole Bronte pistachios and cold-pressed pistachio praline.',
      cta_text: 'Taste Now',
      desktop_image: '/images/signature-collection.jpg',
      mobile_image: '/images/pistachio.jpg',
      product_id: res3.data.data.products[0].id,
      status: 'active'
    };
    const res4 = await request('PUT', '/api/admin/banner', updatePayload, adminToken);
    console.log('Update status:', res4.status, res4.data?.message);
    if (res4.status !== 200) throw new Error('Admin update banner failed');

    // Verify public endpoint gets updated info
    const res4Public = await request('GET', '/api/banner/new-flavour');
    console.log('Updated public title:', res4Public.data?.data?.title);
    console.log('Updated public badge:', res4Public.data?.data?.badge);
    if (res4Public.data?.data?.title !== 'Roasted Bronte Pistachio Crunch') throw new Error('Updated data mismatch on public API');
    console.log('✅ TEST 4 Passed');

    console.log('\n--- TEST 5: Deactivate Banner ---');
    const deactivatePayload = {
      ...updatePayload,
      status: 'inactive'
    };
    const res5 = await request('PUT', '/api/admin/banner', deactivatePayload, adminToken);
    console.log('Deactivate status:', res5.status);
    
    // Verify public endpoint returns data: null
    const res5Public = await request('GET', '/api/banner/new-flavour');
    console.log('Public active banner after deactivation:', res5Public.data?.data);
    if (res5Public.data?.data !== null) throw new Error('Expected null for inactive banner');
    console.log('✅ TEST 5 Passed');

    // Reactivate for live use
    await request('PUT', '/api/admin/banner', updatePayload, adminToken);
    console.log('Reactivated banner for live application.');

    console.log('\n🎉 ALL 5 INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
