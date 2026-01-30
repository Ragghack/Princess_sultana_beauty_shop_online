import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiMinus, FiPlus, FiShoppingCart, FiHeart } from "react-icons/fi";
import { productService } from "@services/productService";
import { useCart } from "@hooks/useCart";
import { formatCurrency } from "@utils/formatters";
import Button from "@components/common/Button";
import Badge from "@components/common/Badge";
import Card from "@components/common/Card";
import LoadingSpinner from "@components/common/LoadingSpinner";

const ProductDetailsPage = () => {
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
      setProduct(data);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement du produit..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Produit non trouvé
          </h2>
          <Button onClick={() => navigate("/shop")}>
            Retour à la boutique
          </Button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity <= 0;
  const discount = product.compareAtPrice
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100,
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-soft-lg">
                <img
                  src={
                    product.images?.[selectedImage]?.url ||
                    product.featuredImage
                  }
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {discount > 0 && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="danger" size="lg">
                      -{discount}%
                    </Badge>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? "border-primary-400 shadow-soft"
                          : "border-gray-200 hover:border-primary-200"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                  {product.category}
                </p>
                <h1 className="font-serif text-4xl font-bold text-gray-800 mb-4">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(product.rating || 4.5)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-600">
                    ({product.reviewCount || 0} avis)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl font-bold text-primary-500">
                    {formatCurrency(product.price)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-xl text-gray-400 line-through">
                      {formatCurrency(product.compareAtPrice)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Stock Status */}
                {isOutOfStock ? (
                  <Badge variant="danger" size="lg" className="mb-6">
                    Rupture de stock
                  </Badge>
                ) : product.stockQuantity < 10 ? (
                  <Badge variant="warning" size="lg" className="mb-6">
                    Plus que {product.stockQuantity} en stock
                  </Badge>
                ) : (
                  <Badge variant="success" size="lg" className="mb-6">
                    En stock
                  </Badge>
                )}
              </div>

              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium">Quantité:</span>
                  <div className="flex items-center gap-3 bg-white rounded-xl border-2 border-gray-200 p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiMinus />
                    </button>
                    <span className="w-12 text-center font-semibold">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(product.stockQuantity, quantity + 1),
                        )
                      }
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  loading={adding}
                  icon={<FiShoppingCart />}
                >
                  Acheter Maintenant
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  loading={adding}
                >
                  Ajouter au Panier
                </Button>
                <Button variant="ghost" size="lg" icon={<FiHeart />}></Button>
              </div>

              {/* Product Features */}
              <Card
                padding="lg"
                className="bg-gradient-to-br from-primary-50 to-secondary-50"
              >
                <h3 className="font-semibold text-lg text-gray-800 mb-4">
                  Caractéristiques
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-gray-700">
                    <span className="text-primary-500">✓</span>
                    100% Ingrédients naturels
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <span className="text-primary-500">✓</span>
                    Sans parabènes ni sulfates
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <span className="text-primary-500">✓</span>
                    Convient à tous types de cheveux
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <span className="text-primary-500">✓</span>
                    Testé dermatologiquement
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
