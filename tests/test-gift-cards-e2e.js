const db = require('../backend/config/db');
const giftCardService = require('../backend/services/giftCardService');
const orderService = require('../backend/services/orderService');
const paymentService = require('../backend/services/paymentService');
const cancellationService = require('../backend/services/cancellationService');
const refundService = require('../backend/services/refundService');

async function runE2ETests() {
  console.log('🧪 Starting Gift Card System Comprehensive E2E Verification...\n');

  // 1. Fetch a test user
  const [users] = await db.query('SELECT id, email, first_name FROM users WHERE role = "customer" LIMIT 1');
  if (users.length === 0) {
    throw new Error('No customer user found for test');
  }
  const testUser = users[0];
  console.log(`👤 Using test customer: ${testUser.first_name} (${testUser.email}, ID: ${testUser.id})`);

  const [admins] = await db.query('SELECT id, email FROM users WHERE role = "admin" LIMIT 1');
  const testAdmin = admins.length > 0 ? admins[0] : { id: 1 };
  console.log(`🛡️ Using test admin ID: ${testAdmin.id}\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Admin Direct Issuance & Ledger Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 1: Admin Direct Issuance ---');
  const issuedCard = await giftCardService.adminIssueGiftCard({
    amount: 1000,
    recipientEmail: testUser.email,
    recipientName: testUser.first_name,
    senderName: 'GLACÉ Concierge',
    personalMessage: 'VIP Reward',
    adminId: testAdmin.id
  });

  console.log(`✅ Gift card issued: Code=${issuedCard.code}, Amount=₹${issuedCard.initialAmount}, Status=${issuedCard.status}`);
  if (issuedCard.status !== 'active' || issuedCard.currentBalance !== 1000) {
    throw new Error('Test 1 Failed: Card should be active with 1000 balance');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Customer Claims / Redeems Card to Account
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 2: Customer Wallet Claim ---');
  const claimed = await giftCardService.redeemToAccount(issuedCard.code, testUser.id);
  console.log(`✅ Claimed to customer account: Current Balance=₹${claimed.currentBalance}, isAlreadyBound=${claimed.isAlreadyBound}`);

  const userCards = await giftCardService.getCustomerGiftCards(testUser.id);
  const found = userCards.find(c => c.code === issuedCard.code);
  if (!found || found.currentBalance !== 1000) {
    throw new Error('Test 2 Failed: Card not found in customer wallet');
  }
  console.log(`✅ Verified customer wallet now contains card ${issuedCard.code}`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Checkout Validation & Atomic Debit on Order
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 3: Checkout Partial Redemption & Atomic Debit ---');
  // Get an available product variant
  const [variants] = await db.query(`
    SELECT pv.id as variant_id, pv.product_id, pv.price, pv.name as variant_name, pv.sku, p.name as product_name, inv.quantity
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    JOIN inventory inv ON pv.id = inv.variant_id
    WHERE inv.quantity > 5 AND pv.status = 'active'
    LIMIT 1
  `);
  if (variants.length === 0) {
    throw new Error('No in-stock variant found for order test');
  }
  const variant = variants[0];

  // Validate for checkout
  const validated = await giftCardService.validateForCheckout(issuedCard.code, testUser.id);
  console.log(`✅ Checkout validation succeeded for ${validated.code}, available: ₹${validated.currentBalance}`);

  // Prepare order data with ₹400 gift card deduction
  const orderSubtotal = parseFloat(variant.price);
  const giftCardDeduction = Math.min(400, orderSubtotal);
  const grandTotal = Math.max(0, orderSubtotal - giftCardDeduction);

  const orderData = {
    userId: testUser.id,
    guestFirstName: testUser.first_name,
    guestLastName: 'Tester',
    guestEmail: testUser.email,
    guestPhone: '9876543210',
    deliveryMethod: 'delivery',
    deliveryAddress: { postalCode: '400001', addressLine1: 'Test St' },
    subtotal: orderSubtotal,
    discountAmount: 0,
    giftCardAmount: giftCardDeduction,
    giftCardId: issuedCard.id,
    deliveryFee: 0,
    taxAmount: 0,
    grandTotal: grandTotal,
    notes: 'Gift card test order'
  };

  const orderItems = [{
    productId: variant.product_id,
    variantId: variant.variant_id,
    productName: variant.product_name,
    variantName: variant.variant_name || 'Standard',
    sku: variant.sku,
    quantity: 1,
    price: parseFloat(variant.price)
  }];

  const createdOrder = await orderService.createOrder(orderData, orderItems);
  console.log(`✅ Order placed: #${createdOrder.orderNumber}, GrandTotal=₹${createdOrder.grandTotal}, GiftCardAmount=₹${createdOrder.giftCardAmount}`);

  // Verify card balance after order
  const [updatedCards] = await db.query('SELECT current_balance, status FROM gift_cards WHERE id = ?', [issuedCard.id]);
  const expectedBalance = 1000 - giftCardDeduction;
  console.log(`✅ Post-order gift card balance: ₹${updatedCards[0].current_balance} (Expected ₹${expectedBalance})`);
  if (parseFloat(updatedCards[0].current_balance) !== expectedBalance) {
    throw new Error(`Test 3 Failed: Balance mismatch! Got ${updatedCards[0].current_balance}, expected ${expectedBalance}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Cancellation & Automatic Balance Restoration
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 4: Cancellation & Balance Restoration ---');
  
  // Refund / cancel the order using refundService
  await refundService.processRefund({
    orderId: createdOrder.id,
    adminId: testAdmin.id,
    reason: 'Test cancellation and gift card restoration'
  });
  console.log(`✅ Order #${createdOrder.orderNumber} refund processed and cancelled.`);

  // Verify balance restored to 1000
  const [restoredCards] = await db.query('SELECT current_balance, status FROM gift_cards WHERE id = ?', [issuedCard.id]);
  console.log(`✅ Post-cancellation gift card balance: ₹${restoredCards[0].current_balance} (Expected 1000.00)`);
  if (parseFloat(restoredCards[0].current_balance) !== 1000) {
    throw new Error(`Test 4 Failed: Balance not restored! Got ${restoredCards[0].current_balance}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Admin Balance Adjustment & Audit Trail
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 5: Admin Balance Adjustment & Audit Trail ---');
  const adjusted = await giftCardService.adminAdjustBalance(issuedCard.id, -250, 'Adjustment test deduction', testAdmin.id);
  console.log(`✅ Admin adjusted balance: NewBalance=₹${adjusted.newBalance}`);
  if (adjusted.newBalance !== 750) {
    throw new Error(`Test 5 Failed: Expected 750, got ${adjusted.newBalance}`);
  }

  // Verify transactions ledger
  const cardDetails = await giftCardService.adminGetGiftCard(issuedCard.id);
  console.log(`✅ Audit ledger entries count: ${cardDetails.transactions.length}`);
  cardDetails.transactions.forEach((tx, i) => {
    console.log(`   [${i+1}] Type: ${tx.type.toUpperCase()}, Amount: ₹${tx.amount}, Balance After: ₹${tx.balanceAfter}, Desc: ${tx.description}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Purchase Flow -> Pending -> Payment Activation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 6: Digital Purchase & Payment Activation ---');
  const purchasedCard = await giftCardService.createGiftCard({
    initialAmount: 500,
    purchasedBy: testUser.id,
    recipientEmail: 'friend@example.com',
    recipientName: 'Best Friend'
  });
  console.log(`✅ Digital gift card created: Status=${purchasedCard.status} (should be pending)`);
  if (purchasedCard.status !== 'pending') {
    throw new Error('Test 6 Failed: Newly purchased gift card must be pending before payment');
  }

  const activated = await giftCardService.activateGiftCard(purchasedCard.id);
  console.log(`✅ Post-payment activation: Status=${activated.status}, ExpiresAt=${activated.expires_at}`);
  if (activated.status !== 'active') {
    throw new Error('Test 6 Failed: Card should be active after payment');
  }

  console.log('\n🎉 ALL 6 E2E INTEGRATION TESTS PASSED SUCCESSFULLY! 🚀\n');
  process.exit(0);
}

runE2ETests().catch(err => {
  console.error('\n❌ E2E Tests Failed with error:', err);
  process.exit(1);
});
