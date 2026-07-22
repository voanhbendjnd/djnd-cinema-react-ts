import axiosClient from '@/services/axiosClient';

export interface TransactionHistoryDTO {
    ticketId: number;
    reason: string;
}

export interface TicketRefundInfo {
    ticketId: number;
    ticketCode: string;
    movieTitle: string;
    seatPosition: string;
    showtime: string;
    originalAmount: number;
    refundAmount: number;
    bookingCode: string;
    customerEmail: string;
}

export const refundService = {
    // Get ticket info for refund
    getTicketForRefund: (ticketId: number) =>
        axiosClient.get<TicketRefundInfo>(`/api/v1/tickets/${ticketId}/refund-info`),

    // Process refund
    processRefund: (data: TransactionHistoryDTO) =>
        axiosClient.post('/api/v1/bookings/refund', data),
};