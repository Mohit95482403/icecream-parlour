async function testE2E() {
  console.log('================================================================');
  console.log('  END-TO-END VERIFICATION: ORDER #ICE-20260827-7617 BUY AGAIN');
  console.log('================================================================\n');

  const baseURL = 'http://localhost:5000/api';

  try {
    // 1. Login as Harshal Patil (user_id 8)
    console.log('1. Logging in as harshal@gmail.com...');
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'harshal@gmail.com',
        password: 'Password@123'
      })
    });

    const loginData = await loginRes.json();
    const token = loginData?.data?.token;
    console.log('✅ Login successful. Customer ID:', loginData?.data?.customer?.id);

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Fetch Order History
    console.log('\n2. Fetching Customer Order History...');
    const ordersRes = await fetch(`${baseURL}/orders`, { headers: authHeaders });
    const ordersData = await ordersRes.json();
    const orders = ordersData?.data?.orders || [];
    console.log(`Found ${orders.length} order(s) for customer.`);

    const targetOrder = orders.find(o => o.order_number === 'ICE-20260827-7617');
    if (!targetOrder) {
      throw new Error('Order ICE-20260827-7617 not found in customer order list');
    }
    console.log('✅ Target Order Found:');
    console.log('   Order Number:', targetOrder.order_number);
    console.log('   Order Status:', targetOrder.order_status);
    console.log('   Payment Status:', targetOrder.payment_status);
    console.log('   Total Amount:', targetOrder.total_amount);

    // 3. Trigger Buy Again for Order ICE-20260827-7617
    console.log('\n3. Triggering POST /api/orders/ICE-20260827-7617/buy-again...');
    const buyAgainRes = await fetch(`${baseURL}/orders/ICE-20260827-7617/buy-again`, {
      method: 'POST',
      headers: authHeaders
    });
    const buyAgainData = await buyAgainRes.json();
    console.log('✅ Buy Again Response:');
    console.log('   Success:', buyAgainData.success);
    console.log('   Message:', buyAgainData.data?.message);
    console.log('   Total Added Count:', buyAgainData.data?.totalAddedCount);
    console.log('   Items added:', JSON.stringify(buyAgainData.data?.items, null, 2));

    const addedItem = buyAgainData.data?.items?.[0];
    if (addedItem && addedItem.name === 'Neapolitan ice cream' && addedItem.quantity === 5 && addedItem.price === 245) {
      console.log('✅ PASS: Neapolitan ice cream correctly resolved with 5 units @ ₹245.00');
    } else {
      throw new Error('Item data does not match expected output');
    }

    // 4. Validate cart with server cartValidationService
    console.log('\n4. Validating authoritative cart with /api/checkout/cart/validate...');
    const cartItems = [
      {
        productId: addedItem.productId,
        variantId: addedItem.variantId,
        quantity: addedItem.quantity,
        clientPrice: addedItem.price
      }
    ];

    const validateRes = await fetch(`${baseURL}/checkout/cart/validate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ items: cartItems })
    });
    const validateData = await validateRes.json();
    console.log('✅ Cart Validation Result:');
    console.log('   Subtotal:', validateData.data?.subtotal);
    console.log('   Currency:', validateData.data?.currency);
    console.log('   Issues:', validateData.data?.issues?.length === 0 ? 'None (Cart is 100% valid)' : validateData.data?.issues);

    if (validateData.data?.subtotal === 1225 && validateData.data?.issues?.length === 0) {
      console.log('\n🎉 ALL CHECKS PASSED: Order #ICE-20260827-7617 Buy Again is fully operational and valid!');
    } else {
      throw new Error('Cart validation subtotal or issues mismatch');
    }

  } catch (error) {
    console.error('❌ E2E Verification Failed:', error.message);
    process.exit(1);
  }
}

testE2E();
