import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import ProductCard from "@components/product/ProductCard";
import Button from "@components/common/Button";
import LoadingSpinner from "@components/common/LoadingSpinner";

export const FeaturedProducts = ({ loading, featuredProducts }) => {
  return (
    <section className="py-16 bg-gradient-to-br from-secondary-50 to-primary-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl font-bold text-gray-800 mb-4">
            Produits Populaires
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez nos produits les plus appréciés par nos clientes
          </p>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {featuredProducts?.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center">
              <Link to="/shop">
                <Button variant="outline" size="lg" icon={<FiArrowRight />}>
                  Voir Tous les Produits
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
