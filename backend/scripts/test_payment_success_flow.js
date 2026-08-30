require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const checkoutService = require('../services/pricingService');

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

async function runPaymentSuccessSuite() {
  console.log(`${colors.cyan}====================================================`);
  console.log(`RUNNING PAYMENT SUCCESS & ORDER FLOW TEST SUITE`);
  console.log(`====================================================${colors.reset}\n`);

  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

  // 1. Get customer
  const [customers] = await db.query("SELECT * FROM users WHERE role = 'customer' LIMIT 1");
  const customer = customers[0];
  const customerToken = jwt.sign({ sub: customer.id, email: customer.email, role: 'customer' }, JWT_SECRET, { expiresIn: '1h' });

  // 2. Get variant
  const [variants] = await db.query(`
    SELECT pv.id as variantId, pv.product_id as productId, pv.name as variantName, 
           pv.price, pv.sku, p.name as productName, i.quantity
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    JOIN inventory i ON pv.id = i.variant_id
    WHERE i.quantity >= 5
    LIMIT 1
  `);
  const testVariant = variants[0];

  // -------------------------------------------------------------
  // TEST 1: End-to-End Order Creation + Successful Payment
  // -------------------------------------------------------------
  let testOrderNumber = null;
  let testOrderId = null;
  try {
    console.log(`${colors.yellow}--- TEST 1: Order Creation + Authoritative Payment ---${colors.reset}`);
    
    // Create order via API
    const createRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
        'Cookie': `token=${customerToken}`
      },
      body: JSON.stringify({
        customer: {
          firstName: customer.first_name || 'John',
          lastName: customer.last_name || 'Doe',
          email: customer.email,
          phone: '9876543210'
        },
        address: {
          addressLine1: '456 Artisanal Way',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India'
        },
        deliveryMethod: 'delivery',
        items: [{
          productId: testVariant.productId,
          variantId: testVariant.variantId,
          quantity: 1,
          price: parseFloat(testVariant.price)
        }],
        paymentMethod: 'upi'
      })
    });

    const createJson = await createRes.json();
    if (!createJson.success || !createJson.data?.orderNumber) {
      throw new Error(`Order creation failed: ${JSON.stringify(createJson)}`);
    }

    testOrderNumber = createJson.data.orderNumber;
    testOrderId = createJson.data.id;
    console.log(`Order created: #${testOrderNumber} (ID: ${testOrderId})`);

    // Process payment via API
    const payRes = await fetch(`${BASE_URL}/api/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
        'Cookie': `token=${customerToken}`
      },
      body: JSON.stringify({
        orderNumber: testOrderNumber,
        paymentMethod: 'upi'
      })
    });

    const payJson = await payRes.json();
    if (!payJson.success || payJson.data?.status !== 'paid') {
      throw new Error(`Payment processing failed: ${JSON.stringify(payJson)}`);
    }

    // Verify DB states
    const [orders] = await db.query('SELECT payment_status, order_status, total_amount FROM orders WHERE id = ?', [testOrderId]);
    const [payments] = await db.query('SELECT status, amount, transaction_reference FROM payments WHERE order_id = ?', [testOrderId]);

    if (orders[0].payment_status !== 'paid') throw new Error(`Order payment_status is ${orders[0].payment_status}`);
    if (payments[0].status !== 'paid') throw new Error(`Payment status is ${payments[0].status}`);

    pass('TEST 1: Order creation and authoritative payment processing verified');
  } catch (err) {
    fail('TEST 1', err);
  }

  // -------------------------------------------------------------
  // TEST 2: Success Page API Endpoint (Fetch Order by Number & ID)
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 2: Success Page Order Retrieval ---${colors.reset}`);
    
    // By order number
    const resByNum = await fetch(`${BASE_URL}/api/orders/${testOrderNumber}`, {
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Cookie': `token=${customerToken}`
      }
    });
    const jsonByNum = await resByNum.json();
    if (!jsonByNum.success || !jsonByNum.data?.order) {
      throw new Error(`Order fetch by number failed: ${JSON.stringify(jsonByNum)}`);
    }
    const orderData = jsonByNum.data.order;
    if (orderData.payment_status !== 'paid') throw new Error('Order payment status is not paid');
    if (!orderData.payment?.transaction_reference) throw new Error('Payment transaction reference missing');

    // By numeric ID (backward compatibility)
    const resById = await fetch(`${BASE_URL}/api/orders/${testOrderId}`, {
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Cookie': `token=${customerToken}`
      }
    });
    const jsonById = await resById.json();
    if (!jsonById.success || !jsonById.data?.order) {
      throw new Error(`Order fetch by ID failed: ${JSON.stringify(jsonById)}`);
    }

    pass('TEST 2: Success Page order retrieval verified for both order number and numeric ID');
  } catch (err) {
    fail('TEST 2', err);
  }

  // -------------------------------------------------------------
  // TEST 3: Duplicate Payment Protection (Idempotency)
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 3: Duplicate Payment Protection ---${colors.reset}`);
    
    const secondPayRes = await fetch(`${BASE_URL}/api/payments/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
        'Cookie': `token=${customerToken}`
      },
      body: JSON.stringify({
        orderNumber: testOrderNumber,
        paymentMethod: 'upi'
      })
    });

    const secondPayJson = await secondPayRes.json();
    if (!secondPayJson.success || !secondPayJson.data?.isIdempotent) {
      throw new Error(`Second payment attempt should be idempotent: ${JSON.stringify(secondPayJson)}`);
    }

    // Verify only ONE payment row exists
    const [paymentCount] = await db.query('SELECT COUNT(*) as count FROM payments WHERE order_id = ?', [testOrderId]);
    if (paymentCount[0].count !== 1) {
      throw new Error(`Duplicate payment record created! Count: ${paymentCount[0].count}`);
    }

    pass('TEST 3: Duplicate payment protection verified (No duplicate rows, idempotent response)');
  } catch (err) {
    fail('TEST 3', err);
  }

  // -------------------------------------------------------------
  // TEST 4: Payment Failure Handling (No Success Navigation)
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 4: Payment Failure Handling ---${colors.reset}`);
    
    // Create new order
    const created = await orderService.createOrder({
      userId: customer.id,
      subtotal: parseFloat(testVariant.price),
      grandTotal: parseFloat(testVariant.price) + 50,
      deliveryMethod: 'delivery',
      deliveryAddress: { postalCode: '400001', addressLine1: 'Test St' }
    }, [{
      productId: testVariant.productId,
      variantId: testVariant.variantId,
      productName: testVariant.productName,
      variantName: testVariant.variantName,
      sku: testVariant.sku,
      quantity: 1,
      price: parseFloat(testVariant.price)
    }]);

    const [payments] = await db.query('SELECT id FROM payments WHERE order_id = ?', [created.id]);
    const paymentId = payments[0].id;

    // Simulate failure
    await paymentService.failPayment(paymentId, 'Card declined by issuing bank', customer.id);

    const [failedPayment] = await db.query('SELECT status, failure_reason FROM payments WHERE id = ?', [paymentId]);
    const [failedOrder] = await db.query('SELECT payment_status FROM orders WHERE id = ?', [created.id]);

    if (failedPayment[0].status !== 'failed') throw new Error('Payment status is not failed');
    if (failedOrder[0].payment_status !== 'failed') throw new Error('Order payment_status is not failed');

    pass('TEST 4: Payment failure correctly persisted and kept in failed state');
  } catch (err) {
    fail('TEST 4', err);
  }

  // -------------------------------------------------------------
  // TEST 5: Invoice Generation for Paid Order
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 5: Invoice Generation for Paid Order ---${colors.reset}`);
    
    const invoiceRes = await fetch(`${BASE_URL}/api/orders/${testOrderNumber}/invoice`, {
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Cookie': `token=${customerToken}`
      }
    });

    if (invoiceRes.status !== 200 || invoiceRes.headers.get('content-type') !== 'application/pdf') {
      throw new Error(`Invoice generation failed. Status: ${invoiceRes.status}, Content-Type: ${invoiceRes.headers.get('content-type')}`);
    }

    pass('TEST 5: PDF Invoice generation verified for successfully paid order');
  } catch (err) {
    fail('TEST 5', err);
  }

  console.log(`\n${colors.cyan}====================================================`);
  console.log(`ALL PAYMENT SUCCESS SUITE TESTS COMPLETED`);
  console.log(`====================================================${colors.reset}\n`);
  process.exit(process.exitCode || 0);
}

runPaymentSuccessSuite().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
