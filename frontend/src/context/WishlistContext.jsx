import React, { createContext, useState, useEffect } from "react";
import api from "@services/api";
import { useAuth } from "@hooks/useAuth";

export const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      loadLocalWishlist();
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const response = await api.get("/wishlist");
      setWishlistItems(response.data.data.items || []);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    }
  };

  const loadLocalWishlist = () => {
    const saved = localStorage.getItem("wishlist");
    if (saved) {
      setWishlistItems(JSON.parse(saved));
    }
  };

  const saveLocalWishlist = (items) => {
    localStorage.setItem("wishlist", JSON.stringify(items));
  };

  /**
   * Add product to wishlist
   */
  const addToWishlist = async (product) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.post("/wishlist/items", {
          productId: product.id,
        });
        await fetchWishlist();
      } else {
        // Check if already exists
        const exists = wishlistItems.some(
          (item) => item.product?.id === product.id && !item.isBundle,
        );
        if (exists) {
          throw new Error("Produit déjà dans la liste de souhaits");
        }

        const newItems = [...wishlistItems, { product, isBundle: false }];
        setWishlistItems(newItems);
        saveLocalWishlist(newItems);
      }
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add bundle to wishlist
   */
  const addBundleToWishlist = async (bundle) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        await api.post("/wishlist/items", {
          bundleId: bundle.id,
          isBundle: true,
        });
        await fetchWishlist();
      } else {
        const exists = wishlistItems.some(
          (item) => item.bundle?.id === bundle.id && item.isBundle,
        );
        if (exists) {
          throw new Error("Bundle déjà dans la liste de souhaits");
        }

        const newItems = [...wishlistItems, { bundle, isBundle: true }];
        setWishlistItems(newItems);
        saveLocalWishlist(newItems);
      }
    } catch (error) {
      console.error("Failed to add bundle to wishlist:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove item from wishlist
   */
  const removeFromWishlist = async (itemId, isBundle = false) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        await api.delete(`/wishlist/items/${itemId}`);
        await fetchWishlist();
      } else {
        const newItems = wishlistItems.filter((item) => {
          if (isBundle) {
            return !(item.bundle?.id === itemId && item.isBundle);
          }
          return !(item.product?.id === itemId && !item.isBundle);
        });
        setWishlistItems(newItems);
        saveLocalWishlist(newItems);
      }
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear entire wishlist
   */
  const clearWishlist = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        await api.delete("/wishlist/clear");
      }
      setWishlistItems([]);
      localStorage.removeItem("wishlist");
    } catch (error) {
      console.error("Failed to clear wishlist:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if item is in wishlist
   */
  const isInWishlist = (id, isBundle = false) => {
    return wishlistItems.some((item) => {
      if (isBundle) {
        return item.bundle?.id === id && item.isBundle;
      }
      return item.product?.id === id && !item.isBundle;
    });
  };

  /**
   * Move item to cart
   */
  const moveToCart = async (itemId, quantity = 1) => {
    setLoading(true);
    try {
      await api.post(`/wishlist/move-to-cart/${itemId}`, { quantity });
      await fetchWishlist();
    } catch (error) {
      console.error("Failed to move to cart:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get wishlist count
   */
  const getWishlistCount = () => {
    return wishlistItems.length;
  };

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    addBundleToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    moveToCart,
    getWishlistCount,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistProvider;
