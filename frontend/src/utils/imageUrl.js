// Builds a displayable image URL from whatever the backend/database gives us.
//
// Product/bundle images now live on Cloudinary and come back as full URLs
// (e.g. https://res.cloudinary.com/xxx/image/upload/...). Older records
// created before the Cloudinary migration may still have a local path like
// "/uploads/products/file.png" — those need the backend origin prepended.
//
// This helper handles both cases so callers never have to think about it.

const BACKEND_ORIGIN = (
  import.meta.env.VITE_APP_IMAGE_BASE_URL || "http://localhost:5000"
).replace(/\/$/, "");

export const getImageUrl = (path) => {
  if (!path) return null;

  // Already an absolute URL (Cloudinary, or any other CDN/host) — use as-is.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Legacy local path from before the Cloudinary migration.
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_ORIGIN}${normalizedPath}`;
};

export default getImageUrl;
