import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export const useEditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "",
    price: "",
    compareAtPrice: "",
    cost: "",
    stockQuantity: "",
    lowStockThreshold: "10",
    weight: "",
    volume: "",
    bundleLength: "",
    featured: false,
    status: "ACTIVE",
  });

  // Featured image — new file chosen by the user (null = keep existing)
  const [featuredImage, setFeaturedImage] = useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState(null);

  // Gallery — new files added by the user
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // Gallery — images that already exist in the DB and should be kept
  const [existingGalleryImages, setExistingGalleryImages] = useState([]);

  const categories = [
    { value: "HAIR_OIL", label: "Huiles Capillaires" },
    { value: "SHAMPOO", label: "Shampoings" },
    { value: "GROWTH_SERUM", label: "Sérums de Croissance" },
    { value: "HAIR_BUNDLE", label: "Tissages" },
    { value: "CONDITIONER", label: "Après-Shampoings" },
    { value: "TREATMENT", label: "Traitements" },
  ];

  // ─── Load product on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setInitialLoading(true);
      const response = await api.get(`/products/${id}`);
      const product = response.data.data;

      setFormData({
        name: product.name ?? "",
        description: product.description ?? "",
        shortDescription: product.shortDescription ?? "",
        category: product.category ?? "",
        price: product.price ?? "",
        compareAtPrice: product.compareAtPrice ?? "",
        cost: product.cost ?? "",
        stockQuantity: product.stockQuantity ?? "",
        lowStockThreshold: product.lowStockThreshold ?? "10",
        weight: product.weight ?? "",
        volume: product.volume ?? "",
        bundleLength: product.bundleLength ?? "",
        featured: product.featured ?? false,
        status: product.status ?? "ACTIVE",
      });

      // Existing featured image → show as preview (no File object yet)
      if (product.featuredImage) {
        setFeaturedImagePreview(
          product.featuredImage.startsWith("http")
            ? product.featuredImage
            : `${import.meta.env.VITE_APP_IMAGE_BASE_URL}${product.featuredImage}`,
        );
      }

      // Existing gallery images
      if (product.images?.length > 0) {
        setExistingGalleryImages(product.images);
        setGalleryPreviews(
          product.images.map((img) =>
            img.url.startsWith("http")
              ? img.url
              : `${import.meta.env.VITE_APP_IMAGE_BASE_URL}${img.url}`,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      alert("Échec du chargement du produit");
      navigate("/admin/products");
    } finally {
      setInitialLoading(false);
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFeaturedImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image valide");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5MB");
      return;
    }

    setFeaturedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => setFeaturedImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveFeaturedImage = () => {
    setFeaturedImage(null);
    setFeaturedImagePreview(null);
  };

  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const totalExisting = existingGalleryImages.length + galleryImages.length;

    if (totalExisting + files.length > 6) {
      alert("Vous pouvez ajouter maximum 6 images à la galerie");
      return;
    }

    const validFiles = [];
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} n'est pas une image valide`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} dépasse 5MB`);
        return;
      }
      validFiles.push(file);

      const reader = new FileReader();
      reader.onloadend = () =>
        setGalleryPreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });

    setGalleryImages((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveGalleryImage = (index) => {
    if (index < existingGalleryImages.length) {
      // Remove from existing (DB) images
      setExistingGalleryImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Remove from newly uploaded images
      const newIndex = index - existingGalleryImages.length;
      setGalleryImages((prev) => prev.filter((_, i) => i !== newIndex));
    }
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setLoading(true);

      const formDataToSend = new FormData();

      // ── Text / numeric fields (same pattern as useAddProduct) ──
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("shortDescription", formData.shortDescription);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("price", parseFloat(formData.price));
      formDataToSend.append("status", formData.status);

      if (formData.compareAtPrice) {
        formDataToSend.append(
          "compareAtPrice",
          parseFloat(formData.compareAtPrice),
        );
      }
      if (formData.cost) {
        formDataToSend.append("cost", parseFloat(formData.cost));
      }

      formDataToSend.append(
        "stockQuantity",
        parseInt(formData.stockQuantity) || 0,
      );
      formDataToSend.append(
        "lowStockThreshold",
        parseInt(formData.lowStockThreshold) || 10,
      );

      if (formData.weight) {
        formDataToSend.append("weight", parseFloat(formData.weight));
      }
      if (formData.volume) {
        formDataToSend.append("volume", parseFloat(formData.volume));
      }
      if (formData.bundleLength) {
        formDataToSend.append(
          "bundleLength",
          parseFloat(formData.bundleLength),
        );
      }

      // Boolean: send as string "true"/"false" — backend handles both
      formDataToSend.append("featured", formData.featured);

      // ── Images ──
      // New featured image (only if the user chose one)
      if (featuredImage) {
        formDataToSend.append("featuredImage", featuredImage);
      }

      // New gallery images
      galleryImages.forEach((image) => {
        formDataToSend.append("galleryImages", image);
      });

      // Tell the backend which existing gallery images to keep
      const keepImageIds = existingGalleryImages.map((img) => img.id);
      formDataToSend.append("keepImages", JSON.stringify(keepImageIds));

      const response = await api.patch(`/products/${id}`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        alert("Produit mis à jour avec succès!");
        navigate("/admin/products");
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la mise à jour du produit",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    navigate,
    loading,
    initialLoading,
    formData,
    handleInputChange,
    handleFeaturedImageChange,
    handleGalleryImagesChange,
    handleSubmit,
    handleRemoveFeaturedImage,
    handleRemoveGalleryImage,
    categories,
    featuredImagePreview,
    galleryPreviews,
    galleryImages,
    existingGalleryImages,
  };
};
