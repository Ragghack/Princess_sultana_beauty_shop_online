import React from "react";
import Badge from "../../components/common/Badge";
import { Link } from "react-router-dom";
import Button from "@components/common/Button";
import { FiArrowRight } from "react-icons/fi";
import BannerImage from "../../assets/images/image1.jfif";

export const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-primary-100 via-secondary-100 to-primary-50 py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-slide-up">
            <Badge variant="primary" className="inline-block">
              ✨ Nouvelle Collection
            </Badge>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-gray-800 leading-tight">
              Sublimez Vos
              <span className="block bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                Cheveux Naturels
              </span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Découvrez notre gamme de produits capillaires premium,
              spécialement conçus pour sublimer et nourrir vos cheveux. Des
              ingrédients naturels pour des résultats exceptionnels.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/shop">
                <Button variant="primary" size="lg" icon={<FiArrowRight />}>
                  Découvrir la Boutique
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg">
                  En Savoir Plus
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div>
                <p className="text-3xl font-bold text-primary-500">500+</p>
                <p className="text-sm text-gray-600">Clientes Satisfaites</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-500">100%</p>
                <p className="text-sm text-gray-600">Produits Naturels</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-500">4.9★</p>
                <p className="text-sm text-gray-600">Note Moyenne</p>
              </div>
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="relative rounded-3xl overflow-hidden shadow-soft-lg">
              <img
                src={BannerImage}
                // src="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1200&h=800&fit=crop&q=80"
                alt="Princesse Sultana Hair Care"
                className="w-full h-[500px] object-cover"
              />
            </div>
            {/* Floating Cards */}
            <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-soft-lg animate-float">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🌿</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">100% Naturel</p>
                  <p className="text-xs text-gray-500">Ingrédients bio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
