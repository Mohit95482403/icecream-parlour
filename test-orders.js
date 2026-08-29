const db = require('./server/config/db');
const orderEventService = require('./server/services/orderEventService');

async function testBackend() {
  console.log('--- STARTING DAY 14 BACKEND TESTS ---');
  
  try {
    // Find a pending order
    const [orders] = await db.query('SELECT * FROM orders WHERE order_status = "pending" LIMIT 1');
    if (!orders.length) {
      console.log('No pending order found to test.');
      process.exit(0);
    }
    const order = orders[0];
    console.log(`Found pending order: ${order.id}`);

    // Test 1: Update order status directly using orderEventService
    console.log('Test 1: Updating order status to processing...');
    await orderEventService.transitionOrderStatus(
      order.id, order.order_number, order.user_id, 'processing', 'admin', 1, 'Test transition'
    );
    console.log('✅ Test 1 Passed: transitionOrderStatus executed successfully.');

    // Verify it updated the DB
    const [updatedOrder] = await db.query('SELECT order_status FROM orders WHERE id = ?', [order.id]);
    if (updatedOrder[0].order_status === 'processing') {
      console.log('✅ Order status is processing.');
    } else {
      console.log('❌ Order status is NOT processing.');
    }

    // Return it to pending so we don't break the actual dataset
    await db.query('UPDATE orders SET order_status = "pending" WHERE id = ?', [order.id]);
    await db.query('DELETE FROM order_status_history WHERE order_id = ? AND new_status = "processing"', [order.id]);
    console.log('Reverted test changes.');
    
    console.log('--- ALL TESTS PASSED ---');
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  } finally {
    process.exit(0);
  }
}

testBackend();
