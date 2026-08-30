import React from 'react';
import { parseAddress, hasValidAddress } from '../../utils/addressUtils';

const DeliveryAddress = ({ address, className = '', fallbackText = 'Address information unavailable' }) => {
  const parsed = parseAddress(address);

  if (!hasValidAddress(parsed)) {
    return <p className={`text-sm text-gray-500 italic ${className}`}>{fallbackText}</p>;
  }

  // Combine city, state, postal code nicely: e.g. "Mumbai, Maharashtra — 400049"
  const locationParts = [];
  if (parsed.city) locationParts.push(parsed.city);
  if (parsed.state) locationParts.push(parsed.state);
  const cityState = locationParts.join(', ');
  const cityStatePostal = [cityState, parsed.postalCode].filter(Boolean).join(' — ');

  return (
    <div className={`space-y-1.5 text-sm break-words leading-relaxed ${className}`}>
      {/* Full Name */}
      {parsed.fullName && (
        <p className="font-semibold text-gray-900">{parsed.fullName}</p>
      )}

      {/* Phone */}
      {parsed.phone && (
        <p className="text-gray-500 text-xs font-mono">{parsed.phone}</p>
      )}

      {/* Street Address Lines */}
      <div className="pt-0.5 space-y-0.5 text-gray-800">
        {parsed.addressLine1 && <p>{parsed.addressLine1}</p>}
        {parsed.addressLine2 && <p>{parsed.addressLine2}</p>}
        {parsed.landmark && (
          <p className="text-gray-500 text-xs italic">Landmark: {parsed.landmark}</p>
        )}
      </div>

      {/* City, State — Postal Code */}
      {cityStatePostal && (
        <p className="text-gray-700 font-medium">{cityStatePostal}</p>
      )}

      {/* Country (only if not India or specifically passed) */}
      {parsed.country && parsed.country.toLowerCase() !== 'india' && (
        <p className="text-gray-500 text-xs">{parsed.country}</p>
      )}
    </div>
  );
};

export default DeliveryAddress;
