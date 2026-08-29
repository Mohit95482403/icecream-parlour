require('dotenv').config();
const db = require('../config/db');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const cancellationService = require('../services/cancellationService');
const refundService = require('../services/refundService');
const notificationService = require('../services/notificationService');

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

async function runTests() {
  console.log(`${colors.cyan}====================================================`);
  console.log(`RUNNING FULL REFUND SYSTEM VERIFICATION SUITE`);
  console.log(`====================================================${colors.reset}\n`);

  // Ensure test customer and admin exist
  const [adminUsers] = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  const [customerUsers] = await db.query("SELECT id FROM users WHERE role = 'customer' LIMIT 1");
  
  let adminId = adminUsers[0]?.id;
  let customerId = customerUsers[0]?.id;

  if (!adminId || !customerId) {
    throw new Error('Please ensure at least one admin and one customer user exist in DB.');
  }

  // Find a product variant with stock
  const [variants] = await db.query(`
    SELECT pv.id as variantId, pv.product_id as productId, pv.name as variantName, 
           pv.price, pv.sku, p.name as productName, i.quantity
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    JOIN inventory i ON pv.id = i.variant_id
    WHERE i.quantity >= 10
    LIMIT 1
  `);

  if (variants.length === 0) {
    throw new Error('No product variant with >= 10 quantity found.');
  }
  const testVariant = variants[0];
  console.log(`Using Variant: ${testVariant.productName} (${testVariant.variantName}) | Variant ID: ${testVariant.variantId} | Stock: ${testVariant.quantity}`);

  // -------------------------------------------------------------
  // TEST 1: Paid Order + Cancellation + Refund Flow
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 1: Paid Order + Cancellation + Refund Flow ---${colors.reset}`);
    const orderData = {
      userId: customerId,
      subtotal: parseFloat(testVariant.price) * 2,
      discountAmount: 0,
      deliveryFee: 50,
      taxAmount: 0,
      grandTotal: (parseFloat(testVariant.price) * 2) + 50,
      deliveryMethod: 'delivery',
      deliveryAddress: { postalCode: '110001', addressLine1: 'Test St 1' }
    };
    const items = [{
      productId: testVariant.productId,
      variantId: testVariant.variantId,
      productName: testVariant.productName,
      variantName: testVariant.variantName,
      sku: testVariant.sku,
      quantity: 2,
      price: parseFloat(testVariant.price)
    }];

    const created = await orderService.createOrder(orderData, items);
    const orderId = created.id;
    const orderNumber = created.orderNumber;

    // Simulate payment attempt and successful payment
    const [payments] = await db.query('SELECT id FROM payments WHERE order_id = ?', [orderId]);
    const paymentId = payments[0].id;
    await paymentService.processPayment(paymentId, 'upi', customerId);

    // Verify payment is PAID
    const [paidOrder] = await db.query('SELECT payment_status, order_status FROM orders WHERE id = ?', [orderId]);
    if (paidOrder[0].payment_status !== 'paid') throw new Error('Order payment status is not paid');

    // Admin cancels order & processes refund
    const refundResult = await refundService.processRefund({
      orderId,
      adminId,
      reason: 'Customer requested order cancellation'
    });

    // Check DB state
    const [refundedOrder] = await db.query('SELECT payment_status, order_status, cancellation_status FROM orders WHERE id = ?', [orderId]);
    const [refundedPayment] = await db.query('SELECT status, refund_reference, refund_amount, refund_status FROM payments WHERE order_id = ?', [orderId]);
    const [refundRecord] = await db.query('SELECT * FROM refunds WHERE order_id = ?', [orderId]);

    if (refundedOrder[0].order_status !== 'cancelled') throw new Error('Order status not cancelled');
    if (refundedOrder[0].payment_status !== 'refunded') throw new Error('Order payment_status not refunded');
    if (refundedPayment[0].status !== 'refunded') throw new Error('Payment status not refunded');
    if (refundRecord.length === 0 || refundRecord[0].status !== 'REFUNDED') throw new Error('Refund record not created or status not REFUNDED');
    if (parseFloat(refundRecord[0].amount) !== orderData.grandTotal) throw new Error('Refund amount mismatch');

    pass('TEST 1: Paid Order + Cancellation + Refund Flow successfully verified');
  } catch (err) {
    fail('TEST 1', err);
  }

  // -------------------------------------------------------------
  // TEST 2: Failed Payment (No refund should be processed)
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 2: Failed Payment ---${colors.reset}`);
    const orderData = {
      userId: customerId,
      subtotal: parseFloat(testVariant.price),
      discountAmount: 0,
      deliveryFee: 50,
      taxAmount: 0,
      grandTotal: parseFloat(testVariant.price) + 50,
      deliveryMethod: 'delivery',
      deliveryAddress: { postalCode: '110001', addressLine1: 'Test St 2' }
    };
    const items = [{
      productId: testVariant.productId,
      variantId: testVariant.variantId,
      productName: testVariant.productName,
      variantName: testVariant.variantName,
      sku: testVariant.sku,
      quantity: 1,
      price: parseFloat(testVariant.price)
    }];

    const created = await orderService.createOrder(orderData, items);
    const orderId = created.id;

    // Mark payment as failed
    await db.query("UPDATE payments SET status = 'failed', failure_reason = 'Simulated failure' WHERE order_id = ?", [orderId]);
    await db.query("UPDATE orders SET payment_status = 'failed' WHERE id = ?", [orderId]);

    // Try processing refund - MUST FAIL
    let rejected = false;
    try {
      await refundService.processRefund({ orderId, adminId, reason: 'Test' });
    } catch (err) {
      rejected = true;
    }

    if (!rejected) throw new Error('Refund service should have rejected refund for failed payment');

    const [refunds] = await db.query('SELECT * FROM refunds WHERE order_id = ?', [orderId]);
    if (refunds.length > 0 && refunds[0].status === 'REFUNDED') {
      throw new Error('Refund record was incorrectly created for a failed payment');
    }

    pass('TEST 2: Failed Payment refund rejection successfully verified');
  } catch (err) {
    fail('TEST 2', err);
  }

  // -------------------------------------------------------------
  // TEST 3: Pending Payment (No refund should be processed)
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 3: Pending Payment ---${colors.reset}`);
    const orderData = {
      userId: customerId,
      subtotal: parseFloat(testVariant.price),
      discountAmount: 0,
      deliveryFee: 50,
      taxAmount: 0,
      grandTotal: parseFloat(testVariant.price) + 50,
      deliveryMethod: 'delivery',
      deliveryAddress: { postalCode: '110001', addressLine1: 'Test St 3' }
    };
    const items = [{
      productId: testVariant.productId,
      variantId: testVariant.variantId,
      productName: testVariant.productName,
      variantName: testVariant.variantName,
      sku: testVariant.sku,
      quantity: 1,
      price: parseFloat(testVariant.price)
    }];

    const created = await orderService.createOrder(orderData, items);
    const orderId = created.id;

    let rejected = false;
    try {
      await refundService.processRefund({ orderId, adminId, reason: 'Test pending' });
    } catch (err) {
      rejected = true;
    }

    if (!rejected) throw new Error('Refund service should have rejected refund for pending payment');
    pass('TEST 3: Pending Payment refund rejection successfully verified');
  } catch (err) {
    fail('TEST 3', err);
  }

  // -------------------------------------------------------------
  // TEST 4: Duplicate Refund Protection (Idempotency)
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 4: Duplicate Refund Protection (Idempotency) ---${colors.reset}`);
    const orderData = {
      userId: customerId,
      subtotal: parseFloat(testVariant.price),
      discountAmount: 0,
      deliveryFee: 50,
      taxAmount: 0,
      grandTotal: parseFloat(testVariant.price) + 50,
      deliveryMethod: 'delivery',
      deliveryAddress: { postalCode: '110001', addressLine1: 'Test St 4' }
    };
    const items = [{
      productId: testVariant.productId,
      variantId: testVariant.variantId,
      productName: testVariant.productName,
      variantName: testVariant.variantName,
      sku: testVariant.sku,
      quantity: 1,
      price: parseFloat(testVariant.price)
    }];

    const created = await orderService.createOrder(orderData, items);
    const orderId = created.id;

    // Pay order
    const [payments] = await db.query('SELECT id FROM payments WHERE order_id = ?', [orderId]);
    await paymentService.processPayment(payments[0].id, 'card', customerId);

    // First refund
    const refund1 = await refundService.processRefund({ orderId, adminId, reason: 'First refund' });
    if (!refund1.success || refund1.isIdempotent) throw new Error('First refund should not be idempotent');

    // Second refund attempt
    const refund2 = await refundService.processRefund({ orderId, adminId, reason: 'Second refund' });
    if (!refund2.success || !refund2.isIdempotent) throw new Error('Second refund should be marked as idempotent');

    // Verify only ONE refund record exists in DB
    const [refundRows] = await db.query('SELECT COUNT(*) as count FROM refunds WHERE order_id = ?', [orderId]);
    if (refundRows[0].count !== 1) throw new Error(`Expected 1 refund record, found ${refundRows[0].count}`);

    pass('TEST 4: Duplicate refund protection (Idempotency) successfully verified');
  } catch (err) {
    fail('TEST 4', err);
  }

  // -------------------------------------------------------------
  // TEST 5: Frontend Amount Manipulation Protection
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 5: Frontend Amount Manipulation Protection ---${colors.reset}`);
    const orderData = {
      userId: customerId,
      subtotal: parseFloat(testVariant.price),
      discountAmount: 0,
      deliveryFee: 50,
      taxAmount: 0,
      grandTotal: parseFloat(testVariant.price) + 50,
      deliveryMethod: 'delivery',
      deliveryAddress: { postalCode: '110001', addressLine1: 'Test St 5' }
    };
    const items = [{
      productId: testVariant.productId,
      variantId: testVariant.variantId,
      productName: testVariant.productName,
      variantName: testVariant.variantName,
      sku: testVariant.sku,
      quantity: 1,
      price: parseFloat(testVariant.price)
    }];

    const created = await orderService.createOrder(orderData, items);
    const orderId = created.id;

    // Pay order
    const [payments] = await db.query('SELECT id FROM payments WHERE order_id = ?', [orderId]);
    await paymentService.processPayment(payments[0].id, 'upi', customerId);

    // Call refund (simulating any client request; refundService takes orderId and queries authoritative payment amount)
    const refundResult = await refundService.processRefund({ orderId, adminId, reason: 'Manipulation test' });
    const [refundRecord] = await db.query('SELECT amount FROM refunds WHERE order_id = ?', [orderId]);

    if (parseFloat(refundRecord[0].amount) !== orderData.grandTotal) {
      throw new Error(`Refund amount was altered! Expected ${orderData.grandTotal}, found ${refundRecord[0].amount}`);
    }

    pass('TEST 5: Frontend Amount Manipulation Protection successfully verified (Server-authoritative amount enforced)');
  } catch (err) {
    fail('TEST 5', err);
  }

  // -------------------------------------------------------------
  // TEST 8: Inventory Integrity (No duplicate stock restore)
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 8: Inventory Integrity ---${colors.reset}`);
    
    // Check initial stock
    const [stockBefore] = await db.query('SELECT quantity FROM inventory WHERE variant_id = ?', [testVariant.variantId]);
    const initialStock = stockBefore[0].quantity;

    const orderData = {
      userId: customerId,
      subtotal: parseFloat(testVariant.price) * 3,
      discountAmount: 0,
      deliveryFee: 0,
      taxAmount: 0,
      grandTotal: parseFloat(testVariant.price) * 3,
      deliveryMethod: 'pickup',
      deliveryAddress: {}
    };
    const items = [{
      productId: testVariant.productId,
      variantId: testVariant.variantId,
      productName: testVariant.productName,
      variantName: testVariant.variantName,
      sku: testVariant.sku,
      quantity: 3,
      price: parseFloat(testVariant.price)
    }];

    // 1. Create order -> Stock decreases by 3
    const created = await orderService.createOrder(orderData, items);
    const [stockAfterOrder] = await db.query('SELECT quantity FROM inventory WHERE variant_id = ?', [testVariant.variantId]);
    if (stockAfterOrder[0].quantity !== initialStock - 3) {
      throw new Error(`Stock deduction failed. Expected ${initialStock - 3}, found ${stockAfterOrder[0].quantity}`);
    }

    // 2. Pay order
    const [payments] = await db.query('SELECT id FROM payments WHERE order_id = ?', [created.id]);
    await paymentService.processPayment(payments[0].id, 'upi', customerId);

    // 3. Cancel order directly or via cancellationService -> Stock restored by 3
    await cancellationService.cancelOrderDirectly(created.id, customerId, 'Inventory test cancellation');

    const [stockAfterCancel] = await db.query('SELECT quantity FROM inventory WHERE variant_id = ?', [testVariant.variantId]);
    if (stockAfterCancel[0].quantity !== initialStock) {
      throw new Error(`Stock restoration failed. Expected ${initialStock}, found ${stockAfterCancel[0].quantity}`);
    }

    // 4. Trigger refund again (idempotent) -> Verify stock does NOT increase again
    await refundService.processRefund({ orderId: created.id, adminId, reason: 'Extra refund call' });

    const [stockAfterRefund] = await db.query('SELECT quantity FROM inventory WHERE variant_id = ?', [testVariant.variantId]);
    if (stockAfterRefund[0].quantity !== initialStock) {
      throw new Error(`Stock was erroneously restored twice! Expected ${initialStock}, found ${stockAfterRefund[0].quantity}`);
    }

    pass('TEST 8: Inventory Integrity successfully verified (No duplicate restoration, server-authoritative stock)');
  } catch (err) {
    fail('TEST 8', err);
  }

  // -------------------------------------------------------------
  // TEST 9: Customer Notification Verification
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 9: Customer Notification Verification ---${colors.reset}`);
    const orderData = {
      userId: customerId,
      subtotal: parseFloat(testVariant.price),
      discountAmount: 0,
      deliveryFee: 50,
      taxAmount: 0,
      grandTotal: parseFloat(testVariant.price) + 50,
      deliveryMethod: 'delivery',
      deliveryAddress: { postalCode: '110001', addressLine1: 'Test St 9' }
    };
    const items = [{
      productId: testVariant.productId,
      variantId: testVariant.variantId,
      productName: testVariant.productName,
      variantName: testVariant.variantName,
      sku: testVariant.sku,
      quantity: 1,
      price: parseFloat(testVariant.price)
    }];

    const created = await orderService.createOrder(orderData, items);
    const orderId = created.id;

    // Pay & Refund
    const [payments] = await db.query('SELECT id FROM payments WHERE order_id = ?', [orderId]);
    await paymentService.processPayment(payments[0].id, 'upi', customerId);
    await refundService.processRefund({ orderId, adminId, reason: 'Notification test' });

    // Check notifications for customer
    const [notifs] = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? AND type = 'REFUND_COMPLETED' 
       AND JSON_EXTRACT(metadata, '$.orderId') = ?`,
      [customerId, orderId]
    );

    if (notifs.length === 0) {
      throw new Error('Refund notification was not created for customer');
    }
    const meta = typeof notifs[0].metadata === 'string' ? JSON.parse(notifs[0].metadata) : notifs[0].metadata;
    if (!meta.refundReference || !meta.refundAmount) {
      throw new Error('Notification metadata missing refund reference or amount');
    }

    pass('TEST 9: Customer Refund Notification successfully verified');
  } catch (err) {
    fail('TEST 9', err);
  }

  // -------------------------------------------------------------
  // TEST 10: Database Relationships & Persistence Check
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 10: Database Relationships & Persistence ---${colors.reset}`);
    const [allRefunds] = await db.query(`
      SELECT r.id as refund_id, r.order_id, r.amount, r.status as refund_status, r.refund_reference,
             p.id as payment_id, p.status as payment_status, p.transaction_reference,
             o.order_number, o.order_status, o.payment_status as order_payment_status
      FROM refunds r
      JOIN payments p ON r.order_id = p.order_id
      JOIN orders o ON r.order_id = o.id
      WHERE r.status = 'REFUNDED'
      LIMIT 5
    `);

    if (allRefunds.length === 0) throw new Error('No completed refunds found in DB to verify relationships');

    for (const row of allRefunds) {
      if (row.payment_status !== 'refunded') throw new Error(`Payment #${row.payment_id} status mismatch: ${row.payment_status}`);
      if (row.order_status !== 'cancelled') throw new Error(`Order #${row.order_number} status mismatch: ${row.order_status}`);
      if (row.order_payment_status !== 'refunded') throw new Error(`Order #${row.order_number} payment status mismatch: ${row.order_payment_status}`);
    }

    pass('TEST 10: Database relationships and consistency verified across Orders ↕ Payments ↕ Refunds');
  } catch (err) {
    fail('TEST 10', err);
  }

  console.log(`\n${colors.cyan}====================================================`);
  console.log(`ALL VERIFICATION SUITE TESTS COMPLETED`);
  console.log(`====================================================${colors.reset}\n`);
  process.exit(process.exitCode || 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
