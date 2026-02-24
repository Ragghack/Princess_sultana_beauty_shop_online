import React, { createContext, useState, useEffect } from "react";
import api from "@services/api";
import { useAuth } from "@hooks/useAuth";

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      loadLocalCart();
    }
  }, [isAuthenticated]);
  // console.log(cartItems);
  const fetchCart = async () => {
    // try {
    //   if (cartItems.length > 0) {
    //     cartItems.forEach(async (cart) => {
    //       await api.post("/cart/items", {
    //         productId: cart.product.id,
    //         quantity: cart.quantity,
    //       });
    //     });

    //     // const response = await api.post("/cart/items", {
    //     //   productId: product.id,
    //     //   quantity,
    //     // });
    //     // setCartItems(response.data.items || []);
    //   } else {
    //     const response = await api.get("/cart");
    //     setCartItems(response.data.data.items || []);
    //   }
    // } catch (error) {
    //   console.error("Failed to fetch cart:", error);
    // }
    try {
      if (cartItems.length > 0) {
        cartItems.forEach(async (cart) => {
          await api.post("/cart/items", {
            productId: cart.product.id,
            quantity: cart.quantity,
          });
        });
        const response = await api.get("/cart");
        console.log(response.data.data.items);
        setCartItems(response.data.data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    }
  };

  const loadLocalCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  };

  const saveLocalCart = (items) => {
    localStorage.setItem("cart", JSON.stringify(items));
  };

  /**
   * Add product to cart
   */
  const addToCart = async (product, quantity = 1) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.post("/cart/items", {
          productId: product.id,
          quantity,
        });
        console.log(response.data.items);
        setCartItems(response.data.items || []);
        await api.get("/cart");
      } else {
        const existingItem = cartItems.find(
          (item) => item.product?.id === product.id && !item.isBundle,
        );
        let newItems;

        if (existingItem) {
          newItems = cartItems.map((item) =>
            item.product?.id === product.id && !item.isBundle
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        } else {
          newItems = [
            ...cartItems,
            {
              product,
              quantity,
              price: product.price,
              isBundle: false,
            },
          ];
        }

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

  /**
   * Add bundle to cart
   */
  const addBundleToCart = async (bundle, quantity = 1) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.post("/cart/items", {
          bundleId: bundle.id,
          quantity,
          isBundle: true,
        });
        setCartItems(response.data.items || []);
      } else {
        const existingItem = cartItems.find(
          (item) => item.bundle?.id === bundle.id && item.isBundle,
        );
        let newItems;

        if (existingItem) {
          newItems = cartItems.map((item) =>
            item.bundle?.id === bundle.id && item.isBundle
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        } else {
          newItems = [
            ...cartItems,
            {
              bundle,
              quantity,
              price: bundle.bundlePrice,
              isBundle: true,
            },
          ];
        }

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

  /**
   * Update item quantity (works for both products and bundles)
   */
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    console.log(itemId);
    console.log(quantity);

    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.patch(`/cart/items/${itemId}`, { quantity });
        setCartItems(response.data.items || []);
        fetchCart();
      } else {
        const newItems = cartItems.map((item) => {
          // For products
          if (item.product?.id === itemId && !item.isBundle) {
            return { ...item, quantity };
          }
          // For bundles
          if (item.bundle?.id === itemId && item.isBundle) {
            return { ...item, quantity };
          }
          return item;
        });
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

  /**
   * Remove item from cart (works for both products and bundles)
   */
  const removeFromCart = async (itemId) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.delete(`/cart/items/${itemId}`);
        setCartItems(response.data.items || []);
        fetchCart();
      } else {
        const newItems = cartItems.filter((item) => {
          // For products
          if (item.product?.id === itemId && !item.isBundle) return false;
          // For bundles
          if (item.bundle?.id === itemId && item.isBundle) return false;
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

  /**
   * Clear entire cart
   */
  const clearCart = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        await api.delete("/cart/clear");
      }
      setCartItems([]);
      localStorage.removeItem("cart");
    } catch (error) {
      console.error("Failed to clear cart:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get cart total (supports both products and bundles)
   */
  const getCartTotal = () => {
    return (
      cartItems?.reduce((total, item) => {
        const price = parseFloat(item.price);
        return total + price * item.quantity;
      }, 0) || 0
    );
  };

  /**
   * Get total number of items in cart
   */
  const getCartCount = () => {
    return cartItems?.reduce((count, item) => count + item.quantity, 0) || 0;
  };

  /**
   * Check if item is in cart (product or bundle)
   */
  const isInCart = (id, isBundle = false) => {
    return cartItems?.some((item) => {
      if (isBundle) {
        return item.bundle?.id === id && item.isBundle;
      }
      return item.product?.id === id && !item.isBundle;
    });
  };

  // console.log(cartItems);

  const value = {
    cartItems,
    loading,
    addToCart,
    addBundleToCart, // NEW: Add bundle to cart
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    isInCart, // NEW: Check if item is in cart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
