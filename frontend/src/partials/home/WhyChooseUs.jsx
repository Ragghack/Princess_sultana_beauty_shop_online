import React from "react";

export const WhyChooseUs = () => {
  return (
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
  );
};
