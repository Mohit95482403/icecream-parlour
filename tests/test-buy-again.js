const db = require('../backend/config/db');
const orderService = require('../backend/services/orderService');

async function runTests() {
  console.log('====================================================');
  console.log('  BUY AGAIN / REORDER COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details}`);
    }
  }

  try {
    // Setup test customer and products in DB
    const [customerRows] = await db.query('SELECT id, email FROM users WHERE role = "customer" LIMIT 2');
    if (customerRows.length < 2) {
      throw new Error('Need at least 2 customer accounts in the database for test');
    }
    const customerA = customerRows[0];
    const customerB = customerRows[1];

    console.log(`Test Customer A: ID=${customerA.id} (${customerA.email})`);
    console.log(`Test Customer B: ID=${customerB.id} (${customerB.email})\n`);

    // Fetch active products and variants
    const [variants] = await db.query(`
      SELECT v.id as variant_id, v.product_id, v.price, v.sku, v.size, p.name as product_name,
             i.quantity, i.reserved_quantity
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      JOIN inventory i ON v.id = i.variant_id
      WHERE p.status = 'active' AND v.status = 'active' AND (i.quantity - i.reserved_quantity) >= 5
      LIMIT 4
    `);

    if (variants.length < 3) {
      throw new Error('Need at least 3 active variants with stock in DB');
    }

    const var1 = variants[0];
    const var2 = variants[1];
    const var3 = variants[2];

    // Create a temporary test order for Customer A
    const testOrderNumber = `TEST-REORDER-${Date.now()}`;
    const [orderResult] = await db.query(`
      INSERT INTO orders (
        order_number, user_id, subtotal, discount_amount, delivery_fee, tax_amount, total_amount,
        delivery_method, payment_status, order_status, notes
      ) VALUES (?, ?, 1000.00, 0.00, 50.00, 50.00, 1100.00, 'delivery', 'paid', 'delivered', 'Automated Test Order')
    `, [testOrderNumber, customerA.id]);

    const testOrderId = orderResult.insertId;

    // Insert order items with old mock historical prices (different from live price)
    const oldPrice1 = 99.00;
    const oldPrice2 = 149.00;
    const oldPrice3 = 199.00;

    await db.query(`
      INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, sku, quantity, unit_price, total_price)
      VALUES 
      (?, ?, ?, ?, ?, ?, 2, ?, ?),
      (?, ?, ?, ?, ?, ?, 1, ?, ?),
      (?, ?, ?, ?, ?, ?, 5, ?, ?)
    `, [
      testOrderId, var1.product_id, var1.variant_id, var1.product_name, var1.size, var1.sku, oldPrice1, oldPrice1 * 2,
      testOrderId, var2.product_id, var2.variant_id, var2.product_name, var2.size, var2.sku, oldPrice2, oldPrice2,
      testOrderId, var3.product_id, var3.variant_id, var3.product_name, var3.size, var3.sku, oldPrice3, oldPrice3 * 5
    ]);

    console.log(`Created Test Order: ${testOrderNumber} (ID: ${testOrderId})\n`);

    // -------------------------------------------------------------
    // Test 1: Everything Available & Current Prices Used (Never Old Prices)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Everything Available & Live Pricing ---');
    const res1 = await orderService.processBuyAgain(testOrderNumber, customerA.id);
    
    assert(res1.addedItems.length === 3, 'All 3 items identified as available to add');
    assert(res1.unavailableItems.length === 0, 'No items unavailable');
    
    const addedVar1 = res1.addedItems.find(i => i.variantId === var1.variant_id);
    assert(addedVar1 && addedVar1.price === parseFloat(var1.price), 
      `Authoritative live price used (₹${var1.price}) instead of old price (₹${oldPrice1})`);
    assert(addedVar1 && addedVar1.price !== oldPrice1, 'Old historical price was NOT used');
    assert(addedVar1 && addedVar1.quantity === 2, 'Quantity matches requested amount (2)');

    // -------------------------------------------------------------
    // Test 2: Out of Stock Product Handling
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Out of Stock Handling ---');
    // Temporarily set var2 stock to 0
    const [origInv2] = await db.query('SELECT quantity, reserved_quantity FROM inventory WHERE variant_id = ?', [var2.variant_id]);
    await db.query('UPDATE inventory SET quantity = 0, reserved_quantity = 0 WHERE variant_id = ?', [var2.variant_id]);

    const res2 = await orderService.processBuyAgain(testOrderNumber, customerA.id);
    assert(res2.addedItems.length === 2, 'Only in-stock items added (2 of 3)');
    assert(res2.unavailableItems.length === 1, '1 item correctly marked unavailable');
    assert(res2.unavailableItems[0].code === 'OUT_OF_STOCK', 'Unavailable item has code OUT_OF_STOCK');
    assert(res2.unavailableItems[0].variantId === var2.variant_id, 'Out-of-stock item is variant 2');

    // Restore var2 stock
    await db.query('UPDATE inventory SET quantity = ?, reserved_quantity = ? WHERE variant_id = ?', [origInv2[0].quantity, origInv2[0].reserved_quantity, var2.variant_id]);

    // -------------------------------------------------------------
    // Test 3: Quantity Capped to Available Inventory
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Partial Quantity Adjustment ---');
    // Requested quantity for var3 is 5. Temporarily set available stock to 3.
    const [origInv3] = await db.query('SELECT quantity, reserved_quantity FROM inventory WHERE variant_id = ?', [var3.variant_id]);
    await db.query('UPDATE inventory SET quantity = 3, reserved_quantity = 0 WHERE variant_id = ?', [var3.variant_id]);

    const res3 = await orderService.processBuyAgain(testOrderNumber, customerA.id);
    const addedVar3 = res3.addedItems.find(i => i.variantId === var3.variant_id);
    assert(addedVar3 && addedVar3.quantity === 3, 'Quantity reduced from 5 to available stock of 3');
    assert(res3.adjustedItems.length === 1, '1 item recorded in adjustedItems');
    assert(res3.adjustedItems[0].requestedQuantity === 5 && res3.adjustedItems[0].addedQuantity === 3, 'Adjustment record has correct requested and added quantities');

    // Restore var3 stock
    await db.query('UPDATE inventory SET quantity = ?, reserved_quantity = ? WHERE variant_id = ?', [origInv3[0].quantity, origInv3[0].reserved_quantity, var3.variant_id]);

    // -------------------------------------------------------------
    // Test 4: Inactive Product & Inactive Variant Handling
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Inactive Product / Variant Handling ---');
    // Temporarily set var1 variant to inactive
    await db.query('UPDATE product_variants SET status = "inactive" WHERE id = ?', [var1.variant_id]);

    const res4 = await orderService.processBuyAgain(testOrderNumber, customerA.id);
    const unavailVar1 = res4.unavailableItems.find(i => i.variantId === var1.variant_id);
    assert(unavailVar1 && unavailVar1.code === 'VARIANT_INACTIVE', 'Inactive variant skipped with VARIANT_INACTIVE code');

    // Restore var1 status
    await db.query('UPDATE product_variants SET status = "active" WHERE id = ?', [var1.variant_id]);

    // -------------------------------------------------------------
    // Test 5: Deleted / Non-existent Product or Variant (variant_id set to NULL by DB ON DELETE SET NULL)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Deleted Product/Variant Graceful Handling ---');
    await db.query(`
      INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, sku, quantity, unit_price, total_price)
      VALUES (?, NULL, NULL, 'Discontinued Mango Crunch', '500ml', 'SKU-OLD-MANGO', 1, 250.00, 250.00)
    `, [testOrderId]);

    const res5 = await orderService.processBuyAgain(testOrderNumber, customerA.id);
    const unavailDeleted = res5.unavailableItems.find(i => i.name === 'Discontinued Mango Crunch');
    assert(unavailDeleted && (unavailDeleted.code === 'PRODUCT_DELETED' || unavailDeleted.code === 'VARIANT_DELETED'), 
      'Deleted / non-existent product safely skipped without crashing');

    // -------------------------------------------------------------
    // Test 6: IDOR Protection (Customer B cannot reorder Customer A's order)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: IDOR Protection ---');
    let idorBlocked = false;
    try {
      await orderService.processBuyAgain(testOrderNumber, customerB.id);
    } catch (err) {
      if (err.statusCode === 404 || err.message.includes('unauthorized') || err.message.includes('not found')) {
        idorBlocked = true;
      }
    }
    assert(idorBlocked, 'Customer B is rejected when attempting to reorder Customer A order');

    // -------------------------------------------------------------
    // Test 7: Non-existent Order Handling
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Non-existent Order Handling ---');
    let notFoundHandled = false;
    try {
      await orderService.processBuyAgain('NON-EXISTENT-ORDER-12345', customerA.id);
    } catch (err) {
      if (err.statusCode === 404 || err.message.includes('not found')) {
        notFoundHandled = true;
      }
    }
    assert(notFoundHandled, 'Non-existent order is properly rejected with 404');

    // -------------------------------------------------------------
    // Test 8: Inventory Integrity (Buy Again does NOT deduct inventory)
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Inventory Integrity (No stock deduction) ---');
    const [stockBefore] = await db.query('SELECT quantity FROM inventory WHERE variant_id = ?', [var1.variant_id]);
    await orderService.processBuyAgain(testOrderNumber, customerA.id);
    const [stockAfter] = await db.query('SELECT quantity FROM inventory WHERE variant_id = ?', [var1.variant_id]);
    assert(stockBefore[0].quantity === stockAfter[0].quantity, 'Inventory quantity is untouched by Buy Again operation');

    // -------------------------------------------------------------
    // Test 9: Backwards Compatibility with getReorderItems
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Backwards Compatibility ---');
    const compatItems = await orderService.getReorderItems(testOrderNumber, customerA.id);
    assert(Array.isArray(compatItems) && compatItems.length >= 3, 'getReorderItems returns valid items array');

    // Clean up test order
    await db.query('DELETE FROM order_items WHERE order_id = ?', [testOrderId]);
    await db.query('DELETE FROM orders WHERE id = ?', [testOrderId]);
    console.log('\nCleaned up temporary test order.');

    console.log('\n====================================================');
    console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
    console.log('====================================================');

    if (passedTests === totalTests) {
      console.log('🎉 ALL BACKEND BUY AGAIN TESTS PASSED PERFECTLY!\n');
    } else {
      console.error('❌ SOME TESTS FAILED!\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('Fatal error during test run:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTests();
