import { useEffect, useState } from "react";
import { productService } from "@services/productService";

export const useHome = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const data = await productService.getFeaturedProducts();
      setFeaturedProducts(data.data);
    } catch (error) {
      console.error("Failed to fetch featured products:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    featuredProducts,
    loading,
  };
};
