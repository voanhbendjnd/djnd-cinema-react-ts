
import axiosClient from '@/services/axiosClient';
import type { IBooking, IInvoice } from '@/types/booking.types';
// Nếu dự án có IBackendRes và IModelPaginate, hãy import vào đây. Ví dụ:
// import type { IBackendRes, IModelPaginate } from '@/types/common.types';

export const bookingService = {
    // 1. Tìm kiếm và phân trang bookings list
    getBookings: async (params: { 
        current?: number; 
        pageSize?: number; 
        id?: string;
        cccd?: string;
        phone?: string;
        status?: string;
    }): Promise<IBackendRes<IModelPaginate<IBooking>>> => {
        // Spring Boot page bắt đầu từ 0
        const page = params.current ? params.current - 1 : 0; 
        const size = params.pageSize || 10;
        
        const searchParams = new URLSearchParams();
        searchParams.append('page', page.toString());
        searchParams.append('size', size.toString());
        
        if (params.id) searchParams.append('id', params.id);
        if (params.cccd) searchParams.append('cccd', params.cccd);
        if (params.phone) searchParams.append('phone', params.phone);
        if (params.status) searchParams.append('status', params.status);

        const response = await axiosClient.get(`/api/v1/admin/bookings?${searchParams.toString()}`);
        return response as unknown as IBackendRes<IModelPaginate<IBooking>>;
    },

    // 2. Lấy chi tiết 1 booking bằng ID
    getBookingById: async (id: string): Promise<IBackendRes<IBooking>> => {
        const response = await axiosClient.get(`/api/v1/admin/bookings/${id}`);
        return response as unknown as IBackendRes<IBooking>;
    },

    // 3. Xác nhận thanh toán & trừ điểm tích lũy
    confirmBooking: async (bookingId: string, pointsUsed: number): Promise<IBackendRes<IInvoice>> => {
        const payload = {
            bookingId: bookingId,
            pointsUsed: pointsUsed
        };

        const response = await axiosClient.post(`/api/v1/admin/bookings/confirm`, payload);
        return response as unknown as IBackendRes<IInvoice>;
    },

    // 4. Lấy danh sách phim chiếu hôm nay (nếu UI cần)
    getMoviesToday: async (): Promise<IBackendRes<any>> => { 
        const response = await axiosClient.get('/api/v1/admin/movies/today');
        return response as unknown as IBackendRes<any>;
    },

    // 5. Nhân viên tạo booking
    createBookingByStaff: async (payload: {
        showtimeId: number;
        seatIds: number[];
        paymentMethod: string;
        customerId?: number | null;
        isNotMember?: boolean;
    }): Promise<IBackendRes<any>> => {
        const response = await axiosClient.post('/api/v1/bookings/with-staff', payload);
        return response as unknown as IBackendRes<any>;
    },

    // 6. Tìm kiếm customer bằng email (dành cho POS)
    getCustomerByEmail: async (email: string): Promise<IBackendRes<any>> => {
        const response = await axiosClient.get(`/api/v1/bookings/customer-by-email?email=${encodeURIComponent(email)}`);
        return response as unknown as IBackendRes<any>;
    }
};