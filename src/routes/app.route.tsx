import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/protected.route.tsx';
import AuthLayout from '@/layouts/auth.layout.tsx';
import AdminLayout from '@/layouts/admin.layout.tsx';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import EmployeeManagement from '@/pages/admin/user/employee.management.tsx';
import MovieManagement from '@/pages/admin/movie/movie.management.tsx';
import { useAuthStore } from '@/store/useAuthStore';
import ActivateAccount from "@/pages/account/activated.account.tsx";
import ResetPasswordFinish from "@/pages/account/reset.passowrd.finish.tsx";
import MovieDetailPage from "@/pages/admin/movie/movie.detail.tsx";
import RoomManagement from "@/pages/admin/room/room.management.tsx";
import RoomDetailPage from "@/pages/admin/room/room.detail.page.tsx";
import CustomerManagement from "@/pages/admin/user/customer.management.tsx";
import RoleManagement from "@/pages/admin/role/role.management.tsx";
import PermissionManagement from "@/pages/admin/permission/permission.management.tsx";
import TicketLookup from '@/pages/admin/ticket-lookup';

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
          <Route path="/admin" element={<Navigate to="/admin/employees" replace />} />
          <Route path="/admin/employees" element={<EmployeeManagement />} />

            <Route path="/admin/customers" element={<CustomerManagement />} />
            <Route path="/admin/roles" element={<RoleManagement />} />
            <Route path="/admin/permissions" element={<PermissionManagement />} />
            <Route path="/manager/ticket-lookup" element={<TicketLookup />} />
            <Route path="/manager/movies" element={<MovieManagement />} />
            <Route path="/manager/rooms" element={<RoomManagement />} />
            <Route path="/manager/movies/:id" element={<MovieDetailPage />} />
            <Route path="/manager/rooms/:id" element={<RoomDetailPage />} />

        </Route>
      </Route>
        <Route element={<ProtectedRoute requiredRole="ROLE_MANAGER" />}>
            <Route element={<AdminLayout />}>
                <Route path="/manager" element={<Navigate to="/manager/movies" replace />} />
                <Route path="/manager/ticket-lookup" element={<TicketLookup />} />
                <Route path="/manager/movies" element={<MovieManagement />} />
                <Route path="/manager/rooms" element={<RoomManagement />} />
                <Route path="/manager/movies/:id" element={<MovieDetailPage />} />
                <Route path="/manager/rooms/:id" element={<RoomDetailPage />} />

            </Route>
        </Route>

      {/* Redirect all unknown to login or home */}
      <Route 
        path="*" 
        element={
          isAuthenticated 
            ? (role === 'ROLE_ADMIN' ? <Navigate to="/admin/employees" />  : role === 'ROLE_MANAGER' ?  <Navigate to="/manager/movies" /> : <div>Home Page For User</div>)
            : <Navigate to="/login" />
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
