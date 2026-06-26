import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  requiredRole?: string;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, allowedRoles }) => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Nếu có yêu cầu role mà không khớp, cho ra trang báo lỗi hoặc home
    return <Navigate to="/" replace />; // Tạm cho ra login
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    // Nếu có danh sách role được cho phép mà role hiện tại không khớp
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
