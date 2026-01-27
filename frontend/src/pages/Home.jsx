import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { productService } from "@services/productService";
import ProductCard from "@components/product/ProductCard";
import Button from "@components/common/Button";
import LoadingSpinner from "@components/common/LoadingSpinner";

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const data = await productService.getFeaturedProducts();
      setFeaturedProducts(data);
    } catch (error) {
      console.error("Failed to fetch featured products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
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
                  src="/images/hero-banner.jpg"
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

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-bold text-gray-800 mb-4">
              Nos Catégories
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explorez notre sélection de produits capillaires adaptés à tous
              les types de cheveux
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                name: "Huiles Capillaires",
                icon: "💧",
                color: "from-primary-300 to-primary-500",
              },
              {
                name: "Shampoings",
                icon: "🧴",
                color: "from-secondary-300 to-secondary-500",
              },
              {
                name: "Sérums",
                icon: "✨",
                color: "from-rose-gold-300 to-rose-gold-500",
              },
              {
                name: "Tissages",
                icon: "💁‍♀️",
                color: "from-primary-400 to-primary-600",
              },
            ].map((category) => (
              <Link
                key={category.name}
                to={`/shop?category=${category.name}`}
                className="group"
              >
                <div className="bg-white rounded-2xl p-6 text-center shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-2">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300`}
                  >
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-primary-500 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
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
                {featuredProducts.slice(0, 4).map((product) => (
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

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-bold text-gray-800 mb-4">
              Pourquoi Nous Choisir?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🌿",
                title: "Produits Naturels",
                description:
                  "Ingrédients 100% naturels et bio pour respecter vos cheveux",
              },
              {
                icon: "🚚",
                title: "Livraison Rapide",
                description: "Livraison partout au Cameroun en24-48h",
              },
              {
                icon: "💝",
                title: "Satisfaction Garantie",
                description:
                  "Retour gratuit sous 14 jours si vous n'êtes pas satisfaite",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 text-center shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-4xl">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-xl text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-bold text-gray-800 mb-4">
              Ce Que Disent Nos Clientes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Marie K.",
                rating: 5,
                text: "Mes cheveux n'ont jamais été aussi beaux! Le sérum de croissance est magique.",
                image: "/images/avatars/avatar1.jpg",
              },
              {
                name: "Aminata D.",
                rating: 5,
                text: "Service client excellent et produits de qualité. Je recommande vivement!",
                image: "/images/avatars/avatar2.jpg",
              },
              {
                name: "Grace N.",
                rating: 5,
                text: "Livraison rapide et produits authentiques. Parfait pour mes cheveux naturels!",
                image: "/images/avatars/avatar3.jpg",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">Cliente vérifiée</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-400 to-primary-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-bold text-white mb-6">
            Prête à Transformer Vos Cheveux?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez des centaines de femmes qui ont déjà transformé leurs
            cheveux avec nos produits premium
          </p>
          <Link to="/shop">
            <Button variant="secondary" size="lg" icon={<FiArrowRight />}>
              Commencer Maintenant
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
export default Home;
