const crypto = require("crypto");

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `PS-${timestamp}${random}`;
};

/**
 * Generate unique SKU
 */
const generateSKU = (productName, category) => {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const nameCode = productName
    .replace(/\s+/g, "")
    .substring(0, 4)
    .toUpperCase();
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${categoryCode}-${nameCode}-${random}`;
};

/**
 * Generate slug from string
 */
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

/**
 * Calculate discount amount
 */
const calculateDiscount = (subtotal, discountCode) => {
  if (!discountCode) return 0;

  if (discountCode.type === "PERCENTAGE") {
    return (subtotal * discountCode.value) / 100;
  }

  return parseFloat(discountCode.value);
};

/**
 * Check if discount code is valid
 */
const isDiscountCodeValid = (discountCode) => {
  const now = new Date();
  return (
    discountCode.isActive &&
    now >= discountCode.startDate &&
    now <= discountCode.endDate &&
    (!discountCode.maxUses || discountCode.usedCount < discountCode.maxUses)
  );
};

module.exports = {
  generateOrderNumber,
  generateSKU,
  generateSlug,
  calculateDiscount,
  isDiscountCodeValid,
};
