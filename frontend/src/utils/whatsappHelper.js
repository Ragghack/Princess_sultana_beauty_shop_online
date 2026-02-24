/**
 * WhatsApp Messaging Utilities
 * Auto-opens WhatsApp Web/App with pre-filled messages
 * No QR code scanning needed - just click to send
 */

/**
 * Format phone number for WhatsApp API
 * Removes spaces, dashes, and adds country code if missing
 */
const formatWhatsAppNumber = (phone) => {
  // Remove all non-numeric characters
  let cleaned = String(phone)?.replace(/\D/g, "");

  // If starts with 0, replace with country code (Cameroon +237)
  if (cleaned.startsWith("0")) {
    cleaned = "237" + cleaned.substring(1);
  }

  // Add Cameroon country code (237) if not present
  if (!cleaned.startsWith("237")) {
    cleaned = "237" + cleaned;
  }

  return cleaned;
};

/**
 * Generate WhatsApp link that opens with pre-filled message
 * Works on both desktop (WhatsApp Web) and mobile (WhatsApp App)
 */
const generateWhatsAppLink = (phone, message) => {
  const formattedPhone = formatWhatsAppNumber(phone);
  const encodedMessage = encodeURIComponent(message);

  // wa.me link works on both desktop and mobile
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  // return `https://web.whatsapp.com/send?phone=${formattedPhone.replace(
  //   /[^\w\s]/gi,
  //   "",
  // )}&text=${encodedMessage}&app_absent=0`;
};

/**
 * Open WhatsApp with pre-filled message
 * @param {string} phone - Phone number (with or without country code)
 * @param {string} message - Message text
 */
export const openWhatsApp = (phone, message) => {
  const link = generateWhatsAppLink(phone, message);
  window.open(link, "_blank");
};

/**
 * Send new order notification to admin
 * Opens admin's WhatsApp with order details pre-filled
 */
export const notifyAdminNewOrder = (order, adminPhone) => {
  const message = `
🔔 *NOUVELLE COMMANDE* 🔔

📦 *Commande N°:* ${order.orderNumber}
👤 *Client:* ${order.customerName}
📱 *Téléphone:* ${order.customerPhone}

📍 *Adresse de livraison:*
${order.address.street}
${order.address.city}, ${order.address.region}
${order.address.landmark ? `Point de repère: ${order.address.landmark}` : ""}

🛍️ *Articles:*
${order.items
  .map((item) => {
    if (item.isBundle) {
      return `• ${item.bundleName} (Bundle) x${item.quantity} - ${item.price} FCFA`;
    }
    return `• ${item.productName} x${item.quantity} - ${item.price} FCFA`;
  })
  .join("\n")}

💰 *Montant total:* ${order.total} FCFA
💳 *Mode de paiement:* ${order.paymentMethod}
💳 *Livraison:* ${order.deliveryFee}

---
Merci d'avoir choisi Princesse Sultana Hair Care ! 🌟
`.trim();

  openWhatsApp(adminPhone, message);
};

/**
 * Send order confirmation to customer
 * Opens customer's WhatsApp with confirmation message pre-filled
 */
export const notifyCustomerOrderConfirmation = (order, customerPhone) => {
  const message = `
Bonjour ${order.customerName} ! 👋

✅ *Votre commande a été confirmée*

📦 *Numéro de commande:* ${order.orderNumber}
📅 *Date:* ${new Date().toLocaleDateString("fr-FR")}

🛍️ *Vos articles:*
${order.items
  .map((item) => {
    if (item.isBundle) {
      return `• ${item.bundleName} (Bundle) x${item.quantity}`;
    }
    return `• ${item.productName} x${item.quantity}`;
  })
  .join("\n")}

💰 *Total:* ${order.total} FCFA

🚚 Votre commande sera livrée à:
${order.address.street}, ${order.address.city}

Nous préparons votre commande avec soin et vous tiendrons informé(e) de chaque étape.

Merci pour votre confiance ! 🌟

_Pricesse Sultana Hair Care - Vos cheveux, notre passion_ 💚
`.trim();

  openWhatsApp(customerPhone, message);
};

/**
 * Send order status update to customer
 */
export const notifyCustomerStatusUpdate = (order, newStatus, customerPhone) => {
  const statusMessages = {
    CONFIRMED: "✅ Votre commande a été confirmée",
    PROCESSING: "⚙️ Votre commande est en préparation",
    ASSIGNED: "👤 Un livreur a été assigné à votre commande",
    OUT_FOR_DELIVERY: "🚚 Votre commande est en cours de livraison",
    DELIVERED: "🎉 Votre commande a été livrée",
    CANCELLED: "❌ Votre commande a été annulée",
  };

  const message = `
Bonjour ${order.customerName} ! 👋

${statusMessages[newStatus] || "📦 Mise à jour de votre commande"}

*Commande N°:* ${order.orderNumber}

${newStatus === "OUT_FOR_DELIVERY" ? `🚚 Le livreur est en route vers votre adresse:\n${order.address.street}, ${order.address.city}` : ""}

${newStatus === "DELIVERED" ? "Merci d'avoir choisi Princesse Sultana Hair Care ! 🌟\n\nN'hésitez pas à nous laisser un avis." : ""}

_Princesse Sultana Hair Care_
`.trim();

  openWhatsApp(customerPhone, message);
};

/**
 * Send low stock alert to admin
 */
export const notifyAdminLowStock = (products, adminPhone) => {
  const message = `
⚠️ *ALERTE STOCK FAIBLE* ⚠️

Les produits suivants sont en rupture de stock:

${products.map((p) => `• ${p.name} - Stock: ${p.stockQuantity} unités`).join("\n")}

Veuillez réapprovisionner rapidement.

_Notification automatique - Princesse Sultana_
`.trim();

  openWhatsApp(adminPhone, message);
};

/**
 * Customer support quick message
 * For customers to contact support with order reference
 */
export const contactSupport = (supportPhone, orderNumber = null) => {
  const message = orderNumber
    ? `Bonjour, j'ai besoin d'aide concernant ma commande N° ${orderNumber}.`
    : `Bonjour, j'ai une question à propos de vos produits.`;

  openWhatsApp(supportPhone, message);
};

/**
 * Generate a clickable WhatsApp button/link element
 * Returns the href that can be used in <a> tags
 */
export const getWhatsAppHref = (phone, message) => {
  return generateWhatsAppLink(phone, message);
};

/**
 * Auto-send notification based on order status change
 * Use this in your order status update handler
 */
export const handleOrderStatusChange = (order, newStatus, settings) => {
  // Notify customer
  if (["CONFIRMED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(newStatus)) {
    notifyCustomerStatusUpdate(order, newStatus, order.customerPhone);
  }

  // Notify admin for new orders
  if (newStatus === "PENDING" && settings.adminPhone) {
    notifyAdminNewOrder(order, settings.adminPhone);
  }
};

export default {
  openWhatsApp,
  notifyAdminNewOrder,
  notifyCustomerOrderConfirmation,
  notifyCustomerStatusUpdate,
  notifyAdminLowStock,
  contactSupport,
  getWhatsAppHref,
  handleOrderStatusChange,
};
