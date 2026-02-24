import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiPackage,
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiCalendar,
  FiTruck,
  FiCheck,
  FiX,
  FiClock,
  FiEdit,
  FiMessageCircle,
} from "react-icons/fi";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import api from "../../services/api";
import { notifyCustomerStatusUpdate } from "../../utils/whatsappHelper";

const VITE_APP_IMAGE_BASE_URL = import.meta.env.VITE_APP_IMAGE_BASE_URL;

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      alert("Erreur lors du chargement de la commande");
      navigate("/admin/orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    if (
      !window.confirm(`Changer le statut à "${getStatusLabel(newStatus)}" ?`)
    ) {
      return;
    }

    try {
      setUpdating(true);
      await api.patch(`/orders/${id}/status`, { status: newStatus });

      // Prepare WhatsApp notification data
      const whatsappOrder = {
        orderNumber: order.orderNumber,
        customerName: `${order.user.firstName} ${order.user.lastName}`,
        address: order.address,
      };

      // Open WhatsApp with status update message
      if (["CONFIRMED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(newStatus)) {
        notifyCustomerStatusUpdate(whatsappOrder, newStatus, order.user.phone);
      }

      // Refresh order data
      await fetchOrderDetails();
      alert("Statut mis à jour avec succès");
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: "warning",
      CONFIRMED: "info",
      PROCESSING: "info",
      ASSIGNED: "info",
      OUT_FOR_DELIVERY: "primary",
      DELIVERED: "success",
      CANCELLED: "danger",
      FAILED: "danger",
    };
    return badges[status] || "default";
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

  const getPaymentStatusBadge = (status) => {
    const badges = {
      PENDING: "warning",
      COMPLETED: "success",
      FAILED: "danger",
      REFUNDED: "info",
    };
    return badges[status] || "default";
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      CASH_ON_DELIVERY: "Paiement à la livraison",
      MOBILE_MONEY: "Mobile Money",
      ORANGE_MONEY: "Orange Money",
    };
    return labels[method] || method;
  };

  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["ASSIGNED", "CANCELLED"],
      ASSIGNED: ["OUT_FOR_DELIVERY", "CANCELLED"],
      OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
      DELIVERED: [],
      CANCELLED: [],
    };
    return statusFlow[currentStatus] || [];
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement de la commande..." />;
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Commande introuvable</p>
        <Button variant="primary" onClick={() => navigate("/admin/orders")}>
          Retour aux commandes
        </Button>
      </div>
    );
  }

  const nextStatuses = getNextStatuses(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/orders")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-800">
              Commande {order.orderNumber}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Créée le {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <Badge variant={getStatusBadge(order.status)} size="lg">
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card padding="lg">
            <h2 className="font-semibold text-xl text-gray-800 mb-4 flex items-center gap-2">
              <FiPackage className="text-primary-500" />
              Articles commandés ({order.items?.length})
            </h2>

            <div className="space-y-4">
              {order.items?.map((item) => {
                // Bundle item
                if (item.isBundle) {
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 border-2 border-primary-200 rounded-xl bg-primary-50"
                    >
                      {/* Bundle images grid */}
                      <div className="flex-shrink-0">
                        <div className="bg-white rounded-lg p-1">
                          <div
                            className={`grid gap-0.5 w-20 h-20 ${
                              item.bundleItems &&
                              JSON.parse(item.bundleItems).length === 1
                                ? "grid-cols-1"
                                : JSON.parse(item.bundleItems).length === 2
                                  ? "grid-cols-2"
                                  : JSON.parse(item.bundleItems).length === 3
                                    ? "grid-cols-3"
                                    : "grid-cols-2 grid-rows-2"
                            }`}
                          >
                            {item.bundleItems &&
                              JSON.parse(item.bundleItems)
                                .slice(0, 4)
                                .map((bundleItem, idx) => (
                                  <img
                                    key={idx}
                                    src={`${VITE_APP_IMAGE_BASE_URL}${bundleItem.productImage}`}
                                    alt={bundleItem.productName}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-primary-600 bg-primary-200 px-2 py-0.5 rounded">
                                BUNDLE
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-800">
                              {item.bundleName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Quantité: {item.quantity}
                            </p>

                            {/* Bundle contents */}
                            {item.bundleItems && (
                              <div className="mt-2 text-sm text-gray-600">
                                <p className="font-medium text-gray-700">
                                  Contient:
                                </p>
                                {JSON.parse(item.bundleItems).map(
                                  (bundleItem, idx) => (
                                    <p key={idx} className="ml-2">
                                      • {bundleItem.quantity}x{" "}
                                      {bundleItem.productName}
                                    </p>
                                  ),
                                )}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-gray-800">
                              {formatCurrency(item.subtotal)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(item.price)} × {item.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Regular product item
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border border-gray-200 rounded-xl"
                  >
                    <img
                      src={`${VITE_APP_IMAGE_BASE_URL}${item.productImage}`}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {item.productName}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            SKU: {item.productSku}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Quantité: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">
                            {formatCurrency(item.subtotal)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 mt-6 pt-6 space-y-3">
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
              <div className="flex justify-between text-xl font-bold text-gray-800 pt-3 border-t border-gray-200">
                <span>Total</span>
                <span className="text-primary-500">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </Card>

          {/* Status Timeline */}
          <Card padding="lg">
            <h2 className="font-semibold text-xl text-gray-800 mb-4 flex items-center gap-2">
              <FiClock className="text-primary-500" />
              Historique de la commande
            </h2>

            <div className="space-y-4">
              {order.statusHistory?.map((history, index) => (
                <div key={history.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === 0
                          ? "bg-primary-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <FiCheck size={18} />
                    </div>
                    {index < order.statusHistory.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800">
                        {getStatusLabel(history.status)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(history.createdAt)}
                      </p>
                    </div>
                    {history.notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        {history.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column - Customer & Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {nextStatuses.length > 0 && (
            <Card padding="lg">
              <h2 className="font-semibold text-lg text-gray-800 mb-4">
                Actions rapides
              </h2>
              <div className="space-y-2">
                {nextStatuses.map((status) => (
                  <Button
                    key={status}
                    variant={status === "CANCELLED" ? "danger" : "primary"}
                    fullWidth
                    onClick={() => updateOrderStatus(status)}
                    loading={updating}
                  >
                    <div className="flex justify-center items-center">
                      {status === "CANCELLED" ? <FiX /> : <FiCheck />}
                      <span className="ml-2">{getStatusLabel(status)}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {/* Customer Information */}
          <Card padding="lg">
            <h2 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <FiUser className="text-primary-500" />
              Client
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium text-gray-800">
                  {order.user?.firstName} {order.user?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <FiPhone size={14} /> Téléphone
                </p>
                <p className="font-medium text-gray-800">{order.user?.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <FiMail size={14} /> Email
                </p>
                <p className="font-medium text-gray-800">{order.user?.email}</p>
              </div>

              <Button
                variant="outline"
                fullWidth
                className="mt-4"
                onClick={() => {
                  const whatsappOrder = {
                    orderNumber: order.orderNumber,
                    customerName: `${order.user.firstName} ${order.user.lastName}`,
                    address: order.address,
                  };
                  notifyCustomerStatusUpdate(
                    whatsappOrder,
                    order.status,
                    order.user.phone,
                  );
                }}
              >
                <div className="flex items-center justify-center">
                  <FiMessageCircle />
                  <span className="ml-2">Contacter sur WhatsApp</span>
                </div>
              </Button>
            </div>
          </Card>

          {/* Delivery Address */}
          <Card padding="lg">
            <h2 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <FiMapPin className="text-primary-500" />
              Adresse de livraison
            </h2>
            <div className="space-y-2 text-gray-700">
              <p className="font-medium">{order.address?.fullName}</p>
              <p>{order.address?.street}</p>
              <p>
                {order.address?.city}, {order.address?.region}
              </p>
              {order.address?.postalCode && <p>{order.address.postalCode}</p>}
              {order.address?.landmark && (
                <p className="text-sm text-gray-600">
                  Point de repère: {order.address.landmark}
                </p>
              )}
              <p className="text-sm flex items-center gap-2 pt-2">
                <FiPhone size={14} />
                {order.address?.phone}
              </p>
            </div>

            {order.deliveryNotes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Notes de livraison</p>
                <p className="text-sm text-gray-700">{order.deliveryNotes}</p>
              </div>
            )}
          </Card>

          {/* Payment Information */}
          <Card padding="lg">
            <h2 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <FiCreditCard className="text-primary-500" />
              Paiement
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Méthode</p>
                <p className="font-medium text-gray-800">
                  {getPaymentMethodLabel(order.paymentMethod)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <Badge variant={getPaymentStatusBadge(order.paymentStatus)}>
                  {order.paymentStatus === "PENDING"
                    ? "En attente"
                    : order.paymentStatus === "COMPLETED"
                      ? "Payé"
                      : order.paymentStatus === "FAILED"
                        ? "Échoué"
                        : order.paymentStatus}
                </Badge>
              </div>
              {order.paymentReference && (
                <div>
                  <p className="text-sm text-gray-500">Référence</p>
                  <p className="font-medium text-gray-800">
                    {order.paymentReference}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Delivery Person (if assigned) */}
          {order.deliveryPersonnel && (
            <Card padding="lg">
              <h2 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <FiTruck className="text-primary-500" />
                Livreur
              </h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-800">
                  {order.deliveryPersonnel.firstName}{" "}
                  {order.deliveryPersonnel.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  {order.deliveryPersonnel.phone}
                </p>
                {order.deliveryPersonnel.deliveryZone && (
                  <p className="text-sm text-gray-600">
                    Zone: {order.deliveryPersonnel.deliveryZone}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
