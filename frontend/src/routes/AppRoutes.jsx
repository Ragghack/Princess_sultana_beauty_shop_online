import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AdminLayout from "@/layouts/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

// Pages
import Home from "@pages/Home";
import Shop from "@pages/Shop";
import ProductDetailsPage from "@pages/ProductDetailsPage";
import Cart from "@pages/Cart";
import Checkout from "@pages/Checkout";
import OrderConfirmation from "@pages/OrderConfirmation";
import Login from "@pages/Login";
import Register from "@pages/Register";
import Account from "@pages/Account";
import About from "@pages/About";
import Contact from "@pages/Contact";
import FAQ from "@pages/FAQ";

// Admin Pages
import AdminDashboard from "@pages/admin/Dashboard";
import AdminProducts from "@pages/admin/Products";
import AdminOrders from "@pages/admin/Orders";

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
        <Route path="orders" element={<AdminOrders />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
