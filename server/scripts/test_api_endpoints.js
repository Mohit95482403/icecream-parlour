require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function pass(testName) {
  console.log(`${colors.green}✓ PASS: ${testName}${colors.reset}`);
}

function fail(testName, err) {
  console.error(`${colors.red}✗ FAIL: ${testName}${colors.reset}`);
  console.error(err);
  process.exitCode = 1;
}

async function testHttpEndpoints() {
  console.log(`${colors.cyan}====================================================`);
  console.log(`TESTING HTTP API ENDPOINTS & AUTHORIZATION`);
  console.log(`====================================================${colors.reset}\n`);

  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

  // Get Admin and Customer
  const [adminUsers] = await db.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
  const [customerUsers] = await db.query("SELECT * FROM users WHERE role = 'customer' LIMIT 1");

  const admin = adminUsers[0];
  const customer = customerUsers[0];

  const adminToken = jwt.sign({ sub: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  const customerToken = jwt.sign({ sub: customer.id, email: customer.email, role: 'customer' }, JWT_SECRET, { expiresIn: '1h' });

  // Create a paid order
  const orderService = require('../services/orderService');
  const paymentService = require('../services/paymentService');
  const [variants] = await db.query("SELECT * FROM product_variants LIMIT 1");
  const created = await orderService.createOrder({
    userId: customer.id,
    subtotal: parseFloat(variants[0].price),
    grandTotal: parseFloat(variants[0].price) + 50,
    deliveryMethod: 'delivery',
    deliveryAddress: { postalCode: '110001', addressLine1: 'API Test St' }
  }, [{
    productId: variants[0].product_id,
    variantId: variants[0].id,
    productName: 'Test Ice Cream',
    variantName: '500ml',
    sku: variants[0].sku,
    quantity: 1,
    price: parseFloat(variants[0].price)
  }]);
  const testOrderId = created.id;
  const testOrderNumber = created.orderNumber;

  const [payments] = await db.query('SELECT id FROM payments WHERE order_id = ?', [testOrderId]);
  await paymentService.processPayment(payments[0].id, 'upi', customer.id);

  console.log(`Using Order #${testOrderNumber} (ID: ${testOrderId}) for API tests.`);

  // 1. TEST: Customer attempting to call Admin Refund endpoint MUST BE 403/401 FORBIDDEN
  try {
    console.log(`\n${colors.yellow}--- TEST: Customer Forbidden from Admin Refund Endpoint ---${colors.reset}`);
    const res = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
        'Cookie': `token=${customerToken}; adminToken=${customerToken}`
      },
      body: JSON.stringify({ reason: 'Unauthorized customer test' })
    });

    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401 or 403 status, got ${res.status}`);
    }
    pass('TEST: Non-admin customer successfully blocked with 401/403 from admin refund endpoint');
  } catch (err) {
    fail('TEST Customer Unauthorized', err);
  }

  // 2. TEST: Admin calling Refund endpoint -> SUCCESS
  try {
    console.log(`\n${colors.yellow}--- TEST: Admin Process Refund Endpoint ---${colors.reset}`);
    const res = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'Cookie': `adminToken=${adminToken}; token=${adminToken}`
      },
      body: JSON.stringify({ reason: 'Admin refund via HTTP API' })
    });

    const json = await res.json();
    if (res.status !== 200 || !json.success) {
      throw new Error(`Admin refund endpoint failed with response: ${JSON.stringify(json)}`);
    }
    pass('TEST: Admin refund endpoint returned 200 OK with success payload');
  } catch (err) {
    fail('TEST Admin Refund', err);
  }

  // 3. TEST: Customer fetching order details -> shows refund info
  try {
    console.log(`\n${colors.yellow}--- TEST: Customer Order Details API ---${colors.reset}`);
    const res = await fetch(`${BASE_URL}/api/orders/${testOrderNumber}`, {
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Cookie': `token=${customerToken}`
      }
    });

    const json = await res.json();
    if (res.status !== 200 || !json.data?.order) {
      throw new Error(`Customer order detail failed: ${JSON.stringify(json)}`);
    }
    const order = json.data.order;
    if (order.payment_status !== 'refunded') throw new Error(`Order payment_status is ${order.payment_status}, expected 'refunded'`);
    if (!order.refund || order.refund.status !== 'REFUNDED') throw new Error('Refund object missing or not REFUNDED');

    pass('TEST: Customer Order Details endpoint returns authoritative refund object');
  } catch (err) {
    fail('TEST Customer Order Details', err);
  }

  // 4. TEST: Invoice download for refunded order
  try {
    console.log(`\n${colors.yellow}--- TEST: Invoice Download for Refunded Order ---${colors.reset}`);
    const res = await fetch(`${BASE_URL}/api/orders/${testOrderNumber}/invoice`, {
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Cookie': `token=${customerToken}`
      }
    });

    if (res.status !== 200 || res.headers.get('content-type') !== 'application/pdf') {
      throw new Error(`Invoice generation failed. Status: ${res.status}, Type: ${res.headers.get('content-type')}`);
    }
    pass('TEST: Invoice generated and downloaded successfully as application/pdf for refunded order');
  } catch (err) {
    fail('TEST Invoice Download', err);
  }

  console.log(`\n${colors.cyan}====================================================`);
  console.log(`ALL HTTP API ENDPOINT TESTS COMPLETED`);
  console.log(`====================================================${colors.reset}\n`);
  process.exit(process.exitCode || 0);
}

testHttpEndpoints().catch(err => {
  console.error('Fatal API test error:', err);
  process.exit(1);
});
