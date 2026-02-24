import React from "react";
import Card from "../../components/common/Card";

export const Values = () => {
  return (
    <>
      <Card padding="lg" className="mb-8">
        <h2 className="font-serif text-3xl font-bold text-gray-800 mb-6 text-center">
          Nos Valeurs
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌿</span>
            </div>
            <h4 className="font-semibold text-lg text-gray-800 mb-2">
              100% Naturel
            </h4>
            <p className="text-gray-600 text-sm">
              Ingrédients biologiques et naturels, sans parabènes ni sulfates
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💎</span>
            </div>
            <h4 className="font-semibold text-lg text-gray-800 mb-2">
              Qualité Premium
            </h4>
            <p className="text-gray-600 text-sm">
              Produits testés dermatologiquement et certifiés
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❤️</span>
            </div>
            <h4 className="font-semibold text-lg text-gray-800 mb-2">
              Satisfaction Client
            </h4>
            <p className="text-gray-600 text-sm">
              Service client exceptionnel et accompagnement personnalisé
            </p>
          </div>
        </div>
      </Card>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card padding="md" className="text-center">
          <p className="text-4xl font-bold text-primary-500 mb-2">500+</p>
          <p className="text-gray-600 text-sm">Clientes Satisfaites</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-4xl font-bold text-primary-500 mb-2">4+</p>
          <p className="text-gray-600 text-sm">Produits Premium</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-4xl font-bold text-primary-500 mb-2">4.9★</p>
          <p className="text-gray-600 text-sm">Note Moyenne</p>
        </Card>
      </div>
    </>
  );
};
