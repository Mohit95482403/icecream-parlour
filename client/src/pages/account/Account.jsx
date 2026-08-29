import { Link } from 'react-router-dom';
import AccountLayout from '../../layouts/AccountLayout';
import { useAuth } from '../../hooks/useAuth';

const Account = () => {
  const { user } = useAuth();

  return (
    <AccountLayout title="Account Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-warm-taupe/20 bg-[#FAFAFA]">
          <h3 className="font-playfair text-xl text-midnight-charcoal mb-4">Profile Details</h3>
          <div className="space-y-2 text-sm text-midnight-charcoal mb-6">
            <p><span className="text-warm-taupe w-24 inline-block">Name:</span> {user?.firstName} {user?.lastName}</p>
            <p><span className="text-warm-taupe w-24 inline-block">Email:</span> {user?.email}</p>
            <p><span className="text-warm-taupe w-24 inline-block">Phone:</span> {user?.phone || 'Not provided'}</p>
          </div>
          <Link to="/account/profile" className="text-sm font-medium underline hover:text-warm-taupe transition-colors">
            EDIT PROFILE
          </Link>
        </div>

        <div className="p-6 border border-warm-taupe/20 bg-[#FAFAFA]">
          <h3 className="font-playfair text-xl text-midnight-charcoal mb-4">Recent Orders</h3>
          <p className="text-sm text-warm-taupe mb-6">View and track your recent orders.</p>
          <Link to="/account/orders" className="text-sm font-medium underline hover:text-warm-taupe transition-colors">
            VIEW ORDERS
          </Link>
        </div>
      </div>
    </AccountLayout>
  );
};

export default Account;
