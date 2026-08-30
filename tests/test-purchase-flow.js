const jwt = require('../backend/node_modules/jsonwebtoken');
const db = require('../backend/config/db');

async function testPurchaseFlow() {
  console.log('🧪 Testing Digital Gift Card Purchase API Flow...\n');

  // 1. Get test customer
  const [users] = await db.query('SELECT * FROM users WHERE role = "customer" LIMIT 1');
  const user = users[0];
  console.log(`👤 Customer: ${user.first_name} ${user.last_name} (${user.email}, ID: ${user.id})`);

  // Generate JWT token for API auth
  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'premium_icecream_secret_key_change_me',
    { expiresIn: '1h' }
  );

  // 2. Call POST /api/gift-cards/purchase
  const purchasePayload = {
    amount: 500,
    recipientEmail: 'mohit@gmail.com',
    recipientName: 'Mohit',
    senderName: `${user.first_name} ${user.last_name}`,
    personalMessage: 'Enjoy delicious artisanal ice cream!'
  };

  console.log('📤 Sending purchase request (₹500)...');
  const response = await fetch('http://localhost:5000/api/gift-cards/purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`
    },
    body: JSON.stringify(purchasePayload)
  });

  const data = await response.json();
  console.log(`📥 API Response Status: ${response.status}`, data);

  if (!data.success) {
    throw new Error(`Purchase failed: ${JSON.stringify(data)}`);
  }

  const { orderId, orderNumber, amount, giftCard } = data.data;
  console.log(`\n✅ Purchase order created: Order #${orderNumber} (ID: ${orderId}), Amount: ₹${amount}`);
  console.log(`✅ Pending Gift Card created: Code: ${giftCard.code}, ID: ${giftCard.id}`);

  // 3. Verify order in DB
  const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  console.log(`✅ DB Order verified: total_amount=₹${orders[0].total_amount}, payment_status=${orders[0].payment_status}`);

  // 4. Process payment for this order
  console.log('\n💳 Processing payment for order...');
  const payResponse = await fetch('http://localhost:5000/api/payments/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`
    },
    body: JSON.stringify({
      orderNumber,
      paymentMethod: 'upi'
    })
  });

  const payData = await payResponse.json();
  console.log(`📥 Payment API Response:`, payData);

  if (!payData.success) {
    throw new Error(`Payment processing failed: ${JSON.stringify(payData)}`);
  }

  // 5. Verify Gift Card is now ACTIVE in DB with ₹500 balance
  const [cards] = await db.query('SELECT * FROM gift_cards WHERE id = ?', [giftCard.id]);
  console.log(`\n✅ DB Gift Card status: ${cards[0].status}, Current Balance: ₹${cards[0].current_balance}, Code: ${cards[0].code}`);
  if (cards[0].status !== 'active' || parseFloat(cards[0].current_balance) !== 500) {
    throw new Error(`Gift card should be active with ₹500 balance! Got status=${cards[0].status}, balance=${cards[0].current_balance}`);
  }

  // 6. Verify Transaction Ledger
  const [txns] = await db.query('SELECT * FROM gift_card_transactions WHERE gift_card_id = ?', [giftCard.id]);
  console.log(`✅ DB Ledger entries: ${txns.length}`);
  txns.forEach((t, i) => {
    console.log(`   [${i+1}] Type: ${t.type.toUpperCase()}, Amount: ₹${t.amount}, Balance After: ₹${t.balance_after}, Desc: ${t.description}`);
  });

  console.log('\n🎉 GIFT CARD PURCHASE END-TO-END VERIFICATION SUCCEEDED! 🚀\n');
  process.exit(0);
}

testPurchaseFlow().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
