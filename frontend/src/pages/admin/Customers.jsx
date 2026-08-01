import React, { useState, useEffect } from "react";
import {
  FiMail,
  FiPhone,
  FiCalendar,
  FiChevronRight,
  FiChevronLeft,
} from "react-icons/fi";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        role: "CUSTOMER",
      };
      const response = await api.get("/users", { params });
      const statResponse = await api.get("/users/customers");
      const customerStat = statResponse.data.data.customers;
      setCustomers(response.data.data.users || []);
      setTotalPages(response.data.data.pagination?.page || 1);
      setTotalCustomers(response.data.data.pagination?.total || 0);

      setStats({
        totalCustomers: customerStat?.length,
        activeCustomers: customerStat?.filter((c) => c.status === "ACTIVE")
          .length,
        newThisMonth: customerStat?.filter((c) => {
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

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const totalSpent = (orders) => {
    console.log(orders.filter((order) => order.paymentStatus === "COMPLETED"));
    orders
      .filter((order) => order.paymentStatus === "COMPLETED")
      .reduce((accumulator, currentValue) => {
        return formatCurrency(
          accumulator + parseFloat(currentValue.total, 10) || 0,
        );
      }, 0);
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
              {customers.length > 0 &&
                customers.map((customer) => (
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
                        {customer.orders.length}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-primary-500">
                      {/* {formatCurrency(customer.totalSpent || 0)} */}
                      {totalSpent(customer.orders)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                {Math.min(currentPage * itemsPerPage, totalCustomers)} sur{" "}
                {totalCustomers} produits
              </div>

              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border-2 ${
                    currentPage === 1
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FiChevronLeft size={20} />
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg border-2 font-medium ${
                            currentPage === page
                              ? "border-primary-500 bg-primary-500 text-white"
                              : "border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 py-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border-2 ${
                    currentPage === totalPages
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Customers;
