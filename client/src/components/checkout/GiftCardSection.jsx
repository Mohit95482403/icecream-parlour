import React, { useState } from 'react';
import { Gift, Check, X, Loader2 } from 'lucide-react';

const GiftCardSection = ({
  appliedGiftCard,
  giftCardCode,
  setGiftCardCode,
  handleApplyGiftCard,
  removeGiftCard,
  giftCardLoading,
  giftCardError,
  currentPayableAmount = 0
}) => {
  const [localCode, setLocalCode] = useState(giftCardCode || '');

  const onSubmit = (e) => {
    e.preventDefault();
    if (!localCode.trim()) return;
    setGiftCardCode(localCode.trim());
    handleApplyGiftCard(localCode.trim());
  };

  return (
    <div className="p-5 bg-white border border-sand-dark rounded-xl shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-espresso/5 flex items-center justify-center text-espresso">
            <Gift size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-charcoal text-sm">Have a Glacé Gift Card?</h3>
            <p className="text-xs text-charcoal-light">Apply stored balance towards your order</p>
          </div>
        </div>
      </div>

      {appliedGiftCard ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Check size={12} strokeWidth={3} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-emerald-900 tracking-wider">
                  {appliedGiftCard.code}
                </span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                  Applied: ₹{appliedGiftCard.deduction.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Remaining card balance: ₹{(appliedGiftCard.balance - appliedGiftCard.deduction).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              removeGiftCard();
              setLocalCode('');
            }}
            className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-md transition-colors"
            title="Remove Gift Card"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="text"
            value={localCode}
            onChange={(e) => setLocalCode(e.target.value.toUpperCase())}
            placeholder="GC-XXXX-XXXX-XXXX"
            className="flex-1 px-3.5 py-2.5 text-xs font-mono uppercase bg-sand-light/40 border border-sand-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-espresso focus:bg-white placeholder:font-sans placeholder:normal-case transition-all"
            disabled={giftCardLoading}
          />
          <button
            type="submit"
            disabled={giftCardLoading || !localCode.trim()}
            className="px-4 py-2.5 bg-espresso text-cream text-xs font-semibold rounded-lg hover:bg-charcoal transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          >
            {giftCardLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Applying...</span>
              </>
            ) : (
              <span>Apply</span>
            )}
          </button>
        </form>
      )}

      {giftCardError && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
          <span>⚠️</span> {giftCardError}
        </p>
      )}
    </div>
  );
};

export default GiftCardSection;
