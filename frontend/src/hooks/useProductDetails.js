import React, { useEffect, useState } from "react";
import { productService } from "@services/productService";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "@hooks/useCart";

export const useProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const data = await productService.getProductBySlug(slug);
      setProduct(data.data);
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart(product, quantity);
      // Show success message
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
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
  };
};
