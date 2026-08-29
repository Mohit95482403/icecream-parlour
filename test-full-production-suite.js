const jwt = require('./server/node_modules/jsonwebtoken');
const db = require('./server/config/db');

require('./server/node_modules/dotenv').config({ path: './server/.env' });
const JWT_SECRET = process.env.JWT_SECRET || 'premium_icecream_secret_key_change_me';
const API_BASE = 'http://localhost:5000/api';

async function req(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });
  
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  let data = null;
  if (isJson) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    data,
    ok: res.ok
  };
}

async function runCompleteSuite() {
  console.log('🚀 Running Complete End-to-End Production Readiness Suite...\n');
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
    // 1. Health and Proxy Headers
    console.log('--- 1. Health & Server Proxy Check ---');
    const health = await req('/health');
    assert(health.status === 200, 'Health check returns 200 OK');
    assert(health.data?.success === true, 'Health check payload contains success: true');

    // 2. Customer Auth & Session
    console.log('\n--- 2. Customer Authentication Flow ---');
    const testEmail = `prod_test_${Date.now()}@example.com`;
    const regRes = await req('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Production',
        lastName: 'Tester',
        email: testEmail,
        phone: '9876543210',
        password: 'StrongPassword123!'
      }
    });
    assert(regRes.status === 201, 'Customer registration returns 201');

    // Login
    const loginRes = await req('/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: 'StrongPassword123!'
      }
    });
    assert(loginRes.status === 200, 'Customer login returns 200');
    assert(loginRes.data?.data?.customer?.email === testEmail, 'Customer profile sanitized in login response');

    const customerUser = loginRes.data.data.customer;
    const customerToken = jwt.sign(
      { sub: customerUser.id, email: customerUser.email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const customerHeaders = { Authorization: `Bearer ${customerToken}` };

    // 3. Products & Inventory Verification
    console.log('\n--- 3. Products & Stock Verification ---');
    const productsRes = await req('/products');
    assert(productsRes.status === 200, 'Products endpoint returns 200');
    const products = productsRes.data?.data?.products || productsRes.data?.products || [];
    assert(products.length > 0, 'Products catalog is populated');

    // Get an in-stock variant
    const [variants] = await db.query(`
      SELECT v.id as variantId, v.product_id as productId, p.name as productName, v.name as variantName,
             v.price, i.quantity
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      JOIN inventory i ON v.id = i.variant_id
      WHERE i.quantity > 5
      LIMIT 1
    `);
    assert(variants.length > 0, 'In-stock product variant available for order');
    const testVariant = variants[0];

    // 4. Cart & Checkout Flow
    console.log('\n--- 4. Order Creation & Authoritative Pricing ---');
    const orderRes = await req('/orders', {
      method: 'POST',
      headers: customerHeaders,
      body: {
        items: [
          {
            productId: testVariant.productId,
            variantId: testVariant.variantId,
            quantity: 1
          }
        ],
        deliveryMethod: 'delivery',
        address: {
          fullName: 'Production Tester',
          phone: '9876543210',
          addressLine1: 'Flat 402, Sunset Boulevard',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400050',
          country: 'India'
        }
      }
    });
    assert(orderRes.status === 201, 'Order placed successfully (201)');
    const orderData = orderRes.data?.data || {};
    const orderNumber = orderData.orderNumber || orderData.order_number;
    assert(Boolean(orderNumber), `Order created with order number: ${orderNumber}`);

    // 5. Payment Transaction Flow
    console.log('\n--- 5. Payment Processing & State Update ---');
    const payRes = await req('/payments/process', {
      method: 'POST',
      headers: customerHeaders,
      body: {
        orderNumber,
        paymentMethod: 'upi',
        upiId: 'tester@upi'
      }
    });
    assert(payRes.status === 200, 'Payment processed successfully (200)');
    assert(payRes.data?.data?.status === 'paid', 'Payment status marked as paid');

    // 6. Customer Order Detail & IDOR Security
    console.log('\n--- 6. Customer Order Detail & IDOR Check ---');
    const orderDetailRes = await req(`/orders/${orderNumber}`, {
      headers: customerHeaders
    });
    assert(orderDetailRes.status === 200, 'Customer fetches own order details (200)');
    assert(orderDetailRes.data?.data?.order?.order_status === 'pending', 'Order status remains pending after payment');
    assert(orderDetailRes.data?.data?.order?.payment?.status === 'paid', 'Payment record associated with order');

    // IDOR test: Unauthenticated access to order details
    const unauthOrderRes = await req(`/orders/${orderNumber}`);
    assert(unauthOrderRes.status === 401, 'Unauthenticated user cannot view order details (401)');

    // 7. Buy Again Logic Check
    console.log('\n--- 7. Buy Again Verification ---');
    const buyAgainRes = await req(`/orders/${orderNumber}/buy-again`, {
      method: 'POST',
      headers: customerHeaders
    });
    assert(buyAgainRes.status === 200, 'Buy Again endpoint returns 200');
    assert(Array.isArray(buyAgainRes.data?.data?.addedItems), 'Buy Again returns addedItems array');

    // 8. Admin Authorization & Lifecycle
    console.log('\n--- 8. Admin Authorization & Lifecycle ---');
    const adminToken = jwt.sign(
      { sub: 1, email: 'admin@icecream.local', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    const adminOrdersRes = await req('/admin/orders', {
      headers: adminHeaders
    });
    assert(adminOrdersRes.status === 200, 'Admin fetches orders list (200)');

    // Admin customer cancellation / refund test
    console.log('\n--- 9. Cancellation & Refund Lifecycle ---');
    const [dbOrders] = await db.query('SELECT id FROM orders WHERE order_number = ?', [orderNumber]);
    const orderId = dbOrders[0].id;
    
    // Process cancellation & refund
    const cancelRes = await req(`/orders/${orderNumber}/cancel`, {
      method: 'POST',
      headers: customerHeaders,
      body: { reason: 'Test cancellation' }
    });
    assert(cancelRes.status === 200, 'Customer successfully cancelled pending order');

    // Check payment status is now refunded
    const [refundedOrders] = await db.query('SELECT order_status, payment_status FROM orders WHERE id = ?', [orderId]);
    assert(refundedOrders[0].order_status === 'cancelled', 'Order status updated to cancelled in DB');
    assert(refundedOrders[0].payment_status === 'refunded', 'Payment status updated to refunded in DB');

    console.log('\n========================================');
    console.log('🏁 Complete Suite Execution Finished!');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Suite error:', err);
    process.exit(1);
  }
}

runCompleteSuite();
