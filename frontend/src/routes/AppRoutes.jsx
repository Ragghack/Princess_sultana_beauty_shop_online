import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import DeliveryRoute from "./DeliveryRoute";

// Pages
import Home from "../pages/Home";
import Shop from "../pages/Shop";
import ProductDetailsPage from "../pages/ProductDetailsPage";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import OrderConfirmation from "../pages/OrderConfirmation";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Account from "../pages/Account";
import About from "../pages/About";
import Contact from "../pages/Contact";
import FAQ from "../pages/FAQ";

// Admin Pages
import AdminDashboard from "../pages/admin/Dashboard";
import AdminProducts from "../pages/admin/Products";
import AdminOrders from "../pages/admin/Orders";
import AdminOrderDetail from "../pages/admin/OrderDetails";
import AdminCustomers from "../pages/admin/Customers";
import AdminSettings from "../pages/admin/Settings";
import AdminAddProduct from "../pages/admin/AddProduct";
import AdminAddBundle from "../pages/admin/AddBundle";
import AdminBundles from "../pages/admin/Bundles";
import AdminEditBundle from "../pages/admin/EditBundle";
import AdminEditProduct from "../pages/admin/EditProduct";

// Delivery Pages
import DeliveryDashboard from "../pages/delivery/Dashboard";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="products/:slug" element={<ProductDetailsPage />} />
        <Route path="cart" element={<Cart />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="checkout" element={<Checkout />} />
          <Route
            path="order-confirmation/:orderId"
            element={<OrderConfirmation />}
          />
          <Route path="account/*" element={<Account />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="bundles" element={<AdminBundles />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="products/add" element={<AdminAddProduct />} />
        <Route path="products/edit/:id" element={<AdminEditProduct />} />
        <Route path="bundles/add" element={<AdminAddBundle />} />
        <Route path="bundles/edit/:id" element={<AdminEditBundle />} />
      </Route>

      {/* Delivery Routes */}
      <Route
        path="/delivery"
        element={
          <DeliveryRoute>
            <MainLayout />
          </DeliveryRoute>
        }
      >
        <Route index element={<DeliveryDashboard />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
