import React, { useState } from "react";
import { FiShoppingCart, FiTag, FiPackage } from "react-icons/fi";
import { formatCurrency } from "../../utils/formatters";
import api from "../../services/api";
import { useCart } from "@hooks/useCart";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";

const BundleCard = ({ bundle }) => {
  const [loading, setLoading] = useState(false);
  const { addBundleToCart } = useCart();

  const { isAuthenticated } = useAuth();

  const navigate = useNavigate();

  // const { isInCart } = useCart();

  // const inCart = isInCart(bundle.id, true); // true = isBundle

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login", {
        state: { title: "toBeAuthToAddToCart", from: { pathname: "/shop" } },
      });
    }
    setLoading(true);
    try {
      await addBundleToCart(bundle, 1);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bundle-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 relative">
      {/* Bundle Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
          <FiPackage size={14} />
          <span>Bundle</span>
        </div>
      </div>

      {/* Savings Badge */}
      {bundle.savingsPercent > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{Math.round(bundle.savingsPercent)}%
          </div>
        </div>
      )}

      {/* Product Images Grid */}
      <div className="relative h-64 bg-gray-100 p-4">
        <div
          className={`grid gap-2 h-full ${
            bundle.items.length === 1
              ? "grid-cols-1"
              : bundle.items.length === 2
                ? "grid-cols-2"
                : bundle.items.length === 3
                  ? "grid-cols-3"
                  : "grid-cols-2 grid-rows-2"
          }`}
        >
          {bundle.items.slice(0, 4).map((item, index) => (
            <div
              key={item.id}
              className="relative rounded-lg overflow-hidden bg-white border-2 border-gray-200"
            >
              <img
                src={item.product.featuredImage || item.productImage}
                alt={item.productName}
                className="w-full h-full object-cover"
              />
              {item.quantity > 1 && (
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  x{item.quantity}
                </div>
              )}
            </div>
          ))}
        </div>
        {bundle.items.length > 4 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            +{bundle.items.length - 4} more
          </div>
        )}
      </div>

      {/* Bundle Info */}
      <div className="p-4">
        {/* Bundle Name */}
        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
          {bundle.name}
        </h3>

        {/* Short Description */}
        {bundle.shortDescription && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {bundle.shortDescription}
          </p>
        )}

        {/* Included Products */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <FiTag size={14} />
            Ce bundle contient:
          </h4>
          <ul className="space-y-1">
            {bundle.items.map((item) => (
              <li
                key={item.id}
                className="text-sm text-gray-600 flex items-start gap-2"
              >
                <span className="text-primary-500 mt-1">•</span>
                <span>
                  <strong>{item.quantity}x</strong> {item.productName}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          {/* Original Price */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500">Prix normal:</span>
            <span className="text-sm text-gray-500 line-through">
              {formatCurrency(bundle.originalPrice)}
            </span>
          </div>

          {/* Bundle Price */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold text-gray-800">
              Prix bundle:
            </span>
            <span className="text-2xl font-bold text-primary-600">
              {formatCurrency(bundle.bundlePrice)}
            </span>
          </div>

          {/* Savings */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
            <span className="text-green-700 font-semibold text-sm">
              Vous économisez {formatCurrency(bundle.savingsAmount)} !
            </span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={loading}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Ajout en cours...</span>
            </>
          ) : (
            <>
              <FiShoppingCart size={20} />
              <span>Ajouter au panier</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BundleCard;
