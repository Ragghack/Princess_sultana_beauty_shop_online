import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { useCart } from "@hooks/useCart";
import { ADMIN_WHATSAPP, PAYMENT_METHODS } from "../utils/constants";
import {
  notifyAdminNewOrder,
  notifyCustomerOrderConfirmation,
} from "@utils/whatsappHelper";
import { formatCurrency } from "../utils/formatters";

export const useCheckout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("MOBILE_MONEY");
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [address, setAddress] = useState({});
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);

  // Delivery zones (dynamic per-town/quarter fee)
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const deliveryFee = selectedZone?.fee ?? 0;

  const requiresPaymentProof = ["MOBILE_MONEY", "ORANGE_MONEY"].includes(
    paymentMethod,
  );

  const handlePaymentProofChange = (file) => {
    setPaymentProofFile(file);
    if (errors.paymentProof) {
      setErrors((prev) => ({ ...prev, paymentProof: "" }));
    }
    if (paymentProofPreview) URL.revokeObjectURL(paymentProofPreview);
    setPaymentProofPreview(file ? URL.createObjectURL(file) : null);
  };

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    street: address?.street || "",
    city: address?.city || "",
    region: address?.region || "",
    landmark: address?.landmark || "",
  });

  useEffect(() => {
    fetchAuthUserAddress();
    fetchDeliveryZones();
  }, []);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    if (address) {
      setFormData((prev) => ({
        ...prev,
        city: address?.city || "",
        region: address?.region || "",
        street: address?.street || "",
        landmark: address?.landmark || "",
      }));
    }
  }, [address]);

  // Once zones are loaded, try to pre-select a zone matching the saved address
  useEffect(() => {
    if (!address?.city || deliveryZones.length === 0 || selectedZone) return;
    const match = deliveryZones.find(
      (z) =>
        z.town.toLowerCase() === address.city.toLowerCase() &&
        (!address.landmark ||
          !z.quarter ||
          address.landmark.toLowerCase().includes(z.quarter.toLowerCase())),
    );
    if (match) handleSelectZone(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, deliveryZones]);

  const subtotal = getCartTotal();
  const total = subtotal + deliveryFee - discount;

  const fetchDeliveryZones = async () => {
    try {
      setZonesLoading(true);
      const response = await api.get("/delivery-zones");
      setDeliveryZones(response.data.data);
    } catch (error) {
      console.error("Failed to fetch delivery zones:", error);
    } finally {
      setZonesLoading(false);
    }
  };

  const handleSelectZone = (zone) => {
    setSelectedZone(zone);
    setFormData((prev) => ({
      ...prev,
      city: zone.town,
      region: zone.region,
    }));
    if (errors.deliveryZone) {
      setErrors((prev) => ({ ...prev, deliveryZone: "" }));
    }
  };

  const fetchAuthUserAddress = async () => {
    try {
      const response = await api.get("/address");
      const savedAddress = response.data.data[0];
      setAddress(savedAddress);
    } catch (error) {
      console.log(error);
    }
  };

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
    if (!selectedZone) {
      newErrors.deliveryZone = "Veuillez sélectionner votre ville/quartier";
    }
    if (requiresPaymentProof && !paymentProofFile) {
      newErrors.paymentProof =
        "Veuillez joindre une capture d'écran du paiement";
    }

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
      console.log("invalid form");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        items: cartItems.map((item) => ({
          productId: item.product.id,
          variantId: item.variant?.id || undefined,
          quantity: item.quantity,
          price: item.price,
        })),
        address: formData,
        paymentMethod,
        discountCode: discountCode || null,
        deliveryZoneId: selectedZone?.id,
      };

      const response = await api.post("/orders", orderData);
      const order = response.data.data;

      // Upload payment proof screenshot for mobile/orange money orders
      if (requiresPaymentProof && paymentProofFile) {
        const proofData = new FormData();
        proofData.append("paymentProof", paymentProofFile);
        await api.post(`/orders/${order.id}/payment-proof`, proofData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      const paymentMethodLabel =
        PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.name ||
        paymentMethod;

      // Prepare WhatsApp data
      const whatsappOrder = {
        orderNumber: order.id,
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerPhone: formData.phone,
        address: formData,
        items: cartItems.map((item) => ({
          isBundle: item.isBundle,
          productName: item.product?.name,
          bundleName: item.bundle?.name,
          quantity: item.quantity,
          price: formatCurrency(item.price * item.quantity),
        })),
        total: formatCurrency(order.total),
        paymentMethod: paymentMethodLabel,
        deliveryFee: formatCurrency(deliveryFee),
      };

      // Auto-open WhatsApp for admin (500ms delay)
      setTimeout(() => {
        notifyAdminNewOrder(whatsappOrder, ADMIN_WHATSAPP);
      }, 500);

      // Auto-open WhatsApp for customer (1500ms delay)
      setTimeout(() => {
        notifyCustomerOrderConfirmation(whatsappOrder, formData.phone);
      }, 1500);

      // Clear cart
      await clearCart();

      // Redirect to order confirmation
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error("Order failed:", error);
      if (error.config?.url?.includes("payment-proof")) {
        alert(
          "Votre commande a été créée, mais l'envoi de la preuve de paiement a échoué. Veuillez réessayer depuis l'historique de vos commandes.",
        );
      } else {
        alert("Erreur lors de la commande. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
};