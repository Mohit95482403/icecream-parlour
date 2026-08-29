import { motion } from 'framer-motion';

const OrderStatusTimeline = ({ timeline }) => {
  if (!timeline || timeline.length === 0) return null;

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'confirmed': return 'We have received your order.';
      case 'preparing': return 'Your ice cream is being prepared.';
      case 'ready': return 'Packed and ready to go.';
      case 'out_for_delivery': return 'On its way to you.';
      case 'delivered': return 'Delivered successfully.';
      case 'cancelled': return 'Order was cancelled.';
      default: return '';
    }
  };

  return (
    <div className="relative py-8">
      {/* Background track line */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 hidden md:block"></div>
      
      <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-0 relative">
        {timeline.map((step, index) => {
          const isCompleted = step.completed;
          const isCurrent = step.current;
          
          return (
            <div key={step.status} className="flex flex-row md:flex-col items-center md:items-center relative z-10 gap-4 md:gap-2 w-full md:w-1/5">
              {/* Mobile connecting line */}
              {index < timeline.length - 1 && (
                <div className="absolute top-[20px] left-[19px] w-0.5 h-full bg-gray-200 md:hidden"></div>
              )}
              
              {/* Status Circle */}
              <motion.div 
                initial={isCurrent ? { scale: 0.8, opacity: 0 } : false}
                animate={isCurrent ? { scale: 1, opacity: 1 } : false}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 z-10 transition-colors duration-500
                  ${isCompleted 
                    ? 'bg-midnight-charcoal border-midnight-charcoal text-white' 
                    : isCurrent 
                      ? 'bg-white border-midnight-charcoal text-midnight-charcoal' 
                      : 'bg-white border-gray-200 text-gray-300'
                  }`}
              >
                {isCompleted && !isCurrent ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </motion.div>

              {/* Status Content */}
              <div className="md:text-center pt-1 md:pt-4">
                <h4 className={`font-medium ${isCurrent || isCompleted ? 'text-midnight-charcoal' : 'text-gray-400'}`}>
                  {getStatusLabel(step.status)}
                </h4>
                {step.timestamp && (
                  <p className="text-xs text-warm-taupe mt-1">
                    {new Date(step.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                )}
                <p className="text-xs text-warm-taupe mt-1 hidden md:block">
                  {getStatusDescription(step.status)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusTimeline;
