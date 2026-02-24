import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiShoppingBag,
  FiPackage,
  FiTruck,
  FiCheckCircle,
} from "react-icons/fi";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatCurrency, formatDate } from "../../utils/formatters";
import api from "../../services/api";

const AccountOverview = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const ordersResponse = await api.get("/orders?limit=5");
      const orders = ordersResponse.data.data.orders || [];

      setRecentOrders(orders);

      // Calculate stats
      const allOrdersResponse = await api.get("/orders?limit=1000");
      const allOrders = allOrdersResponse.data.data.orders || [];

      setStats({
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter(
          (o) => o.status === "PENDING" || o.status === "CONFIRMED",
        ).length,
        deliveredOrders: allOrders.filter((o) => o.status === "DELIVERED")
          .length,
        totalSpent: allOrders
          .filter((o) => o.paymentStatus === "COMPLETED")
          .reduce((sum, o) => sum + parseFloat(o.total), 0),
      });
    } catch (error) {
      console.error("Failed to fetch account data:", error);
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
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Commandes</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {stats.totalOrders}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-300 to-primary-500 rounded-xl flex items-center justify-center">
              <FiShoppingBag className="text-white" size={24} />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">En Cours</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {stats.pendingOrders}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
              <FiPackage className="text-white" size={24} />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Livrées</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {stats.deliveredOrders}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <FiCheckCircle className="text-white" size={24} />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Dépensé</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.totalSpent)}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <FiTruck className="text-white" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card padding="lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-2xl font-bold text-gray-800">
            Commandes Récentes
          </h2>
          <Link to="/account/orders">
            <Button variant="outline" size="sm">
              Voir Tout
            </Button>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <FiShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">
              Vous n'avez pas encore de commandes
            </p>
            <Link to="/shop">
              <Button variant="primary">Commencer mes achats</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="border-2 border-gray-100 rounded-xl p-4 hover:border-primary-200 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-semibold text-gray-800 mb-1">
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

                    <Link to={`/account/orders`}>
                      <Button variant="ghost" size="sm">
                        Détails
                      </Button>
                    </Link>
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

export default AccountOverview;
