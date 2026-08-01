import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [limit] = useState(12);

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { limit, page: currentPage };
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }
      const response = await api.get("/orders", { params });
      setOrders(response.data.data.orders || []);

      // Set pagination info from backend response
      if (response.data.data.pagination) {
        setTotalPages(response.data.data.pagination.pages);
        setTotalOrders(response.data.data.pagination.total);
      } else if (response.data.pagination) {
        setTotalPages(response.data.pagination.pages);
        setTotalOrders(response.data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (status, id) => {
    try {
      const response = await api.patch(`/orders/${id}/status`, { status });
      alert(response.data.message);
      fetchOrders();
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  const handleDelete = async (status, id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette commande?")) {
      try {
        await api.patch(`/orders/${id}/status`, { status });
        fetchOrders();
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Erreur lors de la suppression");
      }
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

  const orderStatus = [
    { status: "PENDING", label: "En attentes", priority: 0 },
    { status: "CONFIRMED", label: "Confirmées", priority: 1 },
    { status: "PROCESSING", label: "En préparation", priority: 2 },
    { status: "OUT_FOR_DELIVERY", label: "En livraison", priority: 3 },
    { status: "DELIVERED", label: "Livrées", priority: 4 },
  ];

  const getValuesAbove = (value) => {
    const index = orderStatus.findIndex((item) => item.status === value);
    if (index === -1) return [];
    return orderStatus.slice(index + 1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return {
    getStatusBadge,
    getStatusLabel,
    orders,
    loading,
    setStatusFilter,
    statusFilter,
    updateOrderStatus,
    orderStatus,
    handleDelete,
    totalPages,
    totalOrders,
    currentPage,
    getPageNumbers,
    goToPage,
    setCurrentPage,
    getValuesAbove,
    navigate,
  };
};
