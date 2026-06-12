import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedRouteProps {
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Nếu có yêu cầu role mà không khớp, cho ra trang báo lỗi hoặc home
    return <Navigate to="/login" replace />; // Tạm cho ra login
  }

  return <Outlet />;
};

export default ProtectedRoute;
