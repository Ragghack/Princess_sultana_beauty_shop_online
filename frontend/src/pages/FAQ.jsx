import React, { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import Card from "../components/common/Card";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: "Commandes & Livraison",
      questions: [
        {
          question: "Comment passer une commande?",
          answer:
            "Pour passer une commande, parcourez notre boutique, ajoutez les produits souhaités à votre panier, puis cliquez sur 'Passer la commande'. Vous devrez créer un compte ou vous connecter avant de finaliser votre achat.",
        },
        {
          question: "Quels sont les délais de livraison?",
          answer:
            "Nous livrons dans toute la ville de Douala en 24-48h. Pour les autres villes du Cameroun, le délai est de 3-5 jours ouvrables.",
        },
        {
          question: "Quels sont les frais de livraison?",
          answer:
            "Les frais de livraison sont fixes à 2000 XAF pour toutes les commandes à Douala. Pour les autres villes, les frais peuvent varier selon la destination.",
        },
        {
          question: "Puis-je suivre ma commande?",
          answer:
            "Oui! Une fois votre commande expédiée, vous recevrez un SMS et un email avec les informations de suivi. Vous pouvez également consulter l'état de votre commande dans votre compte.",
        },
      ],
    },
    {
      category: "Paiement",
      questions: [
        {
          question: "Quels modes de paiement acceptez-vous?",
          answer:
            "Nous acceptons Mobile Money, Orange Money et le paiement à la livraison (Cash on Delivery).",
        },
        {
          question: "Le paiement en ligne est-il sécurisé?",
          answer:
            "Oui, absolument! Toutes les transactions sont cryptées et sécurisées. Nous utilisons des passerelles de paiement certifiées pour garantir la sécurité de vos informations.",
        },
        {
          question: "Puis-je utiliser un code promo?",
          answer:
            "Oui! Entrez votre code promo lors du paiement dans le champ prévu à cet effet. La réduction sera automatiquement appliquée à votre commande.",
        },
      ],
    },
    {
      category: "Produits",
      questions: [
        {
          question: "Vos produits sont-ils 100% naturels?",
          answer:
            "Oui! Tous nos produits sont formulés avec des ingrédients naturels et biologiques. Nous ne utilisons pas de parabènes, sulfates ou silicones nocifs.",
        },
        {
          question: "Comment choisir le bon produit pour mes cheveux?",
          answer:
            "Chaque fiche produit contient des informations détaillées sur le type de cheveux recommandé. Vous pouvez également nous contacter pour des conseils personnalisés.",
        },
        {
          question: "Proposez-vous des échantillons?",
          answer:
            "Actuellement, nous n'offrons pas d'échantillons, mais nous proposons régulièrement des formats découverte à prix réduit.",
        },
        {
          question: "Quelle est la durée de conservation des produits?",
          answer:
            "Nos produits ont une durée de conservation de 12 à 24 mois selon le type. La date de péremption est indiquée sur chaque emballage.",
        },
      ],
    },
    {
      category: "Retours & Remboursements",
      questions: [
        {
          question: "Puis-je retourner un produit?",
          answer:
            "Oui, vous disposez de 14 jours pour retourner un produit non ouvert et dans son emballage d'origine. Les frais de retour sont à votre charge.",
        },
        {
          question: "Comment obtenir un remboursement?",
          answer:
            "Contactez notre service client avec votre numéro de commande. Une fois le retour approuvé, le remboursement sera effectué sous 5-7 jours ouvrables sur votre mode de paiement initial.",
        },
        {
          question: "Que faire si je reçois un produit endommagé?",
          answer:
            "Contactez-nous immédiatement avec des photos du produit endommagé. Nous procéderons à un remplacement gratuit ou un remboursement complet.",
        },
      ],
    },
    {
      category: "Compte Client",
      questions: [
        {
          question: "Dois-je créer un compte pour commander?",
          answer:
            "Oui, un compte est requis pour passer commande. Cela vous permet de suivre vos commandes, enregistrer vos adresses et gérer votre historique d'achats.",
        },
        {
          question: "Comment modifier mes informations personnelles?",
          answer:
            "Connectez-vous à votre compte, accédez à 'Mon Compte' puis 'Informations personnelles' pour modifier vos données.",
        },
        {
          question: "J'ai oublié mon mot de passe, que faire?",
          answer:
            "Cliquez sur 'Mot de passe oublié' sur la page de connexion. Vous recevrez un email avec un lien pour réinitialiser votre mot de passe.",
        },
      ],
    },
  ];

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Questions Fréquentes
            </h1>
            <p className="text-gray-600 text-lg">
              Trouvez des réponses à vos questions sur nos produits et services
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="font-serif text-2xl font-bold text-gray-800 mb-4">
                  {category.category}
                </h2>
                <div className="space-y-3">
                  {category.questions.map((faq, questionIndex) => {
                    const isOpen =
                      openIndex === `${categoryIndex}-${questionIndex}`;
                    return (
                      <Card
                        key={questionIndex}
                        padding="none"
                        className="overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            toggleQuestion(categoryIndex, questionIndex)
                          }
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-semibold text-left text-gray-800">
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <FiChevronUp
                              className="text-primary-500 flex-shrink-0 ml-4"
                              size={20}
                            />
                          ) : (
                            <FiChevronDown
                              className="text-gray-400 flex-shrink-0 ml-4"
                              size={20}
                            />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-4 text-gray-600 leading-relaxed animate-slide-down">
                            {faq.answer}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <Card
            padding="lg"
            className="mt-12 bg-gradient-to-r from-primary-50 to-secondary-50"
          >
            <div className="text-center">
              <h3 className="font-serif text-2xl font-bold text-gray-800 mb-4">
                Vous ne trouvez pas votre réponse?
              </h3>
              <p className="text-gray-600 mb-6">
                Notre équipe est là pour vous aider! Contactez-nous et nous vous
                répondrons dans les plus brefs délais.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/237XXXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 transition-colors"
                >
                  <span>💬</span> WhatsApp
                </a>
                <a
                  href="mailto:contact@princesse-sultana.cm"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-400 text-white rounded-full font-medium hover:bg-primary-500 transition-colors"
                >
                  <span>✉️</span> Email
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
