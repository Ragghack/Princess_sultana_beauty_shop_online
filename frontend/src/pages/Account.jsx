import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  FiUser,
  FiShoppingBag,
  FiHeart,
  FiMapPin,
  FiLogOut,
  FiSettings,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";

// Sub-pages
import AccountOverview from "../components/account/AccountOverview";
import OrderHistory from "../components/account/OrderHistory";
import Wishlist from "../components/account/Wishlist";
// import AddressBook from "../components/account/AddressBook";
import ProfileSettings from "../components/account/ProfileSettings";

const Account = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: "/account", icon: <FiUser />, label: "Mon Profil", exact: true },
    {
      path: "/account/orders",
      icon: <FiShoppingBag />,
      label: "Mes Commandes",
    },
    {
      path: "/account/wishlist",
      icon: <FiHeart />,
      label: "Ma Liste de Souhaits",
    },
    // { path: "/account/addresses", icon: <FiMapPin />, label: "Mes Adresses" },
    { path: "/account/settings", icon: <FiSettings />, label: "Parametres" },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!user) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold text-gray-800 mb-2">
              Mon Compte
            </h1>
            <p className="text-gray-600">
              Bienvenue, {user?.data?.firstName} {user?.data?.lastName}
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card padding="none" className="overflow-hidden">
                {/* User Info */}
                <div className="bg-gradient-to-br from-primary-300 to-primary-500 p-6 text-white">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold">
                      {user?.data?.firstName?.charAt(0)}
                      {user?.data?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-center font-semibold text-lg">
                    {user?.data?.firstName} {user?.data?.lastName}
                  </h3>
                  <p className="text-center text-sm text-white/80">
                    {user?.data?.email}
                  </p>
                </div>

                {/* Navigation Menu */}
                <nav className="py-4">
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                        isActive(item.path, item.exact)
                          ? "bg-primary-50 text-primary-600 border-r-4 border-primary-500"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-6 py-3 text-red-600 hover:bg-red-50 w-full transition-colors"
                  >
                    <FiLogOut />
                    <span className="font-medium">Déconnexion</span>
                  </button>
                </nav>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Routes>
                <Route index element={<AccountOverview />} />
                <Route path="orders" element={<OrderHistory />} />
                <Route path="wishlist" element={<Wishlist />} />
                {/* <Route path="addresses" element={<AddressBook />} /> */}
                <Route path="settings" element={<ProfileSettings />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
