import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ShopProvider } from '@/contexts/ShopContext';

import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import CatalogPage from '@/pages/CatalogPage';
import FlowerDetailPage from '@/pages/FlowerDetailPage';
import AboutPage from '@/pages/AboutPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import PaymentPage from '@/pages/PaymentPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import AccountPage from '@/pages/AccountPage';
import CustomBouquetPage from '@/pages/CustomBouquetPage';
import DashboardPage from '@/pages/DashboardPage';
import DashboardOrdersPage from '@/pages/DashboardOrdersPage';
import DashboardCustomersPage from '@/pages/DashboardCustomersPage';
import DashboardCategoriesPage from '@/pages/DashboardCategoriesPage';
import DashboardFlowersPage from '@/pages/DashboardFlowersPage';
import DashboardPromotionsPage from '@/pages/DashboardPromotionsPage';
import DashboardSettingsPage from '@/pages/DashboardSettingsPage';

function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container py-20 text-center text-muted-foreground">...</div>;
  if (!user || (user.role !== 'manager' && user.role !== 'worker')) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="flowers/:id" element={<FlowerDetailPage />} />
              <Route path="custom-bouquet" element={<CustomBouquetPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="payment/:number" element={<PaymentPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
              <Route path="staff-signup" element={<SignupPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="dashboard" element={<ManagerRoute><DashboardPage /></ManagerRoute>} />
              <Route path="dashboard/orders" element={<ManagerRoute><DashboardOrdersPage /></ManagerRoute>} />
              <Route path="dashboard/customers" element={<ManagerRoute><DashboardCustomersPage /></ManagerRoute>} />
              <Route path="dashboard/categories" element={<ManagerRoute><DashboardCategoriesPage /></ManagerRoute>} />
              <Route path="dashboard/flowers" element={<ManagerRoute><DashboardFlowersPage /></ManagerRoute>} />
              <Route path="dashboard/promotions" element={<ManagerRoute><DashboardPromotionsPage /></ManagerRoute>} />
              <Route path="dashboard/settings" element={<ManagerRoute><DashboardSettingsPage /></ManagerRoute>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </CartProvider>
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="container py-24 text-center">
      <div className="font-display text-7xl text-blush-300 mb-4">404</div>
      <h1 className="font-display text-3xl mb-3">Страница не найдена</h1>
      <p className="text-muted-foreground">Возможно, вы перешли по устаревшей ссылке.</p>
    </div>
  );
}

export default App;
