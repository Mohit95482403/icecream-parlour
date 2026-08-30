import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import Home from '../pages/Home';
import Shop from '../pages/Shop';
import OurStory from '../pages/OurStory';
import Journal from '../pages/Journal';
import Stores from '../pages/Stores';
import ProductDetails from '../pages/ProductDetails';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import ProtectedRoute from './ProtectedRoute';
import AdminProtectedRoute from '../components/admin/AdminProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';

import LoginSelect from '../pages/auth/LoginSelect';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

import Account from '../pages/account/Account';
import Profile from '../pages/account/Profile';
import Orders from '../pages/account/Orders';
import OrderDetail from '../pages/account/OrderDetail';
import Addresses from '../pages/account/Addresses';
import OrderSuccess from '../pages/OrderSuccess';
import MyReviews from '../pages/account/MyReviews';

import OrderTracking from '../pages/account/OrderTracking';
import Notifications from '../pages/account/Notifications';
import Wishlist from '../pages/account/Wishlist';
import SearchResults from '../pages/shop/SearchResults';

import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsAndConditions from '../pages/TermsAndConditions';
import RefundPolicy from '../pages/RefundPolicy';

import DeliveryPage from '../pages/DeliveryPage';
import FAQsPage from '../pages/FAQsPage';
import ContactPage from '../pages/ContactPage';
import ReturnsPage from '../pages/ReturnsPage';
import GiftCards from '../pages/GiftCards';
import MyGiftCards from '../pages/account/MyGiftCards';

import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminUserDetailPage from '../pages/admin/AdminUserDetailPage';
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminProductForm from '../pages/admin/AdminProductForm';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminOrderDetailsPage from '../pages/admin/AdminOrderDetailsPage';
import AdminDeliveryPage from '../pages/admin/AdminDeliveryPage';
import AdminCouponsPage from '../pages/admin/AdminCouponsPage';
import AdminCancellationsPage from '../pages/admin/AdminCancellationsPage';
import AdminReviewsPage from '../pages/admin/AdminReviewsPage';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage';
import AdminGiftCardsPage from '../pages/admin/AdminGiftCardsPage';
import AdminBannerPage from '../pages/admin/AdminBannerPage';
import Settings from '../pages/admin/Settings';
// Placeholder component for pages not yet built
const Placeholder = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center pt-24 w-full h-full">
    <div className="text-center">
      <h1 className="display-lg text-espresso mb-4">{title}</h1>
      <p className="body-lg text-warm-taupe">This page is under construction.</p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes — wrapped in PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/our-story" element={<OurStory />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/gift-cards" element={<GiftCards />} />
        
        {/* Auth & Cart Routes */}
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/checkout/success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
        <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
        <Route path="/login-select" element={<LoginSelect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Customer Routes */}
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/account/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/account/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/account/gift-cards" element={<ProtectedRoute><MyGiftCards /></ProtectedRoute>} />
        <Route path="/account/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
        <Route path="/account/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/account/orders/:orderNumber/track" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
        <Route path="/account/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/account/loyalty" element={<ProtectedRoute><Placeholder title="Loyalty Points" /></ProtectedRoute>} />
        <Route path="/account/reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
        <Route path="/order/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />

        {/* Customer Care Pages */}
        <Route path="/delivery" element={<DeliveryPage />} />
        <Route path="/faqs" element={<FAQsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/returns" element={<ReturnsPage />} />

        {/* Legal / Policy Pages */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />

        {/* 404 */}
        <Route path="*" element={<Placeholder title="404 — Page Not Found" />} />
      </Route>

      {/* Admin Login Route */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Dashboard Routes — separate layout */}
      <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailsPage />} />
        <Route path="cancellations" element={<AdminCancellationsPage />} />
        <Route path="customers" element={<Placeholder title="Manage Customers" />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/:id" element={<AdminProductForm />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="collections" element={<Placeholder title="Manage Collections" />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="deliveries" element={<AdminDeliveryPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="gift-cards" element={<AdminGiftCardsPage />} />
        <Route path="banner" element={<AdminBannerPage />} />
        <Route path="content" element={<Navigate to="/admin/banner" replace />} />
        <Route path="analytics" element={<Placeholder title="Analytics" />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
