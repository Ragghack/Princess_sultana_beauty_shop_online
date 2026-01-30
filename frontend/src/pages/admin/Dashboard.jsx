import React, { useState, useEffect } from "react";
import {
  FiShoppingBag,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiPackage,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Card from "@components/common/Card";
import Badge from "@components/common/Badge";
import { formatCurrency, formatDate } from "@utils/formatters";
import api from "@services/api";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/analytics/dashboard");
      setStats(response.data.stats);
      setRecentOrders(response.data.recentOrders);
      setSalesData(response.data.salesData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const statCards = [
    {
      title: "Total Commandes",
      value: stats.totalOrders,
      icon: <FiShoppingBag size={24} />,
      color: "from-primary-400 to-primary-600",
      change: "+12%",
    },
    {
      title: "Revenu Total",
      value: formatCurrency(stats.totalRevenue),
      icon: <FiDollarSign size={24} />,
      color: "from-green-400 to-green-600",
      change: "+8%",
    },
    {
      title: "Clients",
      value: stats.totalCustomers,
      icon: <FiUsers size={24} />,
      color: "from-blue-400 to-blue-600",
      change: "+15%",
    },
    {
      title: "En Attente",
      value: stats.pendingOrders,
      icon: <FiPackage size={24} />,
      color: "from-yellow-400 to-yellow-600",
      change: "-3%",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-gray-800">
          Tableau de Bord
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenue sur votre tableau de bord administrateur
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} padding="lg" variant="elevated">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {stat.value}
                </h3>
                <div className="flex items-center gap-1">
                  <FiTrendingUp size={14} className="text-green-500" />
                  <span className="text-sm text-green-600 font-medium">
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500">vs mois dernier</span>
                </div>
              </div>
              <div
                className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white`}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="lg" variant="elevated">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">
            Ventes Mensuelles
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#F4B8C5" name="Revenu" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="lg" variant="elevated">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">
            Tendance des Commandes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#F4B8C5"
                strokeWidth={2}
                name="Commandes"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card padding="lg" variant="elevated">
        <h3 className="font-semibold text-lg text-gray-800 mb-4">
          Commandes Récentes
        </h3>
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
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {order.user.firstName} {order.user.lastName}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-primary-500">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        order.status === "DELIVERED"
                          ? "success"
                          : order.status === "PENDING"
                            ? "warning"
                            : "primary"
                      }
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-primary-500 hover:text-primary-600 font-medium">
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
