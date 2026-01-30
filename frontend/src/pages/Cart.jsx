import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag } from "react-icons/fi";
import { useCart } from "@hooks/useCart";
import { formatCurrency } from "@utils/formatters";
import { DELIVERY_FEE } from "@utils/constants";
import Button from "@components/common/Button";
import Card from "@components/common/Card";

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const navigate = useNavigate();

  const subtotal = getCartTotal();
  const total = subtotal + DELIVERY_FEE;

  if (cartItems.length === 0) {
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
            Mon Panier ({cartItems.length})
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.product.id} padding="md">
                  <div className="flex gap-4">
                    <img
                      src={item.product.featuredImage}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-xl"
                    />

                    <div className="flex-1">
                      <Link
                        to={`/products/${item.product.slug}`}
                        className="font-semibold text-gray-800 hover:text-primary-500 transition-colors line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.product.category}
                      </p>
                      <p className="text-primary-500 font-bold mt-2">
                        {formatCurrency(item.price)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors"
                        >
                          <FiMinus size={16} />
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors"
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </Card>
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
