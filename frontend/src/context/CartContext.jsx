import React, { createContext, useState, useEffect } from "react";
import api from "@services/api";
import { useAuth } from "@hooks/useAuth";

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false); // separate flag for login sync
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      syncLocalCartToDB();
    } else {
      loadLocalCart();
    }
  }, [isAuthenticated]);

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL STORAGE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const loadLocalCart = () => {
    try {
      const saved = localStorage.getItem("cart");
      setCartItems(saved ? JSON.parse(saved) : []);
    } catch {
      setCartItems([]);
    }
  };

  const saveLocalCart = (items) => {
    localStorage.setItem("cart", JSON.stringify(items));
  };

  const clearLocalCart = () => {
    localStorage.removeItem("cart");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SYNC ON LOGIN
  // Reads localStorage snapshot, fetches DB cart, merges them into DB,
  // then wipes localStorage. Skips out-of-stock items silently.
  // ─────────────────────────────────────────────────────────────────────────

  const syncLocalCartToDB = async () => {
    setSyncing(true);
    try {
      // Step 1: read localStorage NOW (before any state changes)
      let localItems = [];
      try {
        const saved = localStorage.getItem("cart");
        localItems = saved ? JSON.parse(saved) : [];
      } catch {
        localItems = [];
      }

      // Step 2: push every local item into the DB cart
      // cartController.addItem increments quantity if item already exists,
      // so this naturally merges with any previous DB cart session.
      // We fire requests sequentially to avoid race conditions on cart creation.
      for (const item of localItems) {
        try {
          if (item.isBundle && item.bundle?.id) {
            await api.post("/cart/items", {
              bundleId: item.bundle.id,
              quantity: item.quantity,
              isBundle: true,
            });
          } else if (!item.isBundle && item.product?.id) {
            await api.post("/cart/items", {
              productId: item.product.id,
              quantity: item.quantity,
            });
          }
        } catch {
          // Silently skip — item is out of stock or unavailable
        }
      }

      // Step 3: fetch the final merged DB cart and display it
      const response = await api.get("/cart");
      setCartItems(response.data.data.items || []);

      // Step 4: wipe localStorage — it's now safely in the DB
      clearLocalCart();
    } catch (error) {
      console.error("Failed to sync cart on login:", error);
      // Fallback: just fetch whatever is in the DB
      try {
        const response = await api.get("/cart");
        setCartItems(response.data.data.items || []);
        clearLocalCart();
      } catch {
        setCartItems([]);
      }
    } finally {
      setSyncing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ADD PRODUCT TO CART
  // ─────────────────────────────────────────────────────────────────────────

  const addToCart = async (product, quantity = 1) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.post("/cart/items", {
          productId: product.id,
          quantity,
        });
        // Controller returns the full updated cart object
        setCartItems(response.data.data.items || []);
      } else {
        const existing = cartItems.find(
          (item) => item.product?.id === product.id && !item.isBundle,
        );
        const newItems = existing
          ? cartItems.map((item) =>
              item.product?.id === product.id && !item.isBundle
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            )
          : [
              ...cartItems,
              { product, quantity, price: product.price, isBundle: false },
            ];

        setCartItems(newItems);
        saveLocalCart(newItems);
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ADD BUNDLE TO CART
  // ─────────────────────────────────────────────────────────────────────────

  const addBundleToCart = async (bundle, quantity = 1) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.post("/cart/items", {
          bundleId: bundle.id,
          quantity,
          isBundle: true,
        });
        setCartItems(response.data.data.items || []);
      } else {
        const existing = cartItems.find(
          (item) => item.bundle?.id === bundle.id && item.isBundle,
        );
        const newItems = existing
          ? cartItems.map((item) =>
              item.bundle?.id === bundle.id && item.isBundle
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            )
          : [
              ...cartItems,
              { bundle, quantity, price: bundle.bundlePrice, isBundle: true },
            ];

        setCartItems(newItems);
        saveLocalCart(newItems);
      }
    } catch (error) {
      console.error("Failed to add bundle to cart:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE ITEM QUANTITY
  // Authenticated: itemId = cart_items.id (DB primary key)
  // Unauthenticated: itemId = product.id or bundle.id (local match key)
  // ─────────────────────────────────────────────────────────────────────────

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    setLoading(true);
    console.log({ itemId, quantity });
    try {
      if (isAuthenticated) {
        const response = await api.patch(`/cart/items/${itemId}`, { quantity });
        setCartItems(response.data.data.items || []);
      } else {
        const newItems = cartItems.map((item) => {
          if (!item.isBundle && item.product?.id === itemId) {
            return { ...item, quantity };
          }
          if (item.isBundle && item.bundle?.id === itemId) {
            return { ...item, quantity };
          }
          return item;
        });
        console.log(newItems);
        setCartItems(newItems);
        saveLocalCart(newItems);
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // REMOVE ITEM FROM CART
  // Authenticated: itemId = cart_items.id (DB primary key)
  // Unauthenticated: itemId = product.id or bundle.id (local match key)
  // ─────────────────────────────────────────────────────────────────────────

  const removeFromCart = async (itemId) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.delete(`/cart/items/${itemId}`);
        setCartItems(response.data.data.items || []);
      } else {
        const newItems = cartItems.filter((item) => {
          if (!item.isBundle && item.product?.id === itemId) return false;
          if (item.isBundle && item.bundle?.id === itemId) return false;
          return true;
        });
        setCartItems(newItems);
        saveLocalCart(newItems);
      }
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CLEAR CART
  // ─────────────────────────────────────────────────────────────────────────

  const clearCart = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        await api.delete("/cart/clear");
      }
      setCartItems([]);
      clearLocalCart();
    } catch (error) {
      console.error("Failed to clear cart:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const getCartTotal = () =>
    cartItems?.reduce(
      (total, item) => total + parseFloat(item.price) * item.quantity,
      0,
    ) || 0;

  const getCartCount = () =>
    cartItems?.reduce((count, item) => count + item.quantity, 0) || 0;

  const isInCart = (id, isBundle = false) =>
    cartItems?.some((item) =>
      isBundle
        ? item.bundle?.id === id && item.isBundle
        : item.product?.id === id && !item.isBundle,
    );

  // ─────────────────────────────────────────────────────────────────────────

  const value = {
    cartItems,
    loading,
    syncing, // expose so UI can show a "syncing cart..." spinner on login
    addToCart,
    addBundleToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
