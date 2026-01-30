import React from "react";
import { Link } from "react-router-dom";
import { FiFacebook, FiInstagram } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-50 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent mb-4">
              Princesse Sultana
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Votre destination beauté pour des cheveux sains et magnifiques.
              Produits capillaires de qualité premium.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-500 hover:bg-primary-500 hover:text-white transition-all duration-300 hover:shadow-soft-md hover:-translate-y-1"
              >
                <FiFacebook size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-500 hover:bg-primary-500 hover:text-white transition-all duration-300 hover:shadow-soft-md hover:-translate-y-1"
              >
                <FiInstagram size={20} />
              </a>
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-500 hover:bg-primary-500 hover:text-white transition-all duration-300 hover:shadow-soft-md hover:-translate-y-1"
              >
                <FaWhatsapp size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-gray-800">
              Liens Rapides
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/shop"
                  className="text-gray-600 hover:text-primary-500 transition-colors"
                >
                  Boutique
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-primary-500 transition-colors"
                >
                  À Propos
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 hover:text-primary-500 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-600 hover:text-primary-500 transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-gray-800">
              Mon Compte
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/account"
                  className="text-gray-600 hover:text-primary-500 transition-colors"
                >
                  Tableau de Bord
                </Link>
              </li>
              <li>
                <Link
                  to="/account/orders"
                  className="text-gray-600 hover:text-primary-500 transition-colors"
                >
                  Mes Commandes
                </Link>
              </li>
              <li>
                <Link
                  to="/account/wishlist"
                  className="text-gray-600 hover:text-primary-500 transition-colors"
                >
                  Ma Liste de Souhaits
                </Link>
              </li>
              <li>
                <Link
                  to="/account/addresses"
                  className="text-gray-600 hover:text-primary-500 transition-colors"
                >
                  Mes Adresses
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-gray-800">
              Contact
            </h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <span>📞</span>
                <span>+237 6 XX XX XX XX</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span>
                <span>contact@princesse-sultana.cm</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📍</span>
                <span>Douala, Cameroun</span>
              </li>
              <li className="flex items-center gap-2">
                <span>🕐</span>
                <span>Lun-Sam: 8h-18h</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-200/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            &copy; 2024 Princesse Sultana. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm">
            <Link
              to="/privacy"
              className="text-gray-600 hover:text-primary-500 transition-colors"
            >
              Politique de Confidentialité
            </Link>
            <Link
              to="/terms"
              className="text-gray-600 hover:text-primary-500 transition-colors"
            >
              Conditions d'Utilisation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
