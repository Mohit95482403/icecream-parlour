const express = require('express');
const request = require('http');
const app = require('../app');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function testApi() {
  console.log('====================================================');
  console.log('  BUY AGAIN HTTP API ROUTE & SECURITY TEST SUITE');
  console.log('====================================================\n');

  const server = app.listen(5099);

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}: ${details}`);
    }
  }

  function makeRequest(path, method = 'GET', token = null) {
    return new Promise((resolve, reject) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const req = request.request({
        hostname: 'localhost',
        port: 5099,
        path,
        method,
        headers
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch(e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  try {
    const [customerRows] = await db.query('SELECT id, email, role FROM users WHERE role = "customer" LIMIT 2');
    const customerA = customerRows[0];
    const customerB = customerRows[1];

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me';
    const tokenA = jwt.sign({ sub: customerA.id, role: customerA.role, email: customerA.email }, secret, { expiresIn: '1h' });
    const tokenB = jwt.sign({ sub: customerB.id, role: customerB.role, email: customerB.email }, secret, { expiresIn: '1h' });

    // Create a real order for customer A
    const testOrderNum = `API-TEST-${Date.now()}`;
    const [orderRes] = await db.query(`
      INSERT INTO orders (order_number, user_id, subtotal, discount_amount, delivery_fee, tax_amount, total_amount, payment_status, order_status)
      VALUES (?, ?, 500, 0, 50, 25, 575, 'paid', 'delivered')
    `, [testOrderNum, customerA.id]);
    const orderId = orderRes.insertId;

    const [variants] = await db.query('SELECT v.id as variant_id, v.product_id, v.price, v.sku, v.size, p.name FROM product_variants v JOIN products p ON v.product_id = p.id LIMIT 1');
    const v = variants[0];
    await db.query(`
      INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, sku, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, 2, 99.00, 198.00)
    `, [orderId, v.product_id, v.variant_id, v.name, v.size, v.sku]);

    // 1. Unauthenticated request -> 401
    const resUnauth = await makeRequest(`/api/orders/${testOrderNum}/buy-again`, 'POST');
    assert(resUnauth.status === 401, 'Unauthenticated POST /buy-again rejected with 401');

    // 2. Customer A request -> 200 + proper body
    const resAuthA = await makeRequest(`/api/orders/${testOrderNum}/buy-again`, 'POST', tokenA);
    assert(resAuthA.status === 200, 'Authenticated Customer A POST /buy-again returns 200');
    assert(resAuthA.body.success === true, 'Response body has success: true');
    assert(resAuthA.body.data.addedItems.length === 1, 'Returns 1 added item');
    assert(resAuthA.body.data.addedItems[0].price === parseFloat(v.price), 'Live price returned in response');

    // 3. Customer B request on Customer A order -> 404
    const resAuthB = await makeRequest(`/api/orders/${testOrderNum}/buy-again`, 'POST', tokenB);
    assert(resAuthB.status === 404, 'Customer B attempting Customer A order blocked with 404 (IDOR Protection)');

    // 4. POST /reorder alias
    const resReorderPost = await makeRequest(`/api/orders/${testOrderNum}/reorder`, 'POST', tokenA);
    assert(resReorderPost.status === 200, 'POST /reorder alias returns 200');

    // 5. GET /reorder backwards compatibility
    const resReorderGet = await makeRequest(`/api/orders/${testOrderNum}/reorder`, 'GET', tokenA);
    assert(resReorderGet.status === 200, 'GET /reorder backwards compatibility returns 200');

    // Cleanup
    await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    await db.query('DELETE FROM orders WHERE id = ?', [orderId]);

    console.log('\n====================================================');
    console.log(`  API TEST RESULTS: ${passed} / ${total} PASSED`);
    console.log('====================================================\n');
  } catch(err) {
    console.error('API Test Error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

testApi();
