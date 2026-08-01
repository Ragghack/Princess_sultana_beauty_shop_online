/**
 * Extract a Cloudinary public_id from a secure_url so an old asset
 * can be removed when it's replaced (e.g. product image swapped out).
 * Example URL:
 *   https://res.cloudinary.com/demo/image/upload/v1690000000/sultana/products/name-123.png
 * Returns:
 *   sultana/products/name-123
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

module.exports = { getPublicIdFromUrl };
