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
  { id: "GROWTH_SERUM", name: "Sérums de Croissance" },
  { id: "HAIR_BUNDLE", name: "Tissages" },
  { id: "CONDITIONER", name: "Après-Shampoings" },
  { id: "TREATMENT", name: "Traitements" },
];

export const DELIVERY_FEE = Number(import.meta.env.VITE_DELIVERY_FEE) || 2000;
