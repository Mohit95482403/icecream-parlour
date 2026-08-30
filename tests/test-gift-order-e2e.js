const jwt = require('../backend/node_modules/jsonwebtoken');
const db = require('../backend/config/db');

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'premium_icecream_secret_key_change_me';

async function req(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });
  
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  let data = null;
  if (isJson) {
    data = await res.json();
  } else if (options.responseType === 'arraybuffer') {
    data = Buffer.from(await res.arrayBuffer());
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

async function runTests() {
  console.log('🚀 Starting Gift Order E2E Tests...\n');
  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      testsFailed++;
    }
  }

  try {
    // 1. Get or create a customer user for testing
    let [customers] = await db.query('SELECT * FROM users WHERE role = "customer" LIMIT 1');
    let customerUser;
    if (customers.length > 0) {
      customerUser = customers[0];
    } else {
      const [ins] = await db.query(
        'INSERT INTO users (first_name, last_name, email, phone, role) VALUES (?, ?, ?, ?, ?)',
        ['Test', 'Customer', 'test.customer@glace.com', '9876543210', 'customer']
      );
      customerUser = { id: ins.insertId, first_name: 'Test', last_name: 'Customer', email: 'test.customer@glace.com', role: 'customer' };
    }

    const customerToken = jwt.sign(
      { sub: customerUser.id, email: customerUser.email, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const customerHeaders = {
      headers: { Authorization: `Bearer ${customerToken}` }
    };

    // 2. Get an active product variant for cart testing
    const [variants] = await db.query(`
      SELECT v.id as variantId, v.product_id as productId, p.name as productName, v.name as variantName,
             v.price, i.quantity
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      JOIN inventory i ON v.id = i.variant_id
      WHERE i.quantity > 5
      LIMIT 1
    `);

    if (!variants.length) {
      throw new Error('No active in-stock variant found for testing.');
    }
    const testItem = {
      productId: variants[0].productId,
      variantId: variants[0].variantId,
      name: variants[0].productName,
      variantName: variants[0].variantName,
      price: parseFloat(variants[0].price),
      quantity: 1
    };

    console.log(`📦 Testing with customer: ${customerUser.email} (ID: ${customerUser.id})`);
    console.log(`📦 Testing with product: ${testItem.name} (${testItem.variantName}) @ ₹${testItem.price}`);

    // --- TEST 1: Normal Order (Myself) Backwards Compatibility ---
    console.log('\n--- TEST 1: Normal Order (isGiftOrder = false / omitted) ---');
    const normalPayload = {
      customer: {
        firstName: customerUser.first_name || 'Aarav',
        lastName: customerUser.last_name || 'Sharma',
        email: customerUser.email,
        phone: '9876543210'
      },
      address: {
        addressLine1: 'Flat 402, Sunshine Apts',
        addressLine2: 'MG Road',
        landmark: 'Near City Mall',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India'
      },
      deliveryMethod: 'delivery',
      items: [testItem],
      notes: 'Please ring bell',
      paymentMethod: 'upi',
      isGiftOrder: false
    };

    const normalRes = await req(`${API_BASE}/orders`, {
      method: 'POST',
      body: normalPayload,
      headers: customerHeaders.headers
    });
    assert(normalRes.data?.success === true, 'Normal order placed successfully');
    const normalOrderNumber = normalRes.data?.data?.orderNumber || normalRes.data?.data?.order_number;

    // Check DB record
    const [normalDbOrders] = await db.query('SELECT * FROM orders WHERE order_number = ?', [normalOrderNumber]);
    const normalDbOrder = normalDbOrders[0];
    assert(normalDbOrder.is_gift_order === 0, 'Database is_gift_order is 0 for normal order');
    assert(normalDbOrder.gift_recipient_name === null, 'gift_recipient_name is NULL');
    assert(normalDbOrder.gift_message === null, 'gift_message is NULL');
    const normalSnapshot = JSON.parse(normalDbOrder.delivery_address_snapshot || '{}');
    assert(normalSnapshot.addressLine1 === 'Flat 402, Sunshine Apts', 'delivery_address_snapshot has customer address');

    // --- TEST 2: Gift Order Validation (Missing Recipient Fields) ---
    console.log('\n--- TEST 2: Gift Order Validation Rejections ---');
    const rej1 = await req(`${API_BASE}/orders`, {
      method: 'POST',
      body: {
        ...normalPayload,
        isGiftOrder: true,
        giftRecipientName: '', // empty name
        giftRecipientPhone: '9876543210',
        giftRecipientAddress: 'Plot 12, Rose Villa',
        giftRecipientCity: 'Mumbai',
        giftRecipientState: 'Maharashtra',
        giftRecipientPostalCode: '400001'
      },
      headers: customerHeaders.headers
    });
    assert(rej1.status === 400, 'Rejects empty recipient name with 400');

    const rej2 = await req(`${API_BASE}/orders`, {
      method: 'POST',
      body: {
        ...normalPayload,
        isGiftOrder: true,
        giftRecipientName: 'Priya Patel',
        giftRecipientPhone: '12345', // invalid phone
        giftRecipientAddress: 'Plot 12, Rose Villa',
        giftRecipientCity: 'Mumbai',
        giftRecipientState: 'Maharashtra',
        giftRecipientPostalCode: '400001'
      },
      headers: customerHeaders.headers
    });
    assert(rej2.status === 400, 'Rejects invalid recipient phone with 400');

    const rej3 = await req(`${API_BASE}/orders`, {
      method: 'POST',
      body: {
        ...normalPayload,
        isGiftOrder: true,
        giftRecipientName: 'Priya Patel',
        giftRecipientPhone: '9876543210',
        giftRecipientAddress: 'Plot 12, Rose Villa',
        giftRecipientCity: 'Mumbai',
        giftRecipientState: 'Maharashtra',
        giftRecipientPostalCode: '400001',
        giftMessage: 'a'.repeat(301) // > 300 chars
      },
      headers: customerHeaders.headers
    });
    assert(rej3.status === 400, 'Rejects gift message > 300 characters with 400');

    // --- TEST 3: Valid Gift Order Creation ---
    console.log('\n--- TEST 3: Valid Gift Order Creation ---');
    const giftPayload = {
      customer: {
        firstName: customerUser.first_name,
        lastName: customerUser.last_name,
        email: customerUser.email,
        phone: '9820098200'
      },
      address: {
        addressLine1: 'Purchaser Home, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050',
        country: 'India'
      },
      deliveryMethod: 'delivery',
      items: [testItem],
      notes: 'Fragile, keep frozen',
      paymentMethod: 'upi',
      isGiftOrder: true,
      giftRecipientName: 'Ananya Deshmukh',
      giftRecipientPhone: '9811198111',
      giftRecipientAddress: 'Bungalow 7, Juhu Tara Road',
      giftRecipientCity: 'Mumbai',
      giftRecipientState: 'Maharashtra',
      giftRecipientPostalCode: '400049',
      giftMessage: 'Happy Birthday Ananya! Enjoy your artisanal gelato! 🍨🎉'
    };

    const giftRes = await req(`${API_BASE}/orders`, {
      method: 'POST',
      body: giftPayload,
      headers: customerHeaders.headers
    });
    assert(giftRes.data?.success === true, 'Gift order created successfully');
    const giftOrderNumber = giftRes.data?.data?.orderNumber || giftRes.data?.data?.order_number;

    // Check DB record
    const [giftDbOrders] = await db.query('SELECT * FROM orders WHERE order_number = ?', [giftOrderNumber]);
    const giftDbOrder = giftDbOrders[0];
    assert(giftDbOrder.is_gift_order === 1, 'DB is_gift_order is 1');
    assert(giftDbOrder.gift_recipient_name === 'Ananya Deshmukh', 'gift_recipient_name stored accurately');
    assert(giftDbOrder.gift_recipient_phone === '9811198111', 'gift_recipient_phone stored accurately');
    assert(giftDbOrder.gift_recipient_address === 'Bungalow 7, Juhu Tara Road', 'gift_recipient_address stored accurately');
    assert(giftDbOrder.gift_recipient_city === 'Mumbai', 'gift_recipient_city stored accurately');
    assert(giftDbOrder.gift_recipient_state === 'Maharashtra', 'gift_recipient_state stored accurately');
    assert(giftDbOrder.gift_recipient_postal_code === '400049', 'gift_recipient_postal_code stored accurately');
    assert(giftDbOrder.gift_message === 'Happy Birthday Ananya! Enjoy your artisanal gelato! 🍨🎉', 'gift_message stored accurately');

    const giftSnapshot = JSON.parse(giftDbOrder.delivery_address_snapshot || '{}');
    assert(giftSnapshot.fullName === 'Ananya Deshmukh', 'delivery_address_snapshot uses recipient full name');
    assert(giftSnapshot.addressLine1 === 'Bungalow 7, Juhu Tara Road', 'delivery_address_snapshot uses recipient address');
    assert(giftSnapshot.postalCode === '400049', 'delivery_address_snapshot uses recipient postal code');

    // --- TEST 4: Customer Order History & Detail ---
    console.log('\n--- TEST 4: Customer Orders List & Detail ---');
    const custOrdersRes = await req(`${API_BASE}/orders`, customerHeaders);
    const listedGiftOrder = custOrdersRes.data?.data?.orders?.find(o => o.order_number === giftOrderNumber);
    assert(listedGiftOrder && listedGiftOrder.is_gift_order === 1, 'Customer order history returns is_gift_order = 1');

    const custDetailRes = await req(`${API_BASE}/orders/${giftOrderNumber}`, customerHeaders);
    assert(custDetailRes.data?.data?.order?.is_gift_order === 1, 'Customer order detail contains is_gift_order = 1');
    assert(custDetailRes.data?.data?.order?.gift_recipient_name === 'Ananya Deshmukh', 'Customer order detail contains recipient name');
    assert(custDetailRes.data?.data?.order?.gift_message.includes('Happy Birthday'), 'Customer order detail contains gift message');

    // --- TEST 5: Customer Order Tracking ---
    console.log('\n--- TEST 5: Customer Order Tracking ---');
    const trackingRes = await req(`${API_BASE}/orders/${giftOrderNumber}/tracking`, customerHeaders);
    assert(trackingRes.data?.data?.order?.isGiftOrder === true, 'Tracking endpoint returns isGiftOrder = true');
    assert(trackingRes.data?.data?.order?.giftRecipientName === 'Ananya Deshmukh', 'Tracking endpoint returns recipient name');

    // --- TEST 6: Admin API Endpoints with Gift Filtering ---
    console.log('\n--- TEST 6: Admin Orders Filter & Detail ---');
    const [adminRows] = await db.query('SELECT * FROM users WHERE role = "admin" LIMIT 1');
    if (adminRows.length > 0) {
      const adminToken = jwt.sign(
        { sub: adminRows[0].id, email: adminRows[0].email, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const adminHeaders = {
        headers: { Authorization: `Bearer ${adminToken}`, Cookie: `token=${adminToken}` }
      };

      // Test filter: gift_type = gift
      const giftFilterRes = await req(`${API_BASE}/admin/orders?gift_type=gift`, adminHeaders);
      assert(giftFilterRes.data?.data?.some(o => o.order_number === giftOrderNumber), 'Gift filter includes gift order');
      assert(!giftFilterRes.data?.data?.some(o => o.order_number === normalOrderNumber), 'Gift filter excludes normal order');

      // Test filter: gift_type = regular
      const regularFilterRes = await req(`${API_BASE}/admin/orders?gift_type=regular`, adminHeaders);
      assert(regularFilterRes.data?.data?.some(o => o.order_number === normalOrderNumber), 'Regular filter includes normal order');
      assert(!regularFilterRes.data?.data?.some(o => o.order_number === giftOrderNumber), 'Regular filter excludes gift order');

      // Admin Order Detail
      const adminDetailRes = await req(`${API_BASE}/admin/orders/${giftDbOrder.id}`, adminHeaders);
      assert(adminDetailRes.data?.is_gift_order === 1, 'Admin order detail contains is_gift_order = 1');
      assert(adminDetailRes.data?.gift_recipient_name === 'Ananya Deshmukh', 'Admin order detail contains recipient name');
      assert(adminDetailRes.data?.gift_message.includes('Happy Birthday'), 'Admin order detail contains gift message');

      // Admin Invoice Download for Gift Order
      const invoiceRes = await req(`${API_BASE}/admin/orders/number/${giftOrderNumber}/invoice`, {
        headers: { Cookie: `token=${adminToken}` },
        responseType: 'arraybuffer'
      });
      assert(invoiceRes.status === 200, 'Admin invoice generated successfully (200)');
      assert(invoiceRes.headers['content-type'] === 'application/pdf', 'Admin invoice content-type is application/pdf');
      assert(invoiceRes.data?.length > 1000, `Admin invoice PDF length is valid (${invoiceRes.data?.length} bytes)`);

      // Customer Invoice Download for Gift Order
      const custInvoiceRes = await req(`${API_BASE}/orders/${giftOrderNumber}/invoice`, {
        ...customerHeaders,
        responseType: 'arraybuffer'
      });
      assert(custInvoiceRes.status === 200, 'Customer invoice generated successfully (200)');
      assert(custInvoiceRes.headers['content-type'] === 'application/pdf', 'Customer invoice content-type is application/pdf');
      assert(custInvoiceRes.data?.length > 1000, `Customer invoice PDF length is valid (${custInvoiceRes.data?.length} bytes)`);
    }

    console.log(`\n========================================`);
    console.log(`🏁 All tests completed!`);
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Fatal test error:', err);
    testsFailed++;
  } finally {
    await db.end();
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

runTests();
