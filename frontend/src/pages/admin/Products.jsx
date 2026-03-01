import { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency } from "../../utils/formatters";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { PRODUCT_CATEGORIES } from "../../utils/constants";
const VITE_APP_IMAGE_BASE_URL = import.meta.env.VITE_APP_IMAGE_BASE_URL;

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, categoryFilter]);

const fetchProducts = async () => {
  try {
    setLoading(true);
    const params = {
      page: currentPage,
      limit: itemsPerPage,
    };

    if (categoryFilter !== "ALL") {
      params.category = categoryFilter;
    }

    // ADD THIS: Add cache-busting parameter
    params._t = Date.now(); // Forces fresh request

    const response = await api.get("/products", { params });
    
    // LOG THIS to see what you're getting
    console.log("Products received:", response.data.data.products);
    
    setProducts(response.data.data.products || []);
    setTotalPages(response.data.data.pagination?.pages || 1);
    setTotalProducts(response.data.data.pagination?.total || 0);
  } catch (error) {
    console.error("Failed to fetch products:", error);
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit?")) {
      try {
        await api.delete(`/products/${id}`);
        alert("Produit supprimé avec succès");
        fetchProducts();
      } catch (error) {
        alert("Échec de la suppression du produit");
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "warning";
      case "OUT_OF_STOCK":
        return "error";
      case "DISCONTINUED":
        return "default";
      default:
        return "default";
    }
  };

  // Client-side search filter
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement des produits..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-gray-800">
          Produits
        </h1>
        <div className="flex gap-3">
          <Button
            variant="primary"
            icon={<FiPlus />}
            onClick={() => navigate("/admin/products/add")}
          >
            Nouveau Produit
          </Button>
          <Button
            variant="primary"
            icon={<FiPlus />}
            onClick={() => navigate("/admin/bundles/add")}
          >
            Nouveau Bundle
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1); // Reset to first page on filter change
            }}
            className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
          >
            <option value="ALL">Toutes catégories</option>
            {PRODUCT_CATEGORIES.map((item, index) => (
              <option key={index} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Products Table */}
      <Card padding="lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Image
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Produit
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  SKU
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Catégorie
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Prix
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Stock
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <img
                      src={
                        `${VITE_APP_IMAGE_BASE_URL}${product.featuredImage}` ||
                        `${product.featuredImage}`
                      }
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/products/${product.slug}`}
                      className="font-medium text-gray-800 hover:text-primary-500"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{product.sku}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {product.category}
                  </td>
                  <td className="py-3 px-4 font-semibold text-primary-500">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`${
                        product.stockQuantity <= product.lowStockThreshold
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {product.stockQuantity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getStatusBadge(product.status)}>
                      {product.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          navigate(`/admin/products/edit/${product.id}`)
                        }
                        className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucun produit trouvé
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
              {Math.min(currentPage * itemsPerPage, totalProducts)} sur{" "}
              {totalProducts} produits
            </div>

            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border-2 ${
                  currentPage === 1
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FiChevronLeft size={20} />
              </button>

              {/* Page Numbers */}
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium ${
                          currentPage === page
                            ? "border-primary-500 bg-primary-500 text-white"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 py-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border-2 ${
                  currentPage === totalPages
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FiChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Products;
