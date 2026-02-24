import React, { useState, useEffect } from "react";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency, formatDate } from "../../utils/formatters";
import api from "../../services/api";

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    assigned: 0,
    outForDelivery: 0,
    delivered: 0,
    todayEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ASSIGNED");

  useEffect(() => {
    fetchDeliveries();
  }, [filter]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const params = { status: filter };
      const response = await api.get("/orders", { params });
      const deliveryOrders = response.data.data.orders || [];

      setOrders(deliveryOrders);

      // Calculate stats
      const allResponse = await api.get("/orders");
      const allOrders = allResponse.data.data.orders || [];

      const today = new Date().toDateString();
      const todayDeliveries = allOrders.filter(
        (o) =>
          o.status === "DELIVERED" &&
          new Date(o.deliveredAt).toDateString() === today,
      );

      setStats({
        assigned: allOrders.filter((o) => o.status === "ASSIGNED").length,
        outForDelivery: allOrders.filter((o) => o.status === "OUT_FOR_DELIVERY")
          .length,
        delivered: allOrders.filter((o) => o.status === "DELIVERED").length,
        todayEarnings: todayDeliveries.reduce(
          (sum, o) => sum + parseFloat(o.deliveryFee),
          0,
        ),
      });
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      if (newStatus === "DELIVERED") {
        await api.patch(`/orders/${orderId}/mark-delivered`);
      } else {
        await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      }
      fetchDeliveries();
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl font-bold text-gray-800 mb-2">
          Tableau de Bord Livreur
        </h1>
        <p className="text-gray-600">Gérez vos livraisons en cours</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Assignées</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {stats.assigned}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-white">
              <FiPackage size={24} />
            </div>
          </div>
        </Card>
        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">En Livraison</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {stats.outForDelivery}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white">
              <FiTruck size={24} />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Livrées</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {stats.delivered}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white">
              <FiCheckCircle size={24} />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Gains Aujourd'hui</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.todayEarnings)}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl">
              💰
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="lg">
        <div className="flex flex-wrap gap-2">
          {["ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === status
                  ? "bg-gradient-to-r from-primary-300 to-primary-400 text-white shadow-soft"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {status === "ASSIGNED" && "Assignées"}
              {status === "OUT_FOR_DELIVERY" && "En Livraison"}
              {status === "DELIVERED" && "Livrées"}
            </button>
          ))}
        </div>
      </Card>

      {/* Orders List */}
      <div className="grid gap-6">
        {orders.length === 0 ? (
          <Card padding="lg">
            <div className="text-center py-12">
              <FiPackage size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">
                Aucune livraison{" "}
                {filter === "ASSIGNED"
                  ? "assignée"
                  : filter === "OUT_FOR_DELIVERY"
                    ? "en cours"
                    : "complétée"}
              </p>
            </div>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} padding="lg">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Order Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-xl text-gray-800 mb-1">
                        Commande #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge variant="primary">
                      {formatCurrency(order.total)}
                    </Badge>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <FiPhone size={16} />
                      Client
                    </h4>
                    <p className="text-gray-700">
                      {order.user?.firstName} {order.user?.lastName}
                    </p>
                    <a
                      href={`tel:${order.address?.phone}`}
                      className="text-primary-500 hover:text-primary-600 font-medium"
                    >
                      {order.address?.phone}
                    </a>
                  </div>

                  {/* Delivery Address */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <FiMapPin size={16} />
                      Adresse de Livraison
                    </h4>
                    <p className="text-gray-700">{order.address?.street}</p>
                    <p className="text-gray-700">
                      {order.address?.city}, {order.address?.region}
                    </p>
                    {order.address?.landmark && (
                      <p className="text-gray-500 text-sm italic mt-1">
                        Repère: {order.address.landmark}
                      </p>
                    )}
                  </div>

                  {/* Delivery Notes */}
                  {order.deliveryNotes && (
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Notes de Livraison
                      </h4>
                      <p className="text-gray-700">{order.deliveryNotes}</p>
                    </div>
                  )}

                  {/* Payment Info */}
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        order.paymentMethod === "CASH_ON_DELIVERY"
                          ? "warning"
                          : "success"
                      }
                    >
                      {order.paymentMethod === "CASH_ON_DELIVERY"
                        ? "💵 COD"
                        : "✓ Payé"}
                    </Badge>
                    {order.paymentMethod === "CASH_ON_DELIVERY" && (
                      <span className="text-gray-600">
                        À collecter: {formatCurrency(order.total)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 md:w-48">
                  {filter === "ASSIGNED" && (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() =>
                        handleUpdateStatus(order.id, "OUT_FOR_DELIVERY")
                      }
                    >
                      Démarrer Livraison
                    </Button>
                  )}

                  {filter === "OUT_FOR_DELIVERY" && (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                    >
                      Marquer Livrée
                    </Button>
                  )}

                  <a href={`tel:${order.address?.phone}`}>
                    <Button variant="outline" fullWidth icon={<FiPhone />}>
                      Appeler
                    </Button>
                  </a>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${order.address?.street}, ${order.address?.city}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" fullWidth icon={<FiMapPin />}>
                      Navigation
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
export default DeliveryDashboard;
