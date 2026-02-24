import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { useCart } from "@hooks/useCart";
import { ADMIN_WHATSAPP, DELIVERY_FEE } from "../utils/constants";
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

  const [formData, setFormData] = useState({
    firstName: user?.data?.firstName || "",
    lastName: user?.data?.lastName || "",
    email: user?.data?.email || "",
    phone: user?.data?.phone || "",
    street: address?.street || "",
    city: address?.city || "",
    region: address?.region || "",
    landmark: address?.landmark || "",
  });

  useEffect(() => {
    fetchAuthUserAddress();
  }, []);

  useEffect(() => {
    formData.firstName = user?.data?.firstName;
    formData.lastName = user?.data?.lastName;
    formData.email = user?.data?.email;
    formData.phone = user?.data?.phone;
  }, [user.data]);

  useEffect(() => {
    if (address) {
      formData.city = address?.city;
      formData.region = address?.region;
      formData.street = address?.street;
      formData.landmark = address?.landmark;
    }
  }, [address]);

  const subtotal = getCartTotal();
  const total = subtotal + DELIVERY_FEE - discount;

  const fetchAuthUserAddress = async () => {
    try {
      const response = await api.get("/address");
      setAddress(response.data.data[0]);
      formData.city = response.data.data[0]?.city;
      formData.region = response.data.data[0]?.region;
      formData.street = response.data.data[0]?.street;
      formData.landmark = response.data.data[0]?.landmark;
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
      console.log("invalid form");
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
      const order = response.data.data;

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
        paymentMethod: "Paiement à la livraison",
        deliveryFee: formatCurrency(DELIVERY_FEE),
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
      alert("Erreur lors de la commande. Veuillez réessayer.");
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
  };
};
