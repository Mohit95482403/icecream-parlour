const jwt = require('./server/node_modules/jsonwebtoken');
const db = require('./server/config/db');

async function testAllPurchaseCases() {
  console.log('🧪 Running Comprehensive Gift Card Purchase Test Suite...\n');

  const [users] = await db.query('SELECT * FROM users WHERE role = "customer" LIMIT 1');
  const user = users[0];

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'premium_icecream_secret_key_change_me',
    { expiresIn: '1h' }
  );

  const makePurchaseReq = async (payload) => {
    const res = await fetch('http://localhost:5000/api/gift-cards/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  // TEST 1: ₹500 Purchase
  console.log('--- TEST 1: ₹500 Gift Card Purchase ---');
  const t1 = await makePurchaseReq({
    amount: 500,
    recipientEmail: 'mohit@gmail.com',
    recipientName: 'Mohit',
    senderName: 'Mohit S',
    personalMessage: 'Enjoy ₹500 scoop!'
  });
  console.log(`✅ Status: ${t1.status}, Code: ${t1.data.data?.giftCard?.code}, Amount: ₹${t1.data.data?.amount}`);
  if (t1.status !== 201) throw new Error('Test 1 failed');

  // TEST 2: ₹1000 Purchase
  console.log('\n--- TEST 2: ₹1000 Gift Card Purchase ---');
  const t2 = await makePurchaseReq({
    amount: 1000,
    recipientEmail: 'friend@gmail.com',
    recipientName: 'Friend',
    senderName: 'Mohit',
    personalMessage: 'Sweet treats for you!'
  });
  console.log(`✅ Status: ${t2.status}, Code: ${t2.data.data?.giftCard?.code}, Amount: ₹${t2.data.data?.amount}`);
  if (t2.status !== 201) throw new Error('Test 2 failed');

  // TEST 3: ₹2000 Purchase
  console.log('\n--- TEST 3: ₹2000 Gift Card Purchase ---');
  const t3 = await makePurchaseReq({
    amount: 2000,
    recipientEmail: 'vip@gmail.com',
    recipientName: 'VIP Customer',
    senderName: 'Mohit',
    personalMessage: 'Celebration box!'
  });
  console.log(`✅ Status: ${t3.status}, Code: ${t3.data.data?.giftCard?.code}, Amount: ₹${t3.data.data?.amount}`);
  if (t3.status !== 201) throw new Error('Test 3 failed');

  // TEST 4: Invalid Email
  console.log('\n--- TEST 4: Invalid Recipient Email Validation ---');
  const t4 = await makePurchaseReq({
    amount: 500,
    recipientEmail: 'not-an-email',
    recipientName: 'Tester'
  });
  console.log(`✅ Caught invalid email: Status ${t4.status}, Message: "${t4.data?.error?.message}"`);
  if (t4.status === 201) throw new Error('Test 4 failed: Should reject invalid email');

  // TEST 5: Invalid Denomination
  console.log('\n--- TEST 5: Invalid Denomination Validation ---');
  const t5 = await makePurchaseReq({
    amount: 333,
    recipientEmail: 'valid@example.com',
    recipientName: 'Tester'
  });
  console.log(`✅ Caught invalid denomination: Status ${t5.status}, Message: "${t5.data?.error?.message}"`);
  if (t5.status === 201) throw new Error('Test 5 failed: Should reject unapproved amount');

  // TEST 6: Atomic Payment Activation
  console.log('\n--- TEST 6: Payment Activation & Lifecycle ---');
  const cardId = t1.data.data.giftCard.id;
  const orderNum = t1.data.data.orderNumber;

  // Before payment: card is pending
  const [beforePay] = await db.query('SELECT status, current_balance FROM gift_cards WHERE id = ?', [cardId]);
  console.log(`✅ Pre-payment Status: ${beforePay[0].status} (Expected: pending)`);
  if (beforePay[0].status !== 'pending') throw new Error('Card should be pending before payment');

  // Pay order
  const payRes = await fetch('http://localhost:5000/api/payments/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': `token=${token}` },
    body: JSON.stringify({ orderNumber: orderNum, paymentMethod: 'upi' })
  });
  const payData = await payRes.json();
  console.log(`✅ Payment result: ${payData.data?.status}`);

  // After payment: card is active
  const [afterPay] = await db.query('SELECT status, current_balance, expires_at FROM gift_cards WHERE id = ?', [cardId]);
  console.log(`✅ Post-payment Status: ${afterPay[0].status} (Expected: active), Balance: ₹${afterPay[0].current_balance}`);
  if (afterPay[0].status !== 'active') throw new Error('Card should be active after payment');

  console.log('\n🎉 ALL PURCHASE TEST SUITES PASSED FLAWLESSLY! 🚀\n');
  await db.end();
  process.exit(0);
}

testAllPurchaseCases().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
