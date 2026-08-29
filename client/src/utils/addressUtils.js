/**
 * Safely parse and normalize an address object from various formats (JSON string, snake_case, camelCase, etc.)
 */
export const parseAddress = (address) => {
  if (!address) return null;

  let parsed = address;
  if (typeof address === 'string') {
    const trimmed = address.trim();
    if (!trimmed) return null;
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      // If it's a plain string address rather than JSON
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
};

export const hasValidAddress = (parsed) => {
  if (!parsed) return false;
  return Boolean(
    parsed.addressLine1 ||
    parsed.addressLine2 ||
    parsed.city ||
    parsed.state ||
    parsed.postalCode ||
    parsed.fullName
  );
};
