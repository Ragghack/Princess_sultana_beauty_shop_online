import React, { useState, useEffect } from "react";
import { FiPackage } from "react-icons/fi";
import Card from "../common/Card";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatCurrency, formatDate } from "../../utils/formatters";
import api from "../../services/api";
const VITE_APP_IMAGE_BASE_URL = import.meta.env.VITE_APP_IMAGE_BASE_URL;

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== "ALL" ? { status: filter } : {};
      const response = await api.get("/orders", { params });
      setOrders(response.data.data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: "warning",
      CONFIRMED: "info",
      PROCESSING: "info",
      ASSIGNED: "primary",
      OUT_FOR_DELIVERY: "primary",
      DELIVERED: "success",
      CANCELLED: "danger",
    };
    return variants[status] || "primary";
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: "En attente",
      CONFIRMED: "Confirmée",
      PROCESSING: "En préparation",
      ASSIGNED: "Assignée",
      OUT_FOR_DELIVERY: "En livraison",
      DELIVERED: "Livrée",
      CANCELLED: "Annulée",
    };
    return labels[status] || status;
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <h2 className="font-serif text-2xl font-bold text-gray-800 mb-6">
          Historique des Commandes
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            "ALL",
            "PENDING",
            "CONFIRMED",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED",
          ].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === status
                  ? "bg-gradient-to-r from-primary-300 to-primary-400 text-white shadow-soft"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {status === "ALL" ? "Tous" : getStatusLabel(status)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <FiPackage size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border-2 border-gray-100 rounded-xl overflow-hidden hover:border-primary-200 transition-colors"
              >
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">
                      Commande #{order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-bold text-primary-500">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                    <Badge variant={getStatusBadge(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <img
                          src={`${VITE_APP_IMAGE_BASE_URL}${item.productImage}`}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {item.productName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Quantité: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-800">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrderHistory;
