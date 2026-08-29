// Test address parsing and normalization across all scenarios

function parseAddress(address) {
  if (!address) return null;

  let parsed = address;
  if (typeof address === 'string') {
    const trimmed = address.trim();
    if (!trimmed) return null;
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      return {
        fullName: '',
        phone: '',
        addressLine1: trimmed,
        addressLine2: '',
        landmark: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      };
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const fullName = (parsed.fullName || parsed.full_name || parsed.name || parsed.recipientName || parsed.giftRecipientName || '').trim();
  const phone = (parsed.phone || parsed.phoneNumber || parsed.phone_number || parsed.recipientPhone || '').trim();
  const addressLine1 = (parsed.addressLine1 || parsed.address_line_1 || parsed.address || parsed.street || '').trim();
  const addressLine2 = (parsed.addressLine2 || parsed.address_line_2 || '').trim();
  const landmark = (parsed.landmark || '').trim();
  const city = (parsed.city || '').trim();
  const state = (parsed.state || '').trim();
  const postalCode = (parsed.postalCode || parsed.postal_code || parsed.pincode || parsed.zip || '').trim();
  const country = (parsed.country || '').trim();

  return {
    fullName,
    phone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    postalCode,
    country
  };
}

function hasValidAddress(parsed) {
  if (!parsed) return false;
  return Boolean(
    parsed.addressLine1 ||
    parsed.addressLine2 ||
    parsed.city ||
    parsed.state ||
    parsed.postalCode ||
    parsed.fullName
  );
}

function formatCityStatePostal(parsed) {
  const locationParts = [];
  if (parsed.city) locationParts.push(parsed.city);
  if (parsed.state) locationParts.push(parsed.state);
  const cityState = locationParts.join(', ');
  return [cityState, parsed.postalCode].filter(Boolean).join(' — ');
}

console.log('🧪 Testing Address Normalization & Rendering Logic...\n');

// 1. JSON String format (as stored in database)
const jsonString = '{"fullName":"Ananya Deshmukh","phone":"9811198111","addressLine1":"Bungalow 7, Juhu Tara Road","city":"Mumbai","state":"Maharashtra","postalCode":"400049"}';
const p1 = parseAddress(jsonString);
console.log('Test 1 (JSON String):');
console.log('  Name:', p1.fullName);
console.log('  Phone:', p1.phone);
console.log('  Address:', p1.addressLine1);
console.log('  City/State/PIN:', formatCityStatePostal(p1));
if (p1.fullName === 'Ananya Deshmukh' && formatCityStatePostal(p1) === 'Mumbai, Maharashtra — 400049') {
  console.log('  ✅ PASS: JSON String parsed properly\n');
} else {
  console.error('  ❌ FAIL');
  process.exit(1);
}

// 2. snake_case Object format
const snakeObj = { full_name: 'Rahul Verma', phone: '9988776655', address_line_1: 'Apt 101, Palm Heights', city: 'Delhi', state: 'Delhi', postal_code: '110001' };
const p2 = parseAddress(snakeObj);
console.log('Test 2 (snake_case Object):');
console.log('  Name:', p2.fullName);
console.log('  Address:', p2.addressLine1);
console.log('  City/State/PIN:', formatCityStatePostal(p2));
if (p2.fullName === 'Rahul Verma' && p2.postalCode === '110001') {
  console.log('  ✅ PASS: snake_case normalized properly\n');
} else {
  console.error('  ❌ FAIL');
  process.exit(1);
}

// 3. Corrupted / Non-JSON String fallback
const corrupt = 'Plain text address line without JSON formatting';
const p3 = parseAddress(corrupt);
console.log('Test 3 (Plain string):');
console.log('  AddressLine1:', p3.addressLine1);
if (p3.addressLine1 === corrupt) {
  console.log('  ✅ PASS: Plain string gracefully preserved without crashing\n');
} else {
  console.error('  ❌ FAIL');
  process.exit(1);
}

// 4. Null / Empty
const p4 = parseAddress(null);
const valid4 = hasValidAddress(p4);
console.log('Test 4 (Null Address):');
if (!valid4) {
  console.log('  ✅ PASS: Null address returns hasValidAddress = false (triggers "Address information unavailable")\n');
} else {
  console.error('  ❌ FAIL');
  process.exit(1);
}

console.log('🎉 All Address Rendering Tests Passed!');
