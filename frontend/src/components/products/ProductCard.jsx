import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiHeart, FiShoppingCart } from "react-icons/fi";
import { useCart } from "@hooks/useCart";
import { formatCurrency } from "@utils/formatters";
import Button from "@components/common/Button";
import Badge from "@components/common/Badge";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    try {
      await addToCart(product);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const discount = product.compareAtPrice
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100,
      )
    : 0;

  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="group">
      <Link to={`/products/${product.slug}`}>
        <div className="bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-2">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            <img
              src={product.featuredImage || "/images/placeholder-product.jpg"}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {discount > 0 && (
                <Badge variant="danger" size="sm">
                  -{discount}%
                </Badge>
              )}
              {product.featured && (
                <Badge variant="warning" size="sm">
                  ⭐ Populaire
                </Badge>
              )}
              {isOutOfStock && (
                <Badge variant="danger" size="sm">
                  Épuisé
                </Badge>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={handleWishlist}
              className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft hover:shadow-soft-md transition-all duration-300 hover:scale-110"
            >
              <FiHeart
                size={18}
                className={
                  isWishlisted
                    ? "fill-primary-500 text-primary-500"
                    : "text-gray-600"
                }
              />
            </button>

            {/* Quick Add to Cart */}
            <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={handleAddToCart}
                loading={isAdding}
                disabled={isOutOfStock}
                icon={<FiShoppingCart size={16} />}
              >
                {isOutOfStock ? "Épuisé" : "Ajouter au Panier"}
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {product.category}
            </p>
            <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
              {product.name}
            </h3>

            {/* Price */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl font-bold text-primary-500">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-gray-400 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
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
              <span className="text-xs text-gray-500 ml-1">
                ({product.reviewCount || 0})
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
