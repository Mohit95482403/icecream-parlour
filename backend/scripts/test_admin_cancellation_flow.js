require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const cancellationService = require('../services/cancellationService');

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

async function runCancellationSuite() {
  console.log(`${colors.cyan}====================================================`);
  console.log(`RUNNING ADMIN CANCELLATION REQUESTS VERIFICATION SUITE`);
  console.log(`====================================================${colors.reset}\n`);

  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

  // Get users
  const [admins] = await db.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
  const [customers] = await db.query("SELECT * FROM users WHERE role = 'customer' LIMIT 1");

  const admin = admins[0];
  const customer = customers[0];

  const adminToken = jwt.sign({ sub: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  const customerToken = jwt.sign({ sub: customer.id, email: customer.email, role: 'customer' }, JWT_SECRET, { expiresIn: '1h' });

  // Get test product variant
  const [variants] = await db.query(`
    SELECT pv.id as variantId, pv.product_id as productId, pv.name as variantName, 
           pv.price, pv.sku, p.name as productName, i.quantity
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    JOIN inventory i ON pv.id = i.variant_id
    WHERE i.quantity >= 10
    LIMIT 1
  `);
  const testVariant = variants[0];
  console.log(`Testing with product: ${testVariant.productName} (${testVariant.variantName}) | Variant ID: ${testVariant.variantId} | Initial Stock: ${testVariant.quantity}`);

  // -------------------------------------------------------------
  // TEST 1: End-to-End Cancellation Request APPROVAL
  // -------------------------------------------------------------
  let order1Id, order1Number, cancelReq1Id;
  const initialStock1 = testVariant.quantity;
  try {
    console.log(`\n${colors.yellow}--- TEST 1: Admin APPROVE Cancellation Request ---${colors.reset}`);

    // 1. Create order
    const created1 = await orderService.createOrder({
      userId: customer.id,
      subtotal: parseFloat(testVariant.price) * 2,
      grandTotal: (parseFloat(testVariant.price) * 2) + 50,
      deliveryMethod: 'delivery',
      deliveryAddress: { postalCode: '400001', addressLine1: 'Test St Approve' }
    }, [{
      productId: testVariant.productId,
      variantId: testVariant.variantId,
      productName: testVariant.productName,
      variantName: testVariant.variantName,
      sku: testVariant.sku,
      quantity: 2,
      price: parseFloat(testVariant.price)
    }]);

    order1Id = created1.id;
    order1Number = created1.orderNumber;

    // 2. Pay order
    const [payments1] = await db.query('SELECT id FROM payments WHERE order_id = ?', [order1Id]);
    await paymentService.processPayment(payments1[0].id, 'upi', customer.id);

    // 3. Update order to confirmed
    await db.query("UPDATE orders SET order_status = 'confirmed' WHERE id = ?", [order1Id]);

    // Check stock after ordering (should be initialStock1 - 2)
    const [stockAfterOrder] = await db.query('SELECT quantity FROM inventory WHERE variant_id = ?', [testVariant.variantId]);
    if (stockAfterOrder[0].quantity !== initialStock1 - 2) {
      throw new Error(`Stock deduction failed. Expected ${initialStock1 - 2}, got ${stockAfterOrder[0].quantity}`);
    }

    // 4. Customer submits cancellation request
    await cancellationService.requestCancellation(order1Id, customer.id, 'Ordered wrong flavor by mistake', 'Please cancel and refund');

    const [cancellations] = await db.query('SELECT id, status FROM order_cancellations WHERE order_id = ? AND status = "PENDING"', [order1Id]);
    if (cancellations.length === 0) throw new Error('Cancellation request not found in DB');
    cancelReq1Id = cancellations[0].id;

    // 5. Admin calls approve API
    const approveRes = await fetch(`${BASE_URL}/api/admin/orders/cancellations/${order1Id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'Cookie': `adminToken=${adminToken}; token=${adminToken}`
      }
    });

    const approveJson = await approveRes.json();
    if (approveRes.status !== 200 || !approveJson.success) {
      throw new Error(`Approve API failed: ${JSON.stringify(approveJson)}`);
    }

    // 6. Verify Database State
    const [cancelReq] = await db.query('SELECT status, admin_id, approved_at FROM order_cancellations WHERE id = ?', [cancelReq1Id]);
    const [orderRow] = await db.query('SELECT order_status, payment_status, cancellation_status FROM orders WHERE id = ?', [order1Id]);
    const [paymentRow] = await db.query('SELECT status, refund_reference, refund_amount, refund_status FROM payments WHERE order_id = ?', [order1Id]);
    const [refundRow] = await db.query('SELECT status, amount, refund_reference FROM refunds WHERE order_id = ?', [order1Id]);
    const [stockAfterApprove] = await db.query('SELECT quantity FROM inventory WHERE variant_id = ?', [testVariant.variantId]);

    if (cancelReq[0].status !== 'APPROVED') throw new Error(`Cancellation request status is ${cancelReq[0].status}, expected APPROVED`);
    if (orderRow[0].order_status !== 'cancelled') throw new Error(`Order status is ${orderRow[0].order_status}, expected cancelled`);
    if (orderRow[0].payment_status !== 'refunded') throw new Error(`Order payment_status is ${orderRow[0].payment_status}, expected refunded`);
    if (paymentRow[0].status !== 'refunded') throw new Error(`Payment status is ${paymentRow[0].status}, expected refunded`);
    if (refundRow.length === 0 || refundRow[0].status !== 'REFUNDED') throw new Error('Refund record missing or status not REFUNDED');
    if (parseFloat(refundRow[0].amount) !== (parseFloat(testVariant.price) * 2) + 50) throw new Error('Refund amount mismatch');
    
    // Check inventory restored exactly once (+2)
    if (stockAfterApprove[0].quantity !== initialStock1) {
      throw new Error(`Inventory restoration mismatch. Expected ${initialStock1}, got ${stockAfterApprove[0].quantity}`);
    }

    pass('TEST 1: Admin approve flow verified (Request APPROVED, Order CANCELLED, Payment REFUNDED, Inventory restored x1)');
  } catch (err) {
    fail('TEST 1', err);
  }

  // -------------------------------------------------------------
  // TEST 2: Duplicate Approve Protection
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 2: Duplicate Approve Protection ---${colors.reset}`);
    
    const dupRes = await fetch(`${BASE_URL}/api/admin/orders/cancellations/${order1Id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'Cookie': `adminToken=${adminToken}; token=${adminToken}`
      }
    });

    const dupJson = await dupRes.json();
    if (dupRes.status !== 400 && dupRes.status !== 200) {
      throw new Error(`Unexpected status code: ${dupRes.status}`);
    }

    // Verify only ONE refund record exists in DB
    const [refundCount] = await db.query('SELECT COUNT(*) as count FROM refunds WHERE order_id = ?', [order1Id]);
    if (refundCount[0].count !== 1) throw new Error(`Duplicate refund created! Count: ${refundCount[0].count}`);

    // Verify inventory not restored again
    const [stockAfterDup] = await db.query('SELECT quantity FROM inventory WHERE variant_id = ?', [testVariant.variantId]);
    if (stockAfterDup[0].quantity !== initialStock1) {
      throw new Error(`Inventory was incorrectly restored twice! Expected ${initialStock1}, got ${stockAfterDup[0].quantity}`);
    }

    pass('TEST 2: Duplicate approval prevented and rejected safely');
  } catch (err) {
    fail('TEST 2', err);
  }

  // -------------------------------------------------------------
  // TEST 3: End-to-End Cancellation Request REJECTION
  // -------------------------------------------------------------
  let order2Id, order2Number, cancelReq2Id;
  try {
    console.log(`\n${colors.yellow}--- TEST 3: Admin REJECT Cancellation Request ---${colors.reset}`);

    // 1. Create order
    const created2 = await orderService.createOrder({
      userId: customer.id,
      subtotal: parseFloat(testVariant.price),
      grandTotal: parseFloat(testVariant.price) + 50,
      deliveryMethod: 'delivery',
      deliveryAddress: { postalCode: '400001', addressLine1: 'Test St Reject' }
    }, [{
      productId: testVariant.productId,
      variantId: testVariant.variantId,
      productName: testVariant.productName,
      variantName: testVariant.variantName,
      sku: testVariant.sku,
      quantity: 1,
      price: parseFloat(testVariant.price)
    }]);

    order2Id = created2.id;
    order2Number = created2.orderNumber;

    // 2. Pay & Confirm
    const [payments2] = await db.query('SELECT id FROM payments WHERE order_id = ?', [order2Id]);
    await paymentService.processPayment(payments2[0].id, 'upi', customer.id);
    await db.query("UPDATE orders SET order_status = 'confirmed' WHERE id = ?", [order2Id]);

    const [stockBeforeReject] = await db.query('SELECT quantity FROM inventory WHERE variant_id = ?', [testVariant.variantId]);

    // 3. Customer requests cancellation
    await cancellationService.requestCancellation(order2Id, customer.id, 'Change of mind', 'No longer need this');

    const [cancellations2] = await db.query('SELECT id FROM order_cancellations WHERE order_id = ? AND status = "PENDING"', [order2Id]);
    cancelReq2Id = cancellations2[0].id;

    // 4. Admin calls reject API
    const rejectReason = 'Ice cream batch is already scooped and packed for dispatch';
    const rejectRes = await fetch(`${BASE_URL}/api/admin/orders/cancellations/${order2Id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'Cookie': `adminToken=${adminToken}; token=${adminToken}`
      },
      body: JSON.stringify({ reason: rejectReason })
    });

    const rejectJson = await rejectRes.json();
    if (rejectRes.status !== 200 || !rejectJson.success) {
      throw new Error(`Reject API failed: ${JSON.stringify(rejectJson)}`);
    }

    // 5. Verify Database State
    const [cancelReqRow] = await db.query('SELECT status, admin_id, admin_reason, rejected_at FROM order_cancellations WHERE id = ?', [cancelReq2Id]);
    const [order2Row] = await db.query('SELECT order_status, payment_status, cancellation_status FROM orders WHERE id = ?', [order2Id]);
    const [payment2Row] = await db.query('SELECT status FROM payments WHERE order_id = ?', [order2Id]);
    const [refund2Rows] = await db.query('SELECT * FROM refunds WHERE order_id = ?', [order2Id]);
    const [stockAfterReject] = await db.query('SELECT quantity FROM inventory WHERE variant_id = ?', [testVariant.variantId]);

    if (cancelReqRow[0].status !== 'REJECTED') throw new Error(`Request status is ${cancelReqRow[0].status}, expected REJECTED`);
    if (cancelReqRow[0].admin_reason !== rejectReason) throw new Error('Admin rejection reason mismatch');
    
    // Order MUST remain confirmed & paid
    if (order2Row[0].order_status !== 'confirmed') throw new Error(`Order status is ${order2Row[0].order_status}, expected confirmed`);
    if (order2Row[0].payment_status !== 'paid') throw new Error(`Payment status is ${order2Row[0].payment_status}, expected paid`);
    if (order2Row[0].cancellation_status !== 'REJECTED') throw new Error(`Cancellation status is ${order2Row[0].cancellation_status}, expected REJECTED`);
    
    // NO refund
    if (refund2Rows.length > 0) throw new Error('Refund was erroneously processed on rejection!');
    if (payment2Row[0].status !== 'paid') throw new Error('Payment status should remain paid');

    // NO inventory restoration
    if (stockAfterReject[0].quantity !== stockBeforeReject[0].quantity) {
      throw new Error(`Inventory was erroneously modified on rejection!`);
    }

    pass('TEST 3: Admin reject flow verified (Request REJECTED, Order remains CONFIRMED, Payment remains PAID, No refund, No inventory restore)');
  } catch (err) {
    fail('TEST 3', err);
  }

  // -------------------------------------------------------------
  // TEST 4: Unauthorized Access Protection
  // -------------------------------------------------------------
  try {
    console.log(`\n${colors.yellow}--- TEST 4: Unauthorized Customer Access Block ---${colors.reset}`);

    const res = await fetch(`${BASE_URL}/api/admin/orders/cancellations/${order1Id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
        'Cookie': `token=${customerToken}`
      }
    });

    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401/403 status, got ${res.status}`);
    }

    pass('TEST 4: Non-admin customer blocked with 401/403 from cancellation approve/reject endpoints');
  } catch (err) {
    fail('TEST 4', err);
  }

  console.log(`\n${colors.cyan}====================================================`);
  console.log(`ALL ADMIN CANCELLATION SUITE TESTS COMPLETED`);
  console.log(`====================================================${colors.reset}\n`);
  process.exit(process.exitCode || 0);
}

runCancellationSuite().catch(err => {
  console.error('Fatal cancellation test error:', err);
  process.exit(1);
});
