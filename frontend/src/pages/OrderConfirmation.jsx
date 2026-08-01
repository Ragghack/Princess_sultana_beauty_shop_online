import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiCheckCircle, FiPrinter, FiShoppingBag } from "react-icons/fi";
import api from "../services/api";
import Card from "@components/common/Card";
import Button from "@components/common/Button";
import { formatCurrency, formatDateTime } from "@utils/formatters";
import { PAYMENT_METHODS, ORDER_STATUS } from "@utils/constants";

const paymentMethodLabel = (id) =>
  PAYMENT_METHODS.find((m) => m.id === id)?.name || id;

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/orders/${orderId}`);
        if (isMounted) setOrder(response.data.data);
      } catch (err) {
        console.error("Failed to fetch order:", err);
        if (isMounted) {
          setError(
            err.response?.status === 404
              ? "Commande introuvable."
              : "Impossible de charger votre reçu pour le moment.",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 to-primary-50">
        <p className="text-gray-600">Chargement de votre reçu...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-700 mb-6">
            {error || "Commande introuvable."}
          </p>
          <Link to="/shop">
            <Button variant="primary">Retour à la boutique</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12 print:bg-white print:py-0">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success banner */}
          <div className="text-center mb-8 print:hidden">
            <div className="text-6xl mb-4">
              <FiCheckCircle className="inline text-green-500" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-gray-800 mb-2">
              Commande Confirmée !
            </h1>
            <p className="text-gray-600">
              Merci pour votre confiance. Voici votre reçu.
            </p>
          </div>

          {/* Receipt */}
          <Card padding="lg" className="print:shadow-none print:border-none">
            <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-800">
                  Princesse Sultana
                </h2>
                <p className="text-sm text-gray-500">Reçu de commande</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">
                  #{order.orderNumber}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
            </div>

            {/* Status + payment */}
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm mb-6">
              <div>
                <span className="text-gray-500">Statut : </span>
                <span className="font-medium text-gray-800">
                  {ORDER_STATUS[order.status] || order.status}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Paiement : </span>
                <span className="font-medium text-gray-800">
                  {paymentMethodLabel(order.paymentMethod)}
                </span>
              </div>
            </div>

            {/* Customer & delivery address */}
            {order.address && (
              <div className="mb-6 text-sm">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Livraison
                </h3>
                <p className="text-gray-600">{order.address.fullName}</p>
                <p className="text-gray-600">{order.address.phone}</p>
                <p className="text-gray-600">
                  {order.address.street}, {order.address.city},{" "}
                  {order.address.region}
                </p>
                {order.address.landmark && (
                  <p className="text-gray-500">
                    Point de repère : {order.address.landmark}
                  </p>
                )}
              </div>
            )}

            {/* Items */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Articles</h3>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start text-sm"
                  >
                    <div className="flex-1 pr-4">
                      <p className="font-medium text-gray-800">
                        {item.productName}
                      </p>
                      <p className="text-gray-500">
                        Qté: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-medium text-gray-800 whitespace-nowrap">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-primary-500">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 print:hidden">
            <Button
              variant="outline"
              fullWidth
              icon={<FiPrinter />}
              onClick={() => window.print()}
            >
              Imprimer le reçu
            </Button>
            <Link to="/shop" className="flex-1">
              <Button variant="primary" fullWidth icon={<FiShoppingBag />}>
                Continuer mes achats
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;