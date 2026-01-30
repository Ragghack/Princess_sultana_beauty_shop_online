import React, { useState, useEffect } from "react";
import { FiFilter } from "react-icons/fi";
import { productService } from "@services/productService";
import ProductGrid from "@components/product/ProductGrid";
import Button from "@components/common/Button";
import { PRODUCT_CATEGORIES } from "@utils/constants";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        sortBy,
      };
      const data = await productService.getProducts(params);
      setProducts(data.products || data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Notre Boutique
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez notre collection complète de produits capillaires premium
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === "ALL"
                  ? "bg-gradient-to-r from-primary-300 to-primary-400 text-white shadow-soft"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Tous
            </button>
            {PRODUCT_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-primary-300 to-primary-400 text-white shadow-soft"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-600" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none bg-white"
            >
              <option value="NEWEST">Plus récent</option>
              <option value="PRICE_LOW">Prix croissant</option>
              <option value="PRICE_HIGH">Prix décroissant</option>
              <option value="POPULAR">Populaire</option>
            </select>
          </div>
        </div>

        {/* Products */}
        <ProductGrid products={products} loading={loading} />
      </div>
    </div>
  );
};

export default Shop;
