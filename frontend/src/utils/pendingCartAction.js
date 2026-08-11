// Remembers what a guest was trying to do (add to cart / buy now) across
// the login redirect, so the action can be completed automatically once
// they're authenticated instead of silently failing or requiring a
// second click.

const STORAGE_KEY = "pendingCartAction";

/**
 * @param {"ADD_TO_CART" | "BUY_NOW"} type
 * @param {{ productId: string, quantity?: number, isBundle?: boolean }} payload
 */
export const setPendingCartAction = (type, payload) => {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ type, ...payload }),
    );
  } catch (e) {
    console.error("Failed to save pending cart action:", e);
  }
};

export const getPendingCartAction = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Failed to read pending cart action:", e);
    return null;
  }
};

export const clearPendingCartAction = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};