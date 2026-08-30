import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/cart/CartDrawer';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <div className="flex flex-col min-h-screen">
              <AppRoutes />
              <CartDrawer />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#211B17',
                    color: '#F8F5EF',
                    border: '1px solid rgba(184, 170, 154, 0.25)',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#A8B58A',
                      secondary: '#211B17',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#9A5261',
                      secondary: '#F8F5EF',
                    },
                  },
                }}
              />
            </div>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
