import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMinus,
  FiPlus,
  FiTrash2,
  FiShoppingBag,
  FiPackage,
} from "react-icons/fi";
import { useCart } from "@hooks/useCart";
import { formatCurrency } from "@utils/formatters";
import { DELIVERY_FEE } from "@utils/constants";
import Button from "@components/common/Button";
import Card from "@components/common/Card";
const VITE_APP_IMAGE_BASE_URL = import.meta.env.VITE_APP_IMAGE_BASE_URL;

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, loading } =
    useCart();
  const navigate = useNavigate();

  const subtotal = getCartTotal();
  const total = subtotal + DELIVERY_FEE;

  if (!loading && cartItems?.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto">
            <FiShoppingBag size={80} className="mx-auto text-gray-300 mb-6" />
            <h2 className="font-serif text-3xl font-bold text-gray-800 mb-4">
              Votre panier est vide
            </h2>
            <p className="text-gray-600 mb-8">
              Découvrez nos produits et ajoutez-les à votre panier
            </p>
            <Link to="/shop">
              <Button variant="primary" size="lg">
                Découvrir la Boutique
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-4xl font-bold text-gray-800 mb-8">
            Mon Panier ({cartItems?.length})
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems?.map((item) => (
                <CartItem
                  // item.id is the cart_items table primary key — always unique
                  key={item.id}
                  item={item}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card padding="lg" className="sticky top-24">
                <h2 className="font-semibold text-xl text-gray-800 mb-6">
                  Récapitulatif
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Livraison</span>
                    <span>{formatCurrency(DELIVERY_FEE)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-xl font-bold text-gray-800">
                      <span>Total</span>
                      <span className="text-primary-500">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => navigate("/checkout")}
                >
                  Passer la Commande
                </Button>

                <Link to="/shop">
                  <Button variant="ghost" size="md" fullWidth className="mt-3">
                    Continuer mes achats
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

// CartItem Component - Handles both products and bundles
export const CartItem = ({ item, updateQuantity, removeFromCart }) => {
  // ─────────────────────────────────────────────────────────────────────────
  // THE FIX: always use item.id (the cart_items PK from the DB).
  // The backend's PATCH /cart/items/:itemId and DELETE /cart/items/:itemId
  // both do prisma.cartItem.findUnique({ where: { id: itemId } }).
  // Passing item.product.id or item.bundle.id would look up the wrong table
  // and always return null → "Article non trouvé".
  // ─────────────────────────────────────────────────────────────────────────
  const cartItemId = item.id;
  console.log(cartItemId);

  // Bundle Item Display
  if (item.isBundle && item.bundle) {
    return (
      <Card padding="md" className="border-l-4 border-primary-500">
        <div className="flex gap-4">
          {/* Bundle Badge + Images */}
          <div className="flex-shrink-0">
            <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold mb-2 inline-flex items-center gap-1">
              <FiPackage size={14} />
              Bundle
            </div>

            {/* Bundle Images Grid */}
            <div
              className={`grid gap-1 w-32 h-32 ${
                item.bundle.items?.length === 1
                  ? "grid-cols-1"
                  : item.bundle.items?.length === 2
                    ? "grid-cols-2"
                    : item.bundle.items?.length === 3
                      ? "grid-cols-3"
                      : "grid-cols-2 grid-rows-2"
              }`}
            >
              {item.bundle.items?.slice(0, 4).map((bundleItem, idx) => (
                <div
                  key={idx}
                  className="relative rounded overflow-hidden bg-gray-100"
                >
                  <img
                    src={`${VITE_APP_IMAGE_BASE_URL}${bundleItem.productImage || bundleItem.product?.featuredImage}`}
                    alt={bundleItem.productName}
                    className="w-full h-full object-cover"
                  />
                  {bundleItem.quantity > 1 && (
                    <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1">
                      x{bundleItem.quantity}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bundle Info */}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-1">
              {item.bundle.name}
            </h4>

            <div className="text-sm text-gray-600 mb-3">
              <p className="font-medium mb-1">Ce bundle contient:</p>
              <ul className="space-y-1">
                {item.bundle.items?.map((bundleItem) => (
                  <li key={bundleItem.id} className="flex items-start gap-1">
                    <span className="text-primary-500">•</span>
                    <span>
                      {bundleItem.quantity}x {bundleItem.productName}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(item.bundle.originalPrice)}
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                  -{Math.round(item.bundle.savingsPercent)}%
                </span>
              </div>
              <div className="text-xl font-bold text-primary-600">
                {formatCurrency(item.price)}
              </div>
              <div className="text-xs text-green-600">
                Économie: {formatCurrency(item.bundle.savingsAmount)}
              </div>
            </div>
          </div>

          {/* Quantity Controls & Remove */}
          <div className="flex flex-col items-end justify-between">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => updateQuantity(cartItemId, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiMinus size={16} />
              </button>
              <span className="w-8 text-center font-semibold">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(cartItemId, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors"
              >
                <FiPlus size={16} />
              </button>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">Sous-total</p>
              <p className="font-bold text-gray-800">
                {formatCurrency(parseFloat(item.price) * item.quantity)}
              </p>
            </div>

            <button
              onClick={() => removeFromCart(cartItemId)}
              className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Retirer du panier"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // Regular Product Item Display
  return (
    <Card padding="md">
      <div className="flex gap-4">
        <img
          src={`${VITE_APP_IMAGE_BASE_URL}${item.product?.featuredImage}`}
          alt={item.product?.name}
          className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
        />

        <div className="flex-1">
          <Link
            to={`/products/${item.product?.slug}`}
            className="font-semibold text-gray-800 hover:text-primary-500 transition-colors line-clamp-2"
          >
            {item.product?.name}
          </Link>
          <p className="text-sm text-gray-500 mt-1">{item.product?.category}</p>
          <p className="text-primary-500 font-bold mt-2">
            {formatCurrency(item.price)}
          </p>
        </div>

        <div className="flex flex-col items-end justify-between">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => updateQuantity(cartItemId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiMinus size={16} />
            </button>
            <span className="w-8 text-center font-semibold">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(cartItemId, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors"
            >
              <FiPlus size={16} />
            </button>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">Sous-total</p>
            <p className="font-bold text-gray-800">
              {formatCurrency(parseFloat(item.price) * item.quantity)}
            </p>
          </div>

          <button
            onClick={() => removeFromCart(cartItemId)}
            className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Retirer du panier"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </div>
    </Card>
  );
};
