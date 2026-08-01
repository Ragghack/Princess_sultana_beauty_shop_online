import React from "react";

export const Testimonial = () => {
  return (
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
              text: "Mes cheveux n'ont jamais été aussi beaux! Le beurre de chébé est magique.",
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
              <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
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
  );
};
