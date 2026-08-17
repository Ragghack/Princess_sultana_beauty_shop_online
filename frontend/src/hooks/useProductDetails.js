import React, { useEffect, useState } from "react";
import { productService } from "@services/productService";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useCart } from "@hooks/useCart";
import { useWishlist } from "@hooks/useWishlist";
import { useAuth } from "@hooks/useAuth";
import { setPendingCartAction } from "@utils/pendingCartAction";

export const useProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { addBundleToWishlist, addToWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);

  // Selected size/quantity variant (e.g. "250ml") — null if the product
  // has no variants or none has been picked yet.
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const data = await productService.getProductBySlug(slug);
      setProduct(data.data);
      // Default to the first variant if the product has any
      if (data.data?.variants?.length > 0) {
        setSelectedVariant(data.data.variants[0]);
      } else {
        setSelectedVariant(null);
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setLoading(false);
    }
  };

  // Effective price/stock reflect the selected variant when present,
  // otherwise fall back to the base product.
  const displayPrice = selectedVariant?.price ?? product?.price;
  const displayCompareAtPrice =
    selectedVariant?.compareAtPrice ?? product?.compareAtPrice;
  const displayStock = selectedVariant?.stockQuantity ?? product?.stockQuantity;

  // If not signed in, remember exactly what the customer wanted to do so
  // it can run automatically right after login, then send them to login.
  const redirectToLoginWithAction = (type) => {
    setPendingCartAction(type, {
      productId: product.id,
      quantity,
      variantId: selectedVariant?.id || null,
    });
    navigate("/login", {
      state: { title: "toBeAuthToAddToCart", from: location },
    });
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      redirectToLoginWithAction("ADD_TO_CART");
      return;
    }
    setAdding(true);
    try {
      await addToCart(product, quantity, selectedVariant);
      // Show success message
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      redirectToLoginWithAction("BUY_NOW");
      return;
    }
    await handleAddToCart();
    navigate("/checkout");
  };

  return {
    handleAddToCart,
    handleBuyNow,
    addToCart,
    adding,
    selectedImage,
    setSelectedImage,
    quantity,
    setQuantity,
    loading,
    navigate,
    slug,
    product,
    addBundleToWishlist,
    addToWishlist,
    selectedVariant,
    setSelectedVariant,
    displayPrice,
    displayCompareAtPrice,
    displayStock,
  };
};