import React from "react";
import { FiHeart, FiTrash2 } from "react-icons/fi";
import Card from "../common/Card";
import Button from "../common/Button";
import { Link } from "react-router-dom";
import { useWishlist } from "@hooks/useWishlist";
import { formatCurrency } from "../../utils/formatters";
import Badge from "../common/Badge";
const VITE_APP_IMAGE_BASE_URL = import.meta.env.VITE_APP_IMAGE_BASE_URL;

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist, moveToCart } = useWishlist();

  console.log(wishlistItems);

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

  return (
    <Card padding="lg">
      <h2 className="font-serif text-2xl font-bold text-gray-800 mb-6">
        Ma Liste de Souhaits ({wishlistItems?.length})
      </h2>

      {wishlistItems?.length > 0 && (
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
              {wishlistItems.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <img
                      src={
                        `${VITE_APP_IMAGE_BASE_URL}${product.product.featuredImage}` ||
                        `${product.product.featuredImage}`
                      }
                      alt={product.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/products/${product.product.slug}`}
                      className="font-medium text-gray-800 hover:text-primary-500"
                    >
                      {product.product.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {product.product.sku}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {product.product.category}
                  </td>
                  <td className="py-3 px-4 font-semibold text-primary-500">
                    {formatCurrency(product.product.price)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`${
                        product.product.stockQuantity <=
                        product.product.lowStockThreshold
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {product.product.stockQuantity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getStatusBadge(product.product.status)}>
                      {product.product.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {wishlistItems?.length === 0 && (
        <div className="text-center py-12">
          <FiHeart size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-4">Votre liste de souhaits est vide</p>
          <Link to="/shop">
            <Button variant="primary">Découvrir nos produits</Button>
          </Link>
        </div>
      )}
    </Card>
  );
};

export default Wishlist;
