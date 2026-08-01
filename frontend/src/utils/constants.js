export const PAYMENT_METHODS = [
  { id: "MOBILE_MONEY", name: "Mobile Money (MTN)", icon: "📱" },
  { id: "ORANGE_MONEY", name: "Orange Money", icon: "🟠" },
  { id: "CARD", name: "Carte bancaire", icon: "💳", disabled: true },
];

// USSD payment instructions shown in the slide-down panel on Checkout.
// TODO: fill in the account holder name once confirmed.
export const PAYMENT_INSTRUCTIONS = {
  MOBILE_MONEY: {
    holderName: "SULTANA",
    number: "672828460",
    // {amount} is replaced with the order total at render time
    ussdCode: "*126*1*1*672828460*{amount}#",
  },
  ORANGE_MONEY: {
    holderName: "SULTANA",
    number: "693190930",
    ussdCode: "#150*1*1*693190930*{amount}#",
  },
};

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
export const ADMIN_WHATSAPP = "+237693190930";

export const EMAILJS_SERVICE_ID = import.meta.env.EMAILJS_SERVICE_ID;
export const EMAILJS_TEMPLATE_ID = import.meta.env.EMAILJS_TEMPLATE_ID;
export const EMAILJS_USER_ID = import.meta.env.EMAILJS_USER_ID;