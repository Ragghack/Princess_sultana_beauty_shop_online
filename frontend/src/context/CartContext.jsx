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

  const fetchCart = async () => {
    try {
      const response = await api.get("/cart");
      setCartItems(response.data.items || []);
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

  const addToCart = async (product, quantity = 1) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.post("/cart/items", {
          productId: product.id,
          quantity,
        });
        setCartItems(response.data.items);
      } else {
        const existingItem = cartItems.find(
          (item) => item.product.id === product.id,
        );
        let newItems;

        if (existingItem) {
          newItems = cartItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        } else {
          newItems = [
            ...cartItems,
            { product, quantity, price: product.price },
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

  const updateQuantity = async (itemId, quantity) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.patch(`/cart/items/${itemId}`, { quantity });
        setCartItems(response.data.items);
      } else {
        const newItems = cartItems.map((item) =>
          item.product.id === itemId ? { ...item, quantity } : item,
        );
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

  const removeFromCart = async (itemId) => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const response = await api.delete(`/cart/items/${itemId}`);
        setCartItems(response.data.items);
      } else {
        const newItems = cartItems.filter((item) => item.product.id !== itemId);
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

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
