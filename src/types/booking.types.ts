export interface IBooking {
    id: string; // Booking Code (Mã đặt chỗ)
    customerName: string;
    cccd: string; // CCCD
    phone: string; // Số điện thoại
    movieTitle: string; // Tên phim
    moviePoster?: string;
    showtime: string; // Giờ chiếu e.g. "2026-06-21 19:30"
    roomCode: string; // Mã phòng chiếu
    seats: string[]; // Vị trí ghế
    originalPrice: number; // Giá vé gốc
    surcharge: number; // Phụ phí
    totalPrice: number; // Tổng tiền
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'; // Trạng thái
    memberId: string;
    memberPoints: number; // Điểm thành viên khả dụng
}

export interface IInvoice {
    invoiceId: string;
    bookingId: string;
    movieTitle: string;
    roomCode: string;
    seats: string[];
    amountCollected: number;
    pointsUsed: number;
    pointsEarned: number;
    newPointsBalance: number;
}
