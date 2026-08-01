import React from "react";
import { Link } from "react-router-dom";

export const Categories = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl font-bold text-gray-800 mb-4">
            Nos Catégories
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explorez notre sélection de produits capillaires adaptés à tous les
            types de cheveux
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
              name: "Masque Capillaires",
              icon: "✨",
              color: "from-rose-gold-300 to-rose-gold-500",
            },
            {
              name: "Beurre",
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
  );
};
