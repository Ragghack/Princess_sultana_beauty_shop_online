import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiSearch,
  FiHeart,
  FiShoppingBag,
  FiMenu,
  FiX,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "@hooks/useAuth";
import { useCart } from "@hooks/useCart";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-soft">
      {/* Top Bar */}
<div className="bg-gradient-to-r from-primary-100 to-secondary-100 py-2">
  <div className="container mx-auto px-4">
    <div className="flex justify-between items-center text-sm">
      <div className="hidden md:flex gap-6 text-gray-700">
       {/* <span>📞 +237693190930</span>
        <span>✉️ contact@princesse-sultana.cm</span>*/}
      </div>
      <div className="flex gap-4 ml-auto">
        {isAuthenticated ? (
          <>
            <Link
              to="/account"
              className="text-gray-700 hover:text-primary-500 transition-colors"
            >
              Mon Compte
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-primary-500 transition-colors"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="relative inline-flex items-center justify-center px-6 py-2 overflow-hidden font-medium text-primary-600 rounded-full shadow-2xl group hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-1"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-400 via-primary-300 to-secondary-300"></span>
              <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-primary-200 rounded-full opacity-30 group-hover:rotate-90 ease"></span>
              <span className="relative text-white">Connexion</span>
            </Link>
            
            <Link
              to="/register"
              className="relative inline-flex items-center justify-center px-6 py-2 overflow-hidden font-medium text-secondary-600 rounded-full shadow-2xl group hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-1"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-secondary-400 via-secondary-300 to-primary-300"></span>
              <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-secondary-200 rounded-full opacity-30 group-hover:rotate-90 ease"></span>
              <span className="relative text-white">Inscription</span>
            </Link>
          </>
        )}
      </div>
    </div>
  </div>
</div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-serif text-xl font-bold">
                PS
              </span>
            </div>
            <span className="hidden md:block font-serif text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              Princesse Sultana
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-500 font-medium transition-colors relative group"
            >
              Accueil
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/shop"
              className="text-gray-700 hover:text-primary-500 font-medium transition-colors relative group"
            >
              Boutique
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/about"
              className="text-gray-700 hover:text-primary-500 font-medium transition-colors relative group"
            >
              À Propos
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-primary-500 font-medium transition-colors relative group"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              to="/faq"
              className="text-gray-700 hover:text-primary-500 font-medium transition-colors relative group"
            >
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-primary-50 rounded-full transition-colors">
              <FiSearch size={20} className="text-gray-700" />
            </button>
            <Link
              to="/account/wishlist"
              className="p-2 hover:bg-primary-50 rounded-full transition-colors"
            >
              <FiHeart size={20} className="text-gray-700" />
            </Link>
            <Link
              to="/cart"
              className="relative p-2 hover:bg-primary-50 rounded-full transition-colors"
            >
              <FiShoppingBag size={20} className="text-gray-700" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {getCartCount()}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-primary-50 rounded-full transition-colors"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 py-4 animate-slide-down">
          <div className="container mx-auto px-4">
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-500 font-medium py-2"
              >
                Accueil
              </Link>
              <Link
                to="/shop"
                className="text-gray-700 hover:text-primary-500 font-medium py-2"
              >
                Boutique
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-primary-500 font-medium py-2"
              >
                À Propos
              </Link>
              <Link
                to="/contact"
                className="text-gray-700 hover:text-primary-500 font-medium py-2"
              >
                Contact
              </Link>
              <Link
                to="/faq"
                className="text-gray-700 hover:text-primary-500 font-medium py-2"
              >
                FAQ
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
