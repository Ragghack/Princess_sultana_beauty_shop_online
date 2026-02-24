import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/common/LoadingSpinner";

const DeliveryRoute = ({ children }) => {
  const { user, loading, isDelivery } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isDelivery) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default DeliveryRoute;
