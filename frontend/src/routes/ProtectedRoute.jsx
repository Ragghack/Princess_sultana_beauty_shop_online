import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import LoadingSpinner from "@components/common/LoadingSpinner";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
