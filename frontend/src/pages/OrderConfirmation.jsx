import React from "react";
import { useParams } from "react-router-dom";

const OrderConfirmation = () => {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 shadow-soft">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="font-serif text-3xl font-bold text-gray-800 mb-4">
              Commande Confirmée!
            </h1>
            <p className="text-gray-600 mb-4">
              Votre commande #{orderId} a été reçue avec succès.
            </p>
            <p className="text-gray-600">
              Vous recevrez un email de confirmation sous peu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
