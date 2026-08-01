import React from "react";
import Card from "../../components/common/Card";

export const CTA = () => {
  return (
    <Card
      padding="lg"
      className="bg-gradient-to-r from-primary-400 to-primary-600 text-white text-center"
    >
      <h3 className="font-serif text-3xl font-bold mb-4">
        Rejoignez Notre Communauté
      </h3>
      <p className="text-white/90 mb-6 max-w-2xl mx-auto">
        Découvrez nos produits et transformez vos cheveux dès aujourd'hui!
      </p>
      <a
        href="/shop"
        className="inline-block px-8 py-4 bg-white text-primary-500 rounded-full font-semibold hover:shadow-lg transition-all"
      >
        Découvrir la Boutique
      </a>
    </Card>
  );
};
