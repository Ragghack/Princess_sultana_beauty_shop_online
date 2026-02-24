import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const useAddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  });

  // Image states
  const [featuredImage, setFeaturedImage] = useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const categories = [
    { value: "HAIR_OIL", label: "Huiles Capillaires" },
    { value: "SHAMPOO", label: "Shampoings" },
    { value: "GROWTH_SERUM", label: "Sérums de Croissance" },
    { value: "HAIR_BUNDLE", label: "Tissages" },
    { value: "CONDITIONER", label: "Après-Shampoings" },
    { value: "TREATMENT", label: "Traitements" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle featured image selection
  const handleFeaturedImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Veuillez sélectionner une image valide");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image ne doit pas dépasser 5MB");
        return;
      }

      setFeaturedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeaturedImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle gallery images selection
  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate number of images (max 6)
    if (galleryImages.length + files.length > 6) {
      alert("Vous pouvez ajouter maximum 6 images à la galerie");
      return;
    }

    const validFiles = [];
    const previews = [];

    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} n'est pas une image valide`);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} dépasse 5MB`);
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === validFiles.length) {
          setGalleryPreviews((prev) => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setGalleryImages((prev) => [...prev, ...validFiles]);
  };

  // Remove featured image
  const handleRemoveFeaturedImage = () => {
    setFeaturedImage(null);
    setFeaturedImagePreview(null);
  };

  // Remove gallery image
  const handleRemoveGalleryImage = (index) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.category || !formData.price) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!featuredImage) {
      alert("Veuillez sélectionner une image principale");
      return;
    }

    try {
      setLoading(true);

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("shortDescription", formData.shortDescription);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("price", parseFloat(formData.price));

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

      formDataToSend.append("featured", formData.featured);

      // Append featured image
      formDataToSend.append("featuredImage", featuredImage);

      // Append gallery images
      galleryImages.forEach((image, index) => {
        formDataToSend.append("galleryImages", image);
      });

      const response = await api.post("/products", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        alert("Produit créé avec succès!");
        navigate("/admin/products");
      }
    } catch (error) {
      console.error("Failed to create product:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la création du produit",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    navigate,
    loading,
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
  };
};
