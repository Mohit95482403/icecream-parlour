import { useState } from 'react';

const CancelOrderModal = ({ isOpen, onClose, onConfirm, isCancelling, mode = 'cancel' }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white max-w-md w-full p-6 shadow-xl">
        <h3 className="font-playfair text-xl text-midnight-charcoal mb-2">
          {mode === 'cancel' ? 'Cancel Order' : 'Request Cancellation'}
        </h3>
        <p className="text-warm-taupe mb-6">
          {mode === 'cancel' 
            ? 'Are you sure you want to cancel this order? This action cannot be undone.'
            : 'Are you sure you want to request cancellation for this order? Our team will review your request.'}
        </p>
        
        <div className="mb-6">
          <label className="block text-sm text-midnight-charcoal mb-2">Reason for cancellation (optional)</label>
          <textarea 
            className="w-full border border-warm-taupe/30 p-3 focus:outline-none focus:border-midnight-charcoal resize-none"
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please tell us why you are cancelling..."
          ></textarea>
        </div>

        <div className="flex gap-4 justify-end">
          <button 
            onClick={onClose}
            disabled={isCancelling}
            className="px-6 py-2 border border-midnight-charcoal text-midnight-charcoal hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Keep Order
          </button>
          <button 
            onClick={() => onConfirm(reason)}
            disabled={isCancelling}
            className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isCancelling && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {mode === 'cancel' ? 'Cancel Order' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
