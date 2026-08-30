import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import AccountLayout from '../../layouts/AccountLayout';

const Notifications = () => {
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.metadata?.orderNumber) {
      navigate(`/account/orders/${notification.metadata.orderNumber}/track`);
    }
  };

  return (
    <AccountLayout title="Notifications">
      <div className="flex justify-between items-end mb-6">
        <p className="text-warm-taupe">Stay updated on your orders and offers.</p>
        {notifications.length > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-sm text-midnight-charcoal border-b border-midnight-charcoal pb-0.5 hover:text-black transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading && notifications.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded"></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-[#FAFAFA] border border-warm-taupe/20">
          <p className="text-warm-taupe">You have no notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notif => (
            <div 
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-6 border flex gap-4 cursor-pointer transition-colors ${
                notif.isRead 
                  ? 'border-warm-taupe/20 bg-white hover:bg-gray-50' 
                  : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/50'
              }`}
            >
              <div className="mt-1">
                <div className={`w-3 h-3 rounded-full ${notif.isRead ? 'bg-transparent' : 'bg-blue-600'}`}></div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-midnight-charcoal">{notif.title}</h3>
                  <span className="text-xs text-warm-taupe whitespace-nowrap ml-4">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-warm-taupe">{notif.message}</p>
                {notif.metadata?.orderNumber && (
                  <button className="mt-3 text-xs font-medium text-midnight-charcoal uppercase tracking-wider hover:underline">
                    View Details &rarr;
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountLayout>
  );
};

export default Notifications;
