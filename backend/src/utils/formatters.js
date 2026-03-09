/**
 * Formatters Utility
 * Common formatting functions for currency, dates, phone numbers, etc.
 */

/**
 * Format number as currency (XAF - Central African Franc)
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: XAF)
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, currency = "XAF") => {
  if (!amount && amount !== 0) return "0 XAF";

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) return "0 XAF";

  // Format with thousands separator
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount);

  return `${formatted} ${currency}`;
};

/**
 * Format number as currency with symbol
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency with FCFA symbol
 */
const formatCurrencyFCFA = (amount) => {
  if (!amount && amount !== 0) return "0 FCFA";

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) return "0 FCFA";

  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);

  return `${formatted} FCFA`;
};

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale (default: fr-FR)
 * @returns {string} Formatted date string
 */
const formatDate = (date, locale = "fr-FR") => {
  if (!date) return "";

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
};

/**
 * Format date with time
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale (default: fr-FR)
 * @returns {string} Formatted date and time string
 */
const formatDateTime = (date, locale = "fr-FR") => {
  if (!date) return "";

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
};

/**
 * Format date to short format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted short date (DD/MM/YYYY)
 */
const formatDateShort = (date) => {
  if (!date) return "";

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) return "";

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
const formatRelativeTime = (date) => {
  if (!date) return "";

  const dateObj = new Date(date);
  const now = new Date();
  const diffMs = now - dateObj;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return "À l'instant";
  } else if (diffMins < 60) {
    return `Il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
  } else if (diffHours < 24) {
    return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  } else if (diffDays < 30) {
    return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  } else if (diffMonths < 12) {
    return `Il y a ${diffMonths} mois`;
  } else {
    return `Il y a ${diffYears} an${diffYears > 1 ? "s" : ""}`;
  }
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return "";

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Cameroon phone number formatting
  if (cleaned.length === 9) {
    // Format as: 6XX XX XX XX
    return cleaned.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  } else if (cleaned.length === 12 && cleaned.startsWith("237")) {
    // Format as: +237 6XX XX XX XX
    return cleaned.replace(
      /(\d{3})(\d{3})(\d{2})(\d{2})(\d{2})/,
      "+$1 $2 $3 $4 $5",
    );
  }

  return phone;
};

/**
 * Format phone number to international format
 * @param {string} phone - Phone number
 * @returns {string} International format (+237...)
 */
const formatPhoneInternational = (phone) => {
  if (!phone) return "";

  let cleaned = phone.replace(/\D/g, "");

  // If starts with 0, replace with country code
  if (cleaned.startsWith("0")) {
    cleaned = "237" + cleaned.substring(1);
  }

  // Add + if not present
  if (!cleaned.startsWith("237")) {
    cleaned = "237" + cleaned;
  }

  return "+" + cleaned;
};

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
const formatNumber = (num) => {
  if (!num && num !== 0) return "0";

  return new Intl.NumberFormat("fr-FR").format(num);
};

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
const formatPercentage = (value, decimals = 0) => {
  if (!value && value !== 0) return "0%";

  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength) + "...";
};

/**
 * Format order status to French
 * @param {string} status - Order status
 * @returns {string} Formatted status
 */
const formatOrderStatus = (status) => {
  const statusMap = {
    PENDING: "En attente",
    CONFIRMED: "Confirmée",
    PROCESSING: "En préparation",
    ASSIGNED: "Assignée",
    SHIPPED: "Expédiée",
    OUT_FOR_DELIVERY: "En livraison",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
    REFUNDED: "Remboursée",
  };

  return statusMap[status] || status;
};

/**
 * Format payment status
 * @param {string} status - Payment status
 * @returns {string} Formatted status
 */
const formatPaymentStatus = (status) => {
  const statusMap = {
    PENDING: "En attente",
    PROCESSING: "En cours",
    COMPLETED: "Payé",
    FAILED: "Échoué",
    REFUNDED: "Remboursé",
    CANCELLED: "Annulé",
  };

  return statusMap[status] || status;
};

/**
 * Format payment method
 * @param {string} method - Payment method
 * @returns {string} Formatted method
 */
const formatPaymentMethod = (method) => {
  const methodMap = {
    CASH_ON_DELIVERY: "Paiement à la livraison",
    CARD: "Carte bancaire",
    MOBILE_MONEY: "Mobile Money",
    BANK_TRANSFER: "Virement bancaire",
    ORANGE_MONEY: "Orange Money",
    MTN_MONEY: "MTN Mobile Money",
  };

  return methodMap[method] || method;
};

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format product category
 * @param {string} category - Product category
 * @returns {string} Formatted category
 */
const formatProductCategory = (category) => {
  const categoryMap = {
    HAIR_OIL: "Huiles Capillaires",
    SHAMPOO: "Shampoings",
    GROWTH_SERUM: "Sérums de Croissance",
    HAIR_BUNDLE: "Tissages",
    CONDITIONER: "Après-Shampoings",
    TREATMENT: "Traitements",
    ACCESSORIES: "Accessoires",
    STYLING: "Produits Coiffants",
  };

  return categoryMap[category] || category;
};

module.exports = {
  // Currency
  formatCurrency,
  formatCurrencyFCFA,

  // Date & Time
  formatDate,
  formatDateTime,
  formatDateShort,
  formatRelativeTime,

  // Phone
  formatPhoneNumber,
  formatPhoneInternational,

  // Numbers
  formatNumber,
  formatPercentage,
  formatFileSize,

  // Text
  truncateText,
  capitalize,

  // Business specific
  formatOrderStatus,
  formatPaymentStatus,
  formatPaymentMethod,
  formatProductCategory,
};
