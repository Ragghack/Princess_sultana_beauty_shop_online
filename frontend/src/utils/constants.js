export const PAYMENT_METHODS = [
  { id: "MOBILE_MONEY", name: "Mobile Money", icon: "📱" },
  { id: "ORANGE_MONEY", name: "Orange Money", icon: "🟠" },
  { id: "CASH_ON_DELIVERY", name: "Paiement à la livraison", icon: "💵" },
];

export const ORDER_STATUS = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PROCESSING: "En préparation",
  ASSIGNED: "Assignée",
  OUT_FOR_DELIVERY: "En livraison",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  FAILED: "Échouée",
  REFUNDED: "Remboursée",
};

export const PRODUCT_CATEGORIES = [
  { id: "HAIR_OIL", name: "Huiles Capillaires" },
  { id: "SHAMPOO", name: "Shampoings" },
  { id: "MASK", name: "Masque Capillaires" },
  { id: "BUTTER", name: "Beurre" },
];

export const DELIVERY_FEE = Number(import.meta.env.VITE_DELIVERY_FEE) || 1000;
export const ADMIN_WHATSAPP = "+237688049127";

export const EMAILJS_SERVICE_ID = import.meta.env.EMAILJS_SERVICE_ID;
export const EMAILJS_TEMPLATE_ID = import.meta.env.EMAILJS_TEMPLATE_ID;
export const EMAILJS_USER_ID = import.meta.env.EMAILJS_USER_ID;
