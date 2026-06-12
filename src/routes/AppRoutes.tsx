import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import UserManagement from '../pages/admin/user/UserManagement.tsx';
import { useAuthStore } from '../store/useAuthStore';
import ActivateAccount from "../pages/account/activated.account.tsx";
import ResetPasswordFinish from "../pages/account/reset.passowrd.finish.tsx";

const AppRoutes: React.FC = () => {
  const { isAuthenticated, role } = useAuthStore();

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
          <Route
              path="/account/activate"
              element={<ActivateAccount />}
          />
          <Route
              path="/account/reset/finish"
              element={<ResetPasswordFinish/>}
          />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute requiredRole="ROLE_ADMIN" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Route>
      </Route>

      {/* Redirect all unknown to login or home */}
      <Route 
        path="*" 
        element={
          isAuthenticated 
            ? (role === 'ROLE_ADMIN' ? <Navigate to="/admin/users" /> : <div>Home Page For User</div>) 
            : <Navigate to="/login" />
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
