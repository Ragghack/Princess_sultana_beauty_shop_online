import { FiEye, FiFilter, FiMoreHorizontal, FiTrash2 } from "react-icons/fi";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { useOrders } from "../../hooks/useOrders";
import Pagination from "../../components/common/Pagination";

const Orders = () => {
  const {
    getStatusBadge,
    getStatusLabel,
    orders,
    loading,
    setStatusFilter,
    statusFilter,
    updateOrderStatus,
    handleDelete,
    totalPages,
    currentPage,
    getPageNumbers,
    goToPage,
    setCurrentPage,
    getValuesAbove,
    navigate,
  } = useOrders();

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
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
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
      <Card padding="lg" className="relative">
        <div className="overflow-x-auto relative">
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
                    <button
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                    >
                      <FiEye size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete("CANCELLED", order.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <FiTrash2 size={18} />
                    </button>
                    <div className="relative inline-block group">
                      <button className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg">
                        <FiMoreHorizontal size={18} />
                      </button>

                      <div className="absolute -left-32 -top-20 hidden group-hover:block mt-2 w-40 bg-white rounded-lg shadow-lg border">
                        {getValuesAbove(order.status).map((item, index) => (
                          <button
                            onClick={() =>
                              updateOrderStatus(item.status, order.id)
                            }
                            key={index}
                            className="py-2 px-4 hover:bg-gray-100 text-left rounded-lg block w-full"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
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

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              getPageNumbers={getPageNumbers}
              goToPage={goToPage}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default Orders;
