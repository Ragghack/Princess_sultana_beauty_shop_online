import { FiArrowLeft, FiX, FiPackage } from "react-icons/fi";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { formatCurrency } from "../../utils/formatters";
const VITE_APP_IMAGE_BASE_URL = import.meta.env.VITE_APP_IMAGE_BASE_URL;

const AddBundle = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    bundlePrice: "",
    featured: false,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data.data.products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addProductToBundle = (productId) => {
    if (!productId) return;

    const product = products.find((p) => p.id === productId);
    if (product && !selectedProducts.find((p) => p.productId === product.id)) {
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.featuredImage,
          quantity: 1,
        },
      ]);
    }
  };

  const removeProduct = (index) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, quantity) => {
    const updated = [...selectedProducts];
    updated[index].quantity = parseInt(quantity) || 1;
    setSelectedProducts(updated);
  };

  const calculateOriginalPrice = () => {
    return selectedProducts.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);
  };

  const calculateSavings = () => {
    const original = calculateOriginalPrice();
    const bundle = parseFloat(formData.bundlePrice) || 0;
    return {
      amount: original - bundle,
      percent:
        original > 0 ? (((original - bundle) / original) * 100).toFixed(2) : 0,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const items = selectedProducts.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
      }));

      await api.post("/bundles", {
        ...formData,
        items,
      });

      alert("Bundle créé avec succès!");
      navigate("/admin/bundles");
    } catch (error) {
      alert(error.response?.data?.message || "Échec de la création du bundle");
    } finally {
      setLoading(false);
    }
  };

  const savings = calculateSavings();
  const originalPrice = calculateOriginalPrice();
  const isPriceValid = parseFloat(formData.bundlePrice) < originalPrice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/bundles")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>
        <h1 className="font-serif text-3xl font-bold text-gray-800">
          Créer un Bundle
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-4">Informations de base</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du bundle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="Ex: Kit Soin Complet"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description courte
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="Brève description du bundle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description complète <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="5"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="Description détaillée du bundle"
                required
              />
            </div>
          </div>
        </Card>

        {/* Select Products */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-4">
            Produits du bundle <span className="text-red-500">*</span>
          </h2>

          <div className="space-y-4">
            {/* Product Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ajouter un produit
              </label>
              <select
                onChange={(e) => {
                  addProductToBundle(e.target.value);
                  e.target.value = "";
                }}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
              >
                <option value="">Sélectionner un produit...</option>
                {products
                  .filter(
                    (p) =>
                      !selectedProducts.find((sp) => sp.productId === p.id),
                  )
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Selected Products */}
            {selectedProducts.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Produits sélectionnés ({selectedProducts.length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {selectedProducts.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                    >
                      {/* Product Image */}
                      <img
                        src={
                          `${VITE_APP_IMAGE_BASE_URL}${item.image}` ||
                          item.image
                        }
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />

                      {/* Product Info */}
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.price)} × {item.quantity} ={" "}
                          {formatCurrency(
                            parseFloat(item.price) * item.quantity,
                          )}
                        </p>
                      </div>

                      {/* Quantity Input */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Qté:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(index, e.target.value)
                          }
                          className="w-20 px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-primary-300 focus:outline-none text-center"
                        />
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                <FiPackage className="mx-auto text-4xl mb-2 text-gray-400" />
                <p>Aucun produit sélectionné</p>
                <p className="text-sm">Sélectionnez des produits ci-dessus</p>
              </div>
            )}
          </div>
        </Card>

        {/* Pricing */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-4">Tarification</h2>

          <div className="space-y-6">
            {/* Price Summary */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Prix total original:</span>
                <span className="font-semibold">
                  {formatCurrency(originalPrice)}
                </span>
              </div>

              {formData.bundlePrice && isPriceValid && (
                <>
                  <div className="flex justify-between text-primary-500">
                    <span>Prix du bundle:</span>
                    <span className="font-semibold">
                      {formatCurrency(formData.bundlePrice)}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-semibold">
                        Économie:
                      </span>
                      <div className="text-right">
                        <p className="text-green-600 font-bold text-lg">
                          {formatCurrency(savings.amount)}
                        </p>
                        <p className="text-sm text-green-600">
                          {savings.percent}% de réduction
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bundle Price Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix du bundle (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="bundlePrice"
                value={formData.bundlePrice}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="Prix réduit du bundle"
                step="100"
                min="0"
                required
              />
              {formData.bundlePrice && !isPriceValid && (
                <p className="mt-2 text-sm text-red-600">
                  ⚠️ Le prix du bundle doit être inférieur au prix total (
                  {formatCurrency(originalPrice)})
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-4">Paramètres</h2>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="featured" className="text-gray-700">
              Bundle en vedette
            </label>
          </div>
        </Card>

        {/* Actions */}
        <Card padding="lg">
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/bundles")}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                loading ||
                !formData.name ||
                !formData.bundlePrice ||
                selectedProducts.length === 0 ||
                !isPriceValid
              }
            >
              {loading ? <LoadingSpinner size="sm" /> : "Créer le bundle"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default AddBundle;
