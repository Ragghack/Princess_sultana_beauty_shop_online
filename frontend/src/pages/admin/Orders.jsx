import React, { useState, useEffect } from "react";
import { FiEye, FiFilter } from "react-icons/fi";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import api from "../../services/api";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }
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
      FAILED: "danger",
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
      FAILED: "Échouée",
    };
    return labels[status] || status;
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement des commandes..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-gray-800">
          Commandes
        </h1>
      </div>

      {/* Filters */}
      <Card padding="lg">
        <div className="flex items-center gap-4">
          <FiFilter className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-primary-300 focus:outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmées</option>
            <option value="PROCESSING">En préparation</option>
            <option value="ASSIGNED">Assignées</option>
            <option value="OUT_FOR_DELIVERY">En livraison</option>
            <option value="DELIVERED">Livrées</option>
            <option value="CANCELLED">Annulées</option>
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card padding="lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  N° Commande
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Client
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Montant
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Paiement
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-800">
                      {order.user?.firstName} {order.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{order.user?.phone}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-primary-500">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        order.paymentStatus === "COMPLETED"
                          ? "success"
                          : order.paymentStatus === "FAILED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {order.paymentMethod}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getStatusBadge(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <button className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg">
                      <FiEye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucune commande trouvée
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Orders;
