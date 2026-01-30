import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@hooks/useCart";
import { useAuth } from "@hooks/useAuth";
import { formatCurrency } from "@utils/formatters";
import { PAYMENT_METHODS, DELIVERY_FEE } from "@utils/constants";
import Input from "@components/common/Input";
import Button from "@components/common/Button";
import Card from "@components/common/Card";
import {
  FiMapPin,
  FiMail,
  FiPhone,
  FiUser,
  FiCreditCard,
} from "react-icons/fi";
import api from "@services/api";

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    street: "",
    city: "",
    region: "",
    landmark: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("MOBILE_MONEY");
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const subtotal = getCartTotal();
  const total = subtotal + DELIVERY_FEE - discount;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "Prénom requis";
    if (!formData.lastName.trim()) newErrors.lastName = "Nom requis";
    if (!formData.email.trim()) newErrors.email = "Email requis";
    if (!formData.phone.trim()) newErrors.phone = "Téléphone requis";
    if (!formData.street.trim()) newErrors.street = "Adresse requise";
    if (!formData.city.trim()) newErrors.city = "Ville requise";
    if (!formData.region.trim()) newErrors.region = "Région requise";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const applyDiscountCode = async () => {
    try {
      const response = await api.post("/discounts/validate", {
        code: discountCode,
      });
      const { type, value } = response.data;

      let discountAmount = 0;
      if (type === "PERCENTAGE") {
        discountAmount = (subtotal * value) / 100;
      } else {
        discountAmount = value;
      }

      setDiscount(discountAmount);
    } catch (error) {
      alert("Code promo invalide");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price,
        })),
        address: formData,
        paymentMethod,
        discountCode: discountCode || null,
      };

      const response = await api.post("/orders", orderData);
      const { order } = response.data;

      // Clear cart
      await clearCart();

      // Redirect to order confirmation
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error("Order failed:", error);
      alert("Erreur lors de la commande. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Votre panier est vide
        </h2>
        <Button variant="primary" onClick={() => navigate("/shop")}>
          Continuer mes achats
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-4xl font-bold text-gray-800 mb-8">
            Finaliser la Commande
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <Card padding="lg">
                <h2 className="font-semibold text-xl text-gray-800 mb-6 flex items-center gap-2">
                  <FiMapPin className="text-primary-500" />
                  Informations de Livraison
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Prénom"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      error={errors.firstName}
                      icon={<FiUser />}
                      required
                    />
                    <Input
                      label="Nom"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      error={errors.lastName}
                      icon={<FiUser />}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      icon={<FiMail />}
                      required
                    />
                    <Input
                      label="Téléphone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      icon={<FiPhone />}
                      required
                    />
                  </div>

                  <Input
                    label="Adresse"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    error={errors.street}
                    placeholder="Ex: Akwa, Rue de la Joie"
                    icon={<FiMapPin />}
                    required
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Ville"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      error={errors.city}
                      placeholder="Ex: Douala"
                      required
                    />
                    <Input
                      label="Région"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      error={errors.region}
                      placeholder="Ex: Littoral"
                      required
                    />
                  </div>

                  <Input
                    label="Point de Repère (Optionnel)"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="Ex: Près du marché central"
                  />
                </form>
              </Card>

              {/* Payment Method */}
              <Card padding="lg">
                <h2 className="font-semibold text-xl text-gray-800 mb-6 flex items-center gap-2">
                  <FiCreditCard className="text-primary-500" />
                  Mode de Paiement
                </h2>

                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? "border-primary-400 bg-primary-50"
                          : "border-gray-200 hover:border-primary-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 text-primary-500"
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-medium text-gray-800">
                        {method.name}
                      </span>
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card padding="lg" className="sticky top-24">
                <h2 className="font-semibold text-xl text-gray-800 mb-6">
                  Récapitulatif
                </h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <img
                        src={item.product.featuredImage}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-800 line-clamp-2">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qté: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Discount Code */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Code promo"
                      className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyDiscountCode}
                    >
                      Appliquer
                    </Button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Livraison</span>
                    <span>{formatCurrency(DELIVERY_FEE)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Réduction</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-800 pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-primary-500">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleSubmit}
                  loading={loading}
                  className="mt-6"
                >
                  Confirmer la Commande
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  En confirmant, vous acceptez nos conditions d'utilisation
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
