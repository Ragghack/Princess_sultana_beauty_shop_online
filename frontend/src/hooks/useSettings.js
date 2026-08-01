import React, { useEffect, useState } from "react";
import api from "../services/api";

export const useSettings = () => {
  const [settings, setSettings] = useState({
    deliveryFee: "1000",
    shopName: "Princesse Sultana Hair Care",
    shopEmail: "contact@princesse-sultana.cm",
    shopPhone: "+237 6 93 19 09 30",
    shopAddress: "Akwa, Douala, Cameroun",
    lowStockThreshold: "10",
    taxRate: "0",
    currency: "XAF",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const response = await api.get("/settings");
    const res = response.data.data;
    setSettings({
      currency: res?.CURRENCY || "XAF",
      deliveryFee: res?.DELIVERY_FEE || "1000",
      lowStockThreshold: res?.LOW_STOCK_THRESHOLD || "10",
      shopName: res?.SHOP_NAME || "Princesse Sultana Hair Care",
      shopAddress: res?.SHOP_ADDRESS || "Akwa, Douala, Cameroun",
      shopEmail: res?.SHOP_EMAIL || "contact@princesse-sultana.cm",
      shopPhone: res?.SHOP_PHONE || "+237 6 XX XX XX XX",
      taxRate: res?.TAX_RATE || "0",
    });
  };

  const handleChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
  };
  console.log(settings);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log(settings);

    // Simulate API call
    await api.patch(`settings/DELIVERY_FEE`, {
      value: settings.deliveryFee,
      description: "Frais de livraison standard",
    });
    await api.patch(`settings/CURRENCY`, {
      value: settings.currency,
      description: "Devise",
    });
    await api.patch(`settings/SHOP_PHONE`, {
      value: settings.shopPhone,
      description: "Numéro de la boutique",
    });
    await api.patch(`settings/TAX_RATE`, {
      value: settings.taxRate,
      description: "Taux de taxe (%)",
    });
    await api.patch(`settings/SHOP_EMAIL`, {
      value: settings.shopEmail,
      description: "Email service client",
    });
    await api.patch(`settings/SHOP_NAME`, {
      value: settings.shopName,
      description: "Nom de la boutique",
    });
    await api.patch(`settings/SHOP_ADDRESS`, {
      value: settings.shopAddress,
      description: "Address de la boutique",
    });
    await api.patch(`settings/LOW_STOCK_THRESHOLD`, {
      value: settings.lowStockThreshold,
      description: "Seuil de stock faible",
    });

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return {
    handleSubmit,
    handleChange,
    loading,
    success,
    settings,
  };
};
