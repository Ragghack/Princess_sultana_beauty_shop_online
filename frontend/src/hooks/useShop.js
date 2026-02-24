import React, { useEffect, useState } from "react";
import { productService } from "../services/productService";
import api from "../services/api";

export const useShop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [bundles, setBundles] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [limit] = useState(12); // Products per page

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, order, currentPage, searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: limit,
        sortBy: sortBy,
        order: order,
      };

      if (selectedCategory !== "ALL") {
        params.category = selectedCategory;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }
      const data = await productService.getProducts(params);

      setProducts(data.data.products || data.products || []);

      const bundlesRes = await api.get("/bundles");
      setBundles(bundlesRes.data.data.bundles || []);

      // Set pagination info from backend response
      if (data.data.pagination) {
        setTotalPages(data.data.pagination.pages);
        setTotalProducts(data.data.pagination.total);
      } else if (data.pagination) {
        setTotalPages(data.pagination.pages);
        setTotalProducts(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchProducts();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page on category change
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    switch (value) {
      case "createdAt_desc":
        setSortBy("createdAt");
        setOrder("desc");
        break;
      case "price_asc":
        setSortBy("price");
        setOrder("asc");
        break;
      case "price_desc":
        setSortBy("price");
        setOrder("desc");
        break;
      case "salesCount_desc":
        setSortBy("salesCount");
        setOrder("desc");
        break;
      default:
        setSortBy("createdAt");
        setOrder("desc");
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return {
    getPageNumbers,
    goToPage,
    handleCategoryChange,
    handleSearch,
    handleSortChange,
    totalPages,
    totalProducts,
    currentPage,
    order,
    sortBy,
    loading,
    products,
    setSearchTerm,
    searchTerm,
    selectedCategory,
    bundles,
  };
};
