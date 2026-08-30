import { Link, useNavigate } from 'react-router-dom';

const NotificationDropdown = ({ notifications, markAsRead, markAllAsRead, onClose, userRole = 'customer' }) => {
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    onClose();
    
    // Navigate based on type and role
    if (notification.metadata?.orderId || notification.metadata?.orderNumber) {
      if (userRole === 'admin') {
        navigate(`/admin/orders/${notification.metadata.orderId || notification.metadata.orderNumber}`);
      } else if (userRole === 'delivery') {
        navigate(`/delivery/orders/${notification.metadata.orderId || notification.metadata.orderNumber}`);
      } else {
        navigate(`/account/orders/${notification.metadata.orderNumber}/track`);
      }
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white border border-warm-taupe/20 shadow-xl z-50 rounded-md overflow-hidden">
      <div className="p-4 border-b border-warm-taupe/20 flex justify-between items-center bg-gray-50">
        <h3 className="font-playfair text-lg text-midnight-charcoal">Notifications</h3>
        <button 
          onClick={markAllAsRead}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          Mark all read
        </button>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-warm-taupe">
            You have no notifications.
          </div>
        ) : (
          notifications.slice(0, 5).map(notif => (
            <div 
              key={notif.id} 
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 border-b border-warm-taupe/10 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
            >
              <div className="flex gap-3">
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-midnight-charcoal mb-1">{notif.title}</h4>
                  <p className="text-xs text-warm-taupe line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-warm-taupe/70 mt-2">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-3 bg-gray-50 text-center border-t border-warm-taupe/20">
        <Link 
          to="/account/notifications" 
          onClick={onClose}
          className="text-sm font-medium text-midnight-charcoal hover:underline"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;
