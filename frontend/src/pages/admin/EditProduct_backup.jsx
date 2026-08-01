import { FiArrowLeft, FiUpload, FiX, FiImage } from "react-icons/fi";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
const VITE_APP_IMAGE_BASE_URL = import.meta.env.VITE_APP_IMAGE_BASE_URL;

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    description: "",
    category: "",
    price: "",
    compareAtPrice: "",
    cost: "",
    stockQuantity: "",
    lowStockThreshold: "",
    weight: "",
    volume: "",
    bundleLength: "",
    featured: false,
    status: "ACTIVE",
  });

  const categories = [
    { value: "HAIR_OIL", label: "Huiles Capillaires" },
    { value: "SHAMPOO", label: "Shampoings" },
    { value: "GROWTH_SERUM", label: "Sérums de Croissance" },
    { value: "HAIR_BUNDLE", label: "Tissages" },
    { value: "CONDITIONER", label: "Après-Shampoings" },
    { value: "TREATMENT", label: "Traitements" },
  ];

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setInitialLoading(true);
      const response = await api.get(`/products/${id}`);
      const product = response.data.data;

      setFormData({
        name: product.name,
        shortDescription: product.shortDescription || "",
        description: product.description || "",
        category: product.category,
        price: product.price,
        compareAtPrice: product.compareAtPrice || "",
        cost: product.cost || "",
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        weight: product.weight || "",
        volume: product.volume || "",
        bundleLength: product.bundleLength || "",
        featured: product.featured,
        status: product.status,
      });

      // Set featured image preview
      if (product.featuredImage) {
        setFeaturedImagePreview(
          `${VITE_APP_IMAGE_BASE_URL}${product.featuredImage}`,
        );
      }

      // Set existing gallery images
      if (product.images && product.images.length > 0) {
        setExistingGalleryImages(product.images);
        const previews = product.images.map(
          (img) => `${VITE_APP_IMAGE_BASE_URL}${img.url}`,
        );
        setGalleryPreviews(previews);
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      alert("Échec du chargement du produit");
      navigate("/admin/products");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFeaturedImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFeaturedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeaturedImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFeaturedImage = () => {
    setFeaturedImagePreview(null);
    setFeaturedImageFile(null);
  };

  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots =
      6 - galleryImages.length - existingGalleryImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    setGalleryImages([...galleryImages, ...filesToAdd]);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryPreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveGalleryImage = (index) => {
    // Check if it's an existing image or new upload
    if (index < existingGalleryImages.length) {
      // Remove existing image
      setExistingGalleryImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Remove new upload
      const newIndex = index - existingGalleryImages.length;
      setGalleryImages((prev) => prev.filter((_, i) => i !== newIndex));
    }
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();

      // Append form data
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== "" && formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });

      // Append featured image if changed
      if (featuredImageFile) {
        submitData.append("featuredImage", featuredImageFile);
      }

      // Append gallery images if added
      galleryImages.forEach((file) => {
        submitData.append("images", file);
      });

      // Send IDs of existing images to keep
      const keepImageIds = existingGalleryImages.map((img) => img.id);
      submitData.append("keepImages", JSON.stringify(keepImageIds));
      console.log(submitData);

      await api.patch(`/products/${id}`, submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Produit mis à jour avec succès!");
      navigate("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);
      alert(
        error.response?.data?.message || "Échec de la mise à jour du produit",
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingSpinner size="lg" text="Chargement du produit..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/products")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>
        <h1 className="font-serif text-3xl font-bold text-gray-800">
          Modifier le Produit
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-4">Informations de base</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du produit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="Ex: Huile de ricin bio"
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
                placeholder="Brève description du produit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description complète
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="5"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="Description détaillée du produit"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                  required
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="INACTIVE">Inactif</option>
                  <option value="OUT_OF_STOCK">Rupture de stock</option>
                  <option value="DISCONTINUED">Discontinué</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-4">Prix</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix de vente (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="10000"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix comparatif (FCFA)
              </label>
              <input
                type="number"
                name="compareAtPrice"
                value={formData.compareAtPrice}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="15000"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coût (FCFA)
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="5000"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </Card>

        {/* Inventory */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-4">Inventaire</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité en stock
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="100"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seuil de stock faible
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="10"
                min="0"
              />
            </div>
          </div>
        </Card>

        {/* Product Details */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-4">Détails du produit</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poids (g)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="250"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume (ml)
              </label>
              <input
                type="number"
                name="volume"
                value={formData.volume}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="250"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longueur tissage (pouces)
              </label>
              <input
                type="number"
                name="bundleLength"
                value={formData.bundleLength}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
                placeholder="18"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </Card>

        {/* Images */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-4">Images</h2>

          <div className="space-y-6">
            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image principale
              </label>

              {!featuredImagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
                  <input
                    type="file"
                    id="featuredImage"
                    accept="image/*"
                    onChange={handleFeaturedImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="featuredImage"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FiImage className="text-gray-400 text-5xl mb-3" />
                    <span className="text-gray-600 font-medium mb-1">
                      Cliquez pour sélectionner une image
                    </span>
                    <span className="text-gray-400 text-sm">
                      PNG, JPG, WEBP jusqu'à 5MB
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={featuredImagePreview}
                    alt="Preview"
                    className="w-64 h-64 object-cover rounded-xl border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFeaturedImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Gallery Images */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Galerie d'images (Max 6)
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors mb-4">
                <input
                  type="file"
                  id="galleryImages"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryImagesChange}
                  className="hidden"
                  disabled={
                    galleryImages.length + existingGalleryImages.length >= 6
                  }
                />
                <label
                  htmlFor="galleryImages"
                  className={`cursor-pointer flex flex-col items-center ${
                    galleryImages.length + existingGalleryImages.length >= 6
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <FiUpload className="text-gray-400 text-4xl mb-2" />
                  <span className="text-gray-600 font-medium mb-1">
                    Cliquez pour ajouter des images
                  </span>
                  <span className="text-gray-400 text-sm">
                    {galleryImages.length + existingGalleryImages.length}/6
                    images
                  </span>
                </label>
              </div>

              {/* Gallery Previews */}
              {galleryPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <FiX size={16} />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        Image {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
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
              Produit en vedette
            </label>
          </div>
        </Card>

        {/* Actions */}
        <Card padding="lg">
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/products")}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : "Mettre à jour"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default EditProduct;
