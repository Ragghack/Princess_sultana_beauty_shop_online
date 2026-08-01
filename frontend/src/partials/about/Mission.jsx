import React from "react";
import Card from "../../components/common/Card";
import HeroImage from "../../assets/images/image2.jfif";

export const Mission = () => {
  return (
    <>
      <div className="mb-12 rounded-3xl overflow-hidden shadow-soft-lg">
        <img
          // src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=600&fit=crop"
          src={HeroImage}
          alt="Princesse Sultana"
          className="w-full h-96 object-cover"
        />
      </div>

      {/* Story */}
      <Card padding="lg" className="mb-8">
        <h2 className="font-serif text-3xl font-bold text-gray-800 mb-6">
          Notre Histoire
        </h2>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <p>
            <strong className="text-primary-500">
              Princesse Sultana Hair Care
            </strong>{" "}
            est née d'une passion profonde pour la beauté naturelle des cheveux
            africains. Fondée en 2020 à Douala, notre marque s'est donnée pour
            mission de révolutionner les soins capillaires au Cameroun.
          </p>
          <p>
            Face au constat que de nombreuses femmes africaines luttaient pour
            trouver des produits adaptés à leurs cheveux naturels, nous avons
            décidé de créer une gamme complète de produits capillaires premium,
            formulés avec des ingrédients naturels et biologiques.
          </p>
          <p>
            Aujourd'hui, Princesse Sultana est devenue une référence en matière
            de soins capillaires naturels au Cameroun, avec des centaines de
            clientes satisfaites qui ont retrouvé la santé et la beauté de leurs
            cheveux.
          </p>
        </div>
      </Card>

      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card
          padding="lg"
          className="bg-gradient-to-br from-primary-50 to-primary-100"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-gray-800 mb-4">
              Notre Mission
            </h3>
            <p className="text-gray-600">
              Offrir des produits capillaires de qualité premium, 100% naturels,
              adaptés aux cheveux afro-texturés, pour permettre à chaque femme
              de sublimer sa beauté naturelle.
            </p>
          </div>
        </Card>

        <Card
          padding="lg"
          className="bg-gradient-to-br from-secondary-50 to-secondary-100"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✨</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-gray-800 mb-4">
              Notre Vision
            </h3>
            <p className="text-gray-600">
              Devenir la marque de référence en soins capillaires naturels en
              Afrique Centrale, tout en éduquant et accompagnant nos clientes
              dans leur parcours capillaire.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
};
