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
import HomePage from "@/pages/user/home/page.tsx";
import HomeLayout from "@/pages/user/layout.tsx";
import AccountInfoPage from "@/pages/user/profile/page.tsx";
import ShowtimePriceManagement from "@/pages/admin/showtime-price/showtime.price.management.tsx";
import VNPayReturnPage from "@/pages/user/payment/vnpay-return.tsx";
import MovieListPage from "@/pages/user/movies/movie.list.page.tsx";
import MovieDetail from "@/pages/user/home/movieDetails/MovieDetailPage.tsx";
import PromotionManagement from "@/pages/admin/promotion/promotion.management.tsx";
import POSBookingPage from "@/pages/admin/booking/pos.booking.tsx";
import BookingManagement from "@/pages/admin/booking/booking.management.tsx";
import BookingDetail from "@/pages/admin/booking/booking.detail.tsx";

const AppRoutes: React.FC = () => {
    const { isAuthenticated, role } = useAuthStore();

    return (
        <Routes>
            <Route element={<AuthLayout />}>
                <Route
                    path="/login"
                    element={
                        isAuthenticated
                            ? role === 'ROLE_ADMIN'
                                ? <Navigate to="/admin/employees" replace />
                                : role === 'ROLE_MANAGER'
                                    ? <Navigate to="/manager/movies" replace />
                                    : <Navigate to="/" replace />
                            : <Login />
                    }
                />
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
                    <Route path="/admin/ticket-lookup" element={<TicketLookup />} />
                    <Route path="/admin/movies" element={<MovieManagement />} />
                    <Route path="/admin/showtime/price" element={<ShowtimePriceManagement />} />
                    <Route path="/admin/promotions" element={<PromotionManagement />} />


                    <Route path="/admin/rooms" element={<RoomManagement />} />
                    <Route path="/admin/movies/:id" element={<MovieDetailPage />} />
                    <Route path="/admin/rooms/:id" element={<RoomDetailPage />} />

                    <Route path="/admin/bookings" element={<BookingManagement />} />
                    <Route path="/admin/bookings/:id" element={<BookingDetail />} />

                </Route>
            </Route>
            <Route element={<ProtectedRoute requiredRole="ROLE_MANAGER" />}>
                <Route element={<AdminLayout />}>
                    <Route path="/manager" element={<Navigate to="/manager/movies" replace />} />
                    <Route path="/manager/ticket-lookup" element={<TicketLookup />} />
                    <Route path="/manager/movies" element={<MovieManagement />} />
                    <Route path="/manager/rooms" element={<RoomManagement />} />
                    <Route path="/manager/showtime/price" element={<ShowtimePriceManagement />} />
                    <Route path="/manager/promotions" element={<PromotionManagement />} />


                    <Route path="/manager/movies/:id" element={<MovieDetailPage />} />
                    <Route path="/manager/rooms/:id" element={<RoomDetailPage />} />
                    <Route path="/manager/bookings" element={<BookingManagement />} />
                    <Route path="/manager/bookings/:id" element={<BookingDetail />} />


                </Route>
            </Route>

            {/* Shared POS booking and ticket lookup routes for Admin, Manager, and Staff */}
            <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']} />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin/booking" element={<POSBookingPage />} />
                    <Route path="/manager/booking" element={<POSBookingPage />} />
                    <Route path="/staff/booking" element={<POSBookingPage />} />
                    <Route path="/staff/ticket-lookup" element={<TicketLookup />} />
                </Route>
            </Route>

            <Route element={<HomeLayout />}>
                <Route path="/payment-result" element={<VNPayReturnPage />} />

                <Route path="/" element={<HomePage />} />
                {/* [2026-06-27] Route trang danh sách phim — nút Movie / MOVIES */}
                <Route path="/movies" element={<MovieListPage />} />
                <Route
                    path="/movies/:slug"
                    element={<MovieDetail />}
                />
            </Route>


            <Route element={<ProtectedRoute requiredRole="ROLE_CUSTOMER" />}>
                <Route element={<HomeLayout />} >
                    <Route path="/profile" element={<AccountInfoPage/>}/>
                </Route>
            </Route>

            {/* Redirect all unknown to login or home */}
            {/*  <Route*/}
            {/*      path="/"*/}
            {/*      element={*/}
            {/*          !isAuthenticated*/}
            {/*              ? <HomePage />*/}
            {/*              : role === 'ROLE_ADMIN'*/}
            {/*                  ? <Navigate to="/admin/employees" replace />*/}
            {/*                  : role === 'ROLE_MANAGER'*/}
            {/*                      ? <Navigate to="/manager/movies" replace />*/}
            {/*                      : <HomePage />*/}
            {/*      }*/}
            {/*  />*/}
        </Routes>
    );
};

export default AppRoutes;
