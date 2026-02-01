import React, { useState, useEffect } from "react";
import { FiMail, FiPhone, FiCalendar } from "react-icons/fi";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatDate, formatCurrency } from "../../utils/formatters";
import api from "../../services/api";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newThisMonth: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Simulated data - replace with actual API call
      // const response = await api.get('/users?role=CUSTOMER');

      // Mock data for demonstration
      const mockCustomers = [
        {
          id: "1",
          firstName: "Grace",
          lastName: "Nkolo",
          email: "grace.nkolo@example.com",
          phone: "+237 670 00 00 04",
          status: "ACTIVE",
          createdAt: "2024-01-15T10:00:00Z",
          totalOrders: 5,
          totalSpent: 125000,
        },
        {
          id: "2",
          firstName: "Aminata",
          lastName: "Diop",
          email: "aminata.diop@example.com",
          phone: "+237 670 00 00 05",
          status: "ACTIVE",
          createdAt: "2024-02-20T14:30:00Z",
          totalOrders: 3,
          totalSpent: 78000,
        },
        {
          id: "3",
          firstName: "Marie",
          lastName: "Kamga",
          email: "marie.k@example.com",
          phone: "+237 670 00 00 06",
          status: "ACTIVE",
          createdAt: "2024-03-10T09:15:00Z",
          totalOrders: 8,
          totalSpent: 215000,
        },
      ];

      setCustomers(mockCustomers);
      setStats({
        totalCustomers: mockCustomers.length,
        activeCustomers: mockCustomers.filter((c) => c.status === "ACTIVE")
          .length,
        newThisMonth: mockCustomers.filter((c) => {
          const createdDate = new Date(c.createdAt);
          const now = new Date();
          return (
            createdDate.getMonth() === now.getMonth() &&
            createdDate.getFullYear() === now.getFullYear()
          );
        }).length,
      });
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement des clients..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-gray-800">Clients</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Clients</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {stats.totalCustomers}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-300 to-primary-500 rounded-xl flex items-center justify-center text-white">
              👥
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Clients Actifs</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {stats.activeCustomers}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white">
              ✓
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Nouveaux ce mois</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {stats.newThisMonth}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white">
              ✨
            </div>
          </div>
        </Card>
      </div>

      {/* Customers Table */}
      <Card padding="lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Client
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Contact
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Date d'inscription
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Commandes
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Total dépensé
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-300 to-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {customer.firstName.charAt(0)}
                        {customer.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {customer.firstName} {customer.lastName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <FiMail size={14} />
                        {customer.email}
                      </p>
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <FiPhone size={14} />
                        {customer.phone}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <FiCalendar size={14} />
                      {formatDate(customer.createdAt)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-gray-800">
                      {customer.totalOrders}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-primary-500">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        customer.status === "ACTIVE" ? "success" : "warning"
                      }
                    >
                      {customer.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {customers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucun client trouvé
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Customers;
