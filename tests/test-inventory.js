const db = require('../backend/config/db');
const cartValidationService = require('../backend/services/cartValidationService');
const orderService = require('../backend/services/orderService');

async function runTests() {
  console.log('--- Starting Verification & Testing ---\n');
  
  // Test 1: Cart Bounds Validation
  console.log('[Test 1] Cart Stock Bounds Validation');
  try {
    // We need a valid variant ID from the DB that has some stock
    const [variants] = await db.query('SELECT v.id, v.product_id, i.quantity FROM product_variants v JOIN inventory i ON v.id = i.variant_id WHERE i.quantity > 0 LIMIT 1');
    if (variants.length > 0) {
      const v = variants[0];
      const items = [{
        productId: v.product_id,
        variantId: v.id,
        quantity: v.quantity + 10 // Try to order more than available
      }];
      
      const validation = await cartValidationService.validateCartItems(items);
      if (validation.issues.length > 0 && validation.issues[0].code === 'INSUFFICIENT_STOCK') {
        console.log('✅ PASS: Cart correctly rejected out-of-bounds quantity');
        console.log(`   Expected quantity: ${v.quantity}, Validated cart adjusted to: ${validation.items[0].quantity}`);
      } else {
        console.log('❌ FAIL: Cart did not properly handle out-of-bounds quantity', validation);
      }
    } else {
      console.log('⚠️ SKIP: No variants with stock > 0 found in DB for testing');
    }
  } catch (error) {
    console.error('❌ FAIL: Error in Cart Validation test', error);
  }

  // Test 2: Order DB Transaction logic
  console.log('\n[Test 2] DB Transaction / Order Stock Deduction');
  try {
    const [variants] = await db.query('SELECT v.id, v.product_id, i.quantity FROM product_variants v JOIN inventory i ON v.id = i.variant_id WHERE i.quantity > 0 LIMIT 1');
    if (variants.length > 0) {
      const v = variants[0];
      const initialStock = v.quantity;
      
      const items = [{
        productId: v.product_id,
        variantId: v.id,
        productName: 'Test Product',
        variantName: 'Test Variant',
        sku: 'TEST-123',
        quantity: 1,
        price: 100
      }];
      
      const orderData = {
        guestFirstName: 'Test',
        guestLastName: 'User',
        guestEmail: 'test@example.com',
        subtotal: 100,
        grandTotal: 100,
        deliveryMethod: 'pickup'
      };
      
      const order = await orderService.createOrder(orderData, items);
      
      const [postInv] = await db.query('SELECT quantity FROM inventory WHERE variant_id = ?', [v.id]);
      const [txs] = await db.query('SELECT * FROM inventory_transactions WHERE reference_id = ?', [order.orderNumber]);
      
      if (postInv[0].quantity === initialStock - 1 && txs.length === 1 && txs[0].type === 'sale') {
        console.log('✅ PASS: Order successfully deducted stock and created a transaction log');
      } else {
        console.log('❌ FAIL: Order stock deduction did not work as expected');
      }
    } else {
      console.log('⚠️ SKIP: No variants found in DB for testing');
    }
  } catch (error) {
    console.error('❌ FAIL: Error in Order Transaction test', error);
  }

  console.log('\n--- Testing Complete ---');
  process.exit(0);
}

runTests();
