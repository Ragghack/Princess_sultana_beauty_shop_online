import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from "react-icons/fi";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency } from "../../utils/formatters";
import api from "../../services/api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== "ALL") {
        params.category = categoryFilter;
      }
      const response = await api.get("/products", { params });
      setProducts(response.data.data.products || []);
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
        fetchProducts();
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Erreur lors de la suppression");
      }
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status) => {
    const variants = {
      ACTIVE: "success",
      INACTIVE: "warning",
      OUT_OF_STOCK: "danger",
      DISCONTINUED: "danger",
    };
    return variants[status] || "primary";
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
        <Button variant="primary" icon={<FiPlus />}>
          Nouveau Produit
        </Button>
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
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
          >
            <option value="ALL">Toutes catégories</option>
            <option value="HAIR_OIL">Huiles Capillaires</option>
            <option value="SHAMPOO">Shampoings</option>
            <option value="GROWTH_SERUM">Sérums de Croissance</option>
            <option value="HAIR_BUNDLE">Tissages</option>
            <option value="CONDITIONER">Après-Shampoings</option>
            <option value="TREATMENT">Traitements</option>
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
                      src={product.featuredImage}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800">{product.name}</p>
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
                      <button className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg">
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
      </Card>
    </div>
  );
};

export default Products;
