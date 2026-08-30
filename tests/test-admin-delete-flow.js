const jwt = require('../backend/node_modules/jsonwebtoken');
const db = require('../backend/config/db');

async function testAdminDeleteFlow() {
  console.log('🧪 Starting Admin Gift Card Delete & Customer Integrity Verification...\n');

  // 1. Get test customer and admin
  const [customers] = await db.query('SELECT * FROM users WHERE role = "customer" LIMIT 1');
  const [admins] = await db.query('SELECT * FROM users WHERE role = "admin" LIMIT 1');

  const customer = customers[0];
  const admin = admins[0];

  console.log(`👤 Customer: ${customer.first_name} (${customer.email}, ID: ${customer.id})`);
  console.log(`🛡️ Admin: ${admin.first_name || 'Admin'} (${admin.email}, ID: ${admin.id})\n`);

  const customerToken = jwt.sign(
    { sub: customer.id, role: customer.role, email: customer.email },
    process.env.JWT_SECRET || 'premium_icecream_secret_key_change_me',
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { sub: admin.id, role: admin.role, email: admin.email },
    process.env.JWT_SECRET || 'premium_icecream_secret_key_change_me',
    { expiresIn: '1h' }
  );

  // ── STEP 1: Admin Issues a Gift Card ───────────────────────────────────────
  console.log('--- STEP 1: Admin Issues a Gift Card ---');
  const issueRes = await fetch('http://localhost:5000/api/admin/gift-cards/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': `token=${adminToken}` },
    body: JSON.stringify({
      amount: 1000,
      recipientEmail: customer.email,
      recipientName: customer.first_name,
      senderName: 'GLACÉ Concierge',
      personalMessage: 'Special reward'
    })
  });
  const issueData = await issueRes.json();
  console.log(`✅ Issue Response: Status ${issueRes.status}, Code: ${issueData.data?.code}, Balance: ₹${issueData.data?.currentBalance}`);
  if (!issueData.success) throw new Error('Failed to issue test gift card');

  const testCard = issueData.data;

  // ── STEP 2: Customer Claims Card into Wallet ──────────────────────────────
  console.log('\n--- STEP 2: Customer Claims Card to Wallet ---');
  const claimRes = await fetch('http://localhost:5000/api/gift-cards/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': `token=${customerToken}` },
    body: JSON.stringify({ code: testCard.code })
  });
  const claimData = await claimRes.json();
  console.log(`✅ Claim Response: Status ${claimRes.status}, Balance: ₹${claimData.data?.currentBalance}`);

  // Customer fetches my-cards
  const myCardsBefore = await fetch('http://localhost:5000/api/gift-cards/my-cards', {
    headers: { 'Cookie': `token=${customerToken}` }
  });
  const myCardsBeforeData = await myCardsBefore.json();
  const foundBefore = myCardsBeforeData.data?.cards?.some(c => c.code === testCard.code);
  console.log(`✅ Customer wallet shows card before delete: ${foundBefore} (Total balance: ₹${myCardsBeforeData.data?.totalBalance})`);
  if (!foundBefore) throw new Error('Card should be in customer wallet before delete');

  // ── STEP 3: Non-Admin Attempts to Delete (Security Check) ─────────────────
  console.log('\n--- STEP 3: Non-Admin Customer Attempts to Delete Card (Security Check) ---');
  const unauthorizedDelete = await fetch(`http://localhost:5000/api/admin/gift-cards/${testCard.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': `token=${customerToken}` }
  });
  console.log(`✅ Unauthorized Delete Attempt: Status ${unauthorizedDelete.status} (Expected 403)`);
  if (unauthorizedDelete.status !== 403) {
    throw new Error(`Security Failure: Customer was not blocked with 403. Got ${unauthorizedDelete.status}`);
  }

  // ── STEP 4: Admin Deletes the Gift Card ───────────────────────────────────
  console.log('\n--- STEP 4: Admin Deletes the Gift Card ---');
  const adminDeleteRes = await fetch(`http://localhost:5000/api/admin/gift-cards/${testCard.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Cookie': `token=${adminToken}` },
    body: JSON.stringify({ reason: 'Admin revoked fraudulent promo code' })
  });
  const adminDeleteData = await adminDeleteRes.json();
  console.log(`✅ Admin Delete Response: Status ${adminDeleteRes.status}`, adminDeleteData);
  if (!adminDeleteData.success) throw new Error('Admin delete request failed');

  // ── STEP 5: Customer Wallet Integrity Check ───────────────────────────────
  console.log('\n--- STEP 5: Customer Wallet Integrity Check (Backend Enforced) ---');
  const myCardsAfter = await fetch('http://localhost:5000/api/gift-cards/my-cards', {
    headers: { 'Cookie': `token=${customerToken}` }
  });
  const myCardsAfterData = await myCardsAfter.json();
  const foundAfter = myCardsAfterData.data?.cards?.some(c => c.code === testCard.code);
  console.log(`✅ Customer wallet shows card after delete: ${foundAfter} (Expected: false)`);
  if (foundAfter) throw new Error('CRITICAL FAILURE: Deleted card is still present in customer wallet!');

  // ── STEP 6: Direct Redemption Blocked ─────────────────────────────────────
  console.log('\n--- STEP 6: Direct Customer Redemption Blocked ---');
  const redeemAfter = await fetch('http://localhost:5000/api/gift-cards/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': `token=${customerToken}` },
    body: JSON.stringify({ code: testCard.code })
  });
  const redeemAfterData = await redeemAfter.json();
  console.log(`✅ Redemption attempt rejected: Status ${redeemAfter.status}, Message: "${redeemAfterData.error?.message}"`);
  if (redeemAfter.status === 200 && redeemAfterData.success) {
    throw new Error('CRITICAL FAILURE: Customer was able to redeem a deleted gift card!');
  }

  // ── STEP 7: Checkout Validation Blocked ───────────────────────────────────
  console.log('\n--- STEP 7: Checkout Validation Blocked ---');
  const checkoutValidate = await fetch('http://localhost:5000/api/gift-cards/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': `token=${customerToken}` },
    body: JSON.stringify({ code: testCard.code })
  });
  const checkoutValidateData = await checkoutValidate.json();
  console.log(`✅ Checkout validate rejected: Status ${checkoutValidate.status}, Message: "${checkoutValidateData.error?.message}"`);
  if (checkoutValidate.status === 200 && checkoutValidateData.success) {
    throw new Error('CRITICAL FAILURE: Customer was able to apply deleted card in checkout!');
  }

  // ── STEP 8: Admin Ledger Audit Intact ─────────────────────────────────────
  console.log('\n--- STEP 8: Admin Ledger Audit History Intact ---');
  const ledgerRes = await fetch(`http://localhost:5000/api/admin/gift-cards/${testCard.id}`, {
    headers: { 'Cookie': `token=${adminToken}` }
  });
  const ledgerData = await ledgerRes.json();
  console.log(`✅ Card Status in DB: ${ledgerData.data?.card?.status}, Current Balance: ₹${ledgerData.data?.card?.currentBalance}`);
  console.log(`✅ Ledger Entries Count: ${ledgerData.data?.transactions?.length}`);
  ledgerData.data?.transactions?.forEach((t, i) => {
    console.log(`   [${i+1}] Type: ${t.type.toUpperCase()}, Amount: ₹${t.amount}, Balance After: ₹${t.balanceAfter}, Desc: ${t.description}`);
  });

  // ── STEP 9: Admin List Query Hides Cancelled by Default ────────────────────
  console.log('\n--- STEP 9: Admin List Query Excludes Deleted Cards by Default ---');
  const adminListRes = await fetch('http://localhost:5000/api/admin/gift-cards', {
    headers: { 'Cookie': `token=${adminToken}` }
  });
  const adminListData = await adminListRes.json();
  const inAdminNormalList = adminListData.data?.cards?.some(c => c.id === testCard.id);
  console.log(`✅ Deleted card in default Admin list: ${inAdminNormalList} (Expected: false)`);
  if (inAdminNormalList) throw new Error('Deleted card should be hidden from normal admin list');

  console.log('\n🎉 ALL ADMIN DELETE & INTEGRITY TESTS PASSED 100% SUCCESSFULLY! 🚀\n');
  await db.end();
  process.exit(0);
}

testAdminDeleteFlow().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
