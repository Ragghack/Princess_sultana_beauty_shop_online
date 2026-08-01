import { useState, useEffect } from "react";
import { formatCurrency } from "@utils/formatters";
import {
  PAYMENT_METHODS,
  PAYMENT_INSTRUCTIONS,
} from "@utils/constants";
import Input from "@components/common/Input";
import Button from "@components/common/Button";
import Card from "@components/common/Card";
import {
  FiMapPin,
  FiMail,
  FiPhone,
  FiUser,
  FiCreditCard,
  FiUpload,
  FiCheck,
  FiCopy,
} from "react-icons/fi";
import { useCheckout } from "../hooks/useCheckout";
// Consistent image helper — fallback prevents "undefined/uploads/..." broken URLs
const BASE_URL = (import.meta.env.VITE_APP_IMAGE_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${BASE_URL}${imagePath}`;
};

const Checkout = () => {
  const {
    handleChange,
    handleSubmit,
    applyDiscountCode,
    total,
    loading,
    discount,
    discountCode,
    setDiscountCode,
    paymentMethod,
    setPaymentMethod,
    navigate,
    cartItems,
    formData,
    errors,
    subtotal,
    requiresPaymentProof,
    paymentProofFile,
    paymentProofPreview,
    handlePaymentProofChange,
    deliveryZones,
    zonesLoading,
    selectedZone,
    handleSelectZone,
    deliveryFee,
  } = useCheckout();

  const [copied, setCopied] = useState(false);
  const [zoneQuery, setZoneQuery] = useState("");
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);

  useEffect(() => {
    if (selectedZone) {
      setZoneQuery(
        `${selectedZone.town}${selectedZone.quarter ? " - " + selectedZone.quarter : ""}`,
      );
    }
  }, [selectedZone]);

  const filteredZones =
    zoneQuery.trim().length === 0
      ? deliveryZones
      : deliveryZones.filter((z) => {
          const label =
            `${z.region} ${z.town} ${z.quarter || ""}`.toLowerCase();
          return label.includes(zoneQuery.trim().toLowerCase());
        });

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville / Quartier
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={zoneQuery}
                        onChange={(e) => {
                          setZoneQuery(e.target.value);
                          setZoneDropdownOpen(true);
                        }}
                        onFocus={() => setZoneDropdownOpen(true)}
                        onBlur={() =>
                          setTimeout(() => setZoneDropdownOpen(false), 150)
                        }
                        placeholder={
                          zonesLoading
                            ? "Chargement des zones..."
                            : "Rechercher votre ville ou quartier..."
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                          errors.deliveryZone
                            ? "border-red-300"
                            : "border-gray-200"
                        }`}
                      />
                    </div>
                    {errors.deliveryZone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.deliveryZone}
                      </p>
                    )}

                    {zoneDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
                        {filteredZones.length === 0 ? (
                          <p className="p-4 text-sm text-gray-500 text-center">
                            Aucune zone trouvée. Contactez-nous pour ajouter
                            votre quartier.
                          </p>
                        ) : (
                          filteredZones.map((zone) => (
                            <button
                              type="button"
                              key={zone.id}
                              onMouseDown={() => {
                                handleSelectZone(zone);
                                setZoneDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-primary-50 flex justify-between items-center border-b border-gray-50 last:border-0"
                            >
                              <span className="text-sm text-gray-800">
                                {zone.town}
                                {zone.quarter ? ` - ${zone.quarter}` : ""}
                                <span className="text-gray-400 text-xs ml-1">
                                  ({zone.region})
                                </span>
                              </span>
                              <span className="text-sm font-medium text-primary-500 whitespace-nowrap ml-2">
                                {formatCurrency(zone.fee)}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {selectedZone && (
                      <p className="text-sm text-gray-500 mt-2">
                        Frais de livraison :{" "}
                        <span className="font-medium text-gray-700">
                          {formatCurrency(selectedZone.fee)}
                        </span>
                      </p>
                    )}
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
                    <div key={method.id}>
                      <label
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                          method.disabled
                            ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                            : paymentMethod === method.id
                              ? "border-primary-400 bg-primary-50 cursor-pointer"
                              : "border-gray-200 hover:border-primary-200 cursor-pointer"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          disabled={method.disabled}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-5 h-5 text-primary-500"
                        />
                        <span className="text-2xl">{method.icon}</span>
                        <span className="font-medium text-gray-800 flex-1">
                          {method.name}
                        </span>
                        {method.disabled && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                            Bientôt disponible
                          </span>
                        )}
                      </label>

                      {/* Slide-down payment instructions */}
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          !method.disabled &&
                          paymentMethod === method.id &&
                          PAYMENT_INSTRUCTIONS[method.id]
                            ? "grid-rows-[1fr] opacity-100 mt-3"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          {PAYMENT_INSTRUCTIONS[method.id] && (
                            <div className="p-4 rounded-xl bg-secondary-50 border border-secondary-100 space-y-4">
                              <div>
                                <p className="text-sm text-gray-600 mb-2">
                                  Composez ce code sur votre téléphone pour
                                  initier le paiement de{" "}
                                  <span className="font-semibold">
                                    {formatCurrency(total)}
                                  </span>{" "}
                                  :
                                </p>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-800">
                                    {PAYMENT_INSTRUCTIONS[
                                      method.id
                                    ].ussdCode.replace(
                                      "{amount}",
                                      Math.round(total),
                                    )}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyCode(
                                        PAYMENT_INSTRUCTIONS[
                                          method.id
                                        ].ussdCode.replace(
                                          "{amount}",
                                          Math.round(total),
                                        ),
                                      )
                                    }
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                                    title="Copier le code"
                                  >
                                    {copied ? (
                                      <FiCheck className="text-green-500" />
                                    ) : (
                                      <FiCopy />
                                    )}
                                  </button>
                                </div>
                                {PAYMENT_INSTRUCTIONS[method.id]
                                  .holderName && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    Bénéficiaire :{" "}
                                    {
                                      PAYMENT_INSTRUCTIONS[method.id]
                                        .holderName
                                    }
                                  </p>
                                )}
                              </div>

                              <div>
                                <p className="text-sm text-gray-600 mb-2">
                                  Une fois le paiement effectué, joignez une
                                  capture d'écran de la confirmation :
                                </p>
                                <label className="flex items-center gap-2 justify-center border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer hover:border-primary-300 hover:bg-white transition-colors">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handlePaymentProofChange(
                                        e.target.files?.[0] || null,
                                      )
                                    }
                                  />
                                  <FiUpload className="text-primary-500" />
                                  <span className="text-sm text-gray-600">
                                    {paymentProofFile
                                      ? paymentProofFile.name
                                      : "Choisir une capture d'écran"}
                                  </span>
                                </label>
                                {paymentProofPreview && (
                                  <img
                                    src={paymentProofPreview}
                                    alt="Aperçu de la preuve de paiement"
                                    className="mt-3 max-h-40 rounded-lg border border-gray-200 mx-auto"
                                  />
                                )}
                                {errors.paymentProof && (
                                  <p className="text-red-500 text-sm mt-2 text-center">
                                    {errors.paymentProof}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
                  {cartItems.map((item) => {
                    if (!item.isBundle && !item.bundle) {
                      return (
                        <div key={item.id} className="flex gap-3">
                          {getImageUrl(item.product?.featuredImage) ? (
                            <img
                              src={getImageUrl(item.product?.featuredImage)}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              onError={(e) => { console.warn("❌ Checkout product img failed:", e.target.src); e.target.style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0" />
                          )}
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
                      );
                    } else {
                      return (
                        <div key={item.id} className="flex gap-3">
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
                            {item.bundle.items
                              ?.slice(0, 4)
                              .map((bundleItem, idx) => (
                                <div
                                  key={idx}
                                  className="relative rounded overflow-hidden bg-gray-100"
                                >
                                  {getImageUrl(bundleItem.productImage || bundleItem.product?.featuredImage) ? (
                                    <img
                                      src={getImageUrl(bundleItem.productImage || bundleItem.product?.featuredImage)}
                                      alt={bundleItem.productName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => { console.warn("❌ Checkout bundle img failed:", e.target.src); e.target.style.display = "none"; }}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200" />
                                  )}
                                  {bundleItem.quantity > 1 && (
                                    <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1">
                                      x{bundleItem.quantity}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-800 line-clamp-2">
                              {item.bundle.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Qté: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-800">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      );
                    }
                  })}
                </div>

                {/* Discount Code */}
                {/* <div className="border-t border-gray-200 pt-4 mb-4">
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
                </div> */}

                {/* Price Breakdown */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Livraison</span>
                    <span>
                      {selectedZone
                        ? formatCurrency(deliveryFee)
                        : "À sélectionner"}
                    </span>
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