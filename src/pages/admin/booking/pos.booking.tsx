'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Card,
    Select,
    Button,
    Radio,
    Input,
    Spin,
    Divider,
    Tag,
    Tooltip,
    Alert,
    notification,
    Modal,
    Space,
    Typography, ConfigProvider
} from 'antd';
import {
    ClockCircleOutlined,
    SearchOutlined,
    PrinterOutlined,
    CheckCircleOutlined,
    DollarOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { Client } from '@stomp/stompjs';
import axiosClient, { baseURL } from '@/services/axiosClient';
import { bookingService } from '@/services/booking.service';
import { useAuthStore } from "@/store/useAuthStore.ts";
import '@/styles/auth.css'; // Reuse auth background styles if appropriate
import '@/styles/pos-radio.css';
const { Option } = Select;
import enUS from 'antd/locale/en_US';

const { Title } = Typography;
import 'dayjs/locale/en';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface MoviePublish {
    id: number;
    title: string;
    duration: number;
    genre: string;
    thumbnailUrl?: string;
}

interface ShowtimeSchedule {
    showtimeId: number;
    startDateTime: string;
    endDateTime: string;
    roomId: number;
}

interface SeatLayoutDTO {
    id: number;
    seatRow: string;
    seatNo: number;
    type: 'STANDARD' | 'VIP' | 'SWEETBOX';
    status: string;
    bookingStatus: 'SOLD' | 'AVAILABLE';
    price?: number;
}

interface ResSeatAtRoomBookingDTO {
    seats: SeatLayoutDTO[];
    totalSeats: number;
    totalSoldSeats: number;
}

interface CustomerInfo {
    id: number;
    name: string;
    email: string;
    phone: string;
}

// ─────────────────────────────────────────────────────────────
// SEAT TYPE CONFIG
// ─────────────────────────────────────────────────────────────

const SEAT_TYPE_CONFIG: Record<string, { color: string; label: string; description: string }> = {
    STANDARD: {
        color: '#3b82f6',
        label: 'Standard',
        description: 'Regular seat',
    },
    VIP: {
        color: '#f59e0b',
        label: 'VIP',
        description: 'Premium comfort seat',
    },
    SWEETBOX: {
        color: '#ec4899',
        label: 'Sweet Box',
        description: 'Couple seat with extra space',
    },
};

// ─────────────────────────────────────────────────────────────
// BUILD DATE RANGE
// ─────────────────────────────────────────────────────────────

const buildDateRange = (): Dayjs[] => {
    const today = dayjs().startOf('day');
    const dow = today.day();
    const daysUntilSaturday = (6 - dow + 7) % 7;
    const nextSaturday = today.add(daysUntilSaturday, 'day');
    const endDate = nextSaturday.add(14, 'day');

    const dates: Dayjs[] = [];
    let cursor = today;
    while (cursor.isBefore(endDate) || cursor.isSame(endDate, 'day')) {
        dates.push(cursor);
        cursor = cursor.add(1, 'day');
    }
    return dates;
};

// ─────────────────────────────────────────────────────────────
// SEAT GRID COMPONENT
// ─────────────────────────────────────────────────────────────

const SeatGrid: React.FC<{
    seats: SeatLayoutDTO[];
    selectedSeats: number[];
    onSelectSeats: (seatIds: number[]) => void;
    loading?: boolean;
    onValidationError?: (message: string) => void;
}> = ({ seats, selectedSeats, onSelectSeats, loading, onValidationError }) => {
    const groupedByRow = useMemo(() => {
        const groups: Record<string, SeatLayoutDTO[]> = {};
        seats.forEach((seat) => {
            if (!groups[seat.seatRow]) {
                groups[seat.seatRow] = [];
            }
            groups[seat.seatRow].push(seat);
        });
        Object.keys(groups).forEach((row) => {
            groups[row].sort((a, b) => a.seatNo - b.seatNo);
        });
        return groups;
    }, [seats]);

    const findPairSeat = (seat: SeatLayoutDTO): SeatLayoutDTO | null => {
        if (seat.type !== 'SWEETBOX') return null;

        const sameRowSeats = seats.filter(s => s.seatRow === seat.seatRow);
        const currentNo = seat.seatNo;
        const pairNo = currentNo % 2 === 1 ? currentNo + 1 : currentNo - 1;

        return sameRowSeats.find(s => s.seatNo === pairNo) || null;
    };

    const checkSeatContinuity = (newSelectedSeats: number[]): { valid: boolean; message?: string } => {
        if (newSelectedSeats.length <= 1) return { valid: true };

        const groupByRow: Record<string, number[]> = {};
        newSelectedSeats.forEach((seatId) => {
            const seat = seats.find(s => s.id === seatId);
            if (!seat) return;

            if (!groupByRow[seat.seatRow]) {
                groupByRow[seat.seatRow] = [];
            }
            groupByRow[seat.seatRow].push(seat.seatNo);
        });

        for (const [row, seatNos] of Object.entries(groupByRow)) {
            const sorted = seatNos.sort((a, b) => a - b);
            for (let i = 0; i < sorted.length - 1; i++) {
                if (sorted[i + 1] - sorted[i] !== 1) {
                    const missingNo = sorted[i] + 1;
                    return {
                        valid: false,
                        message: `Seats must be continuous! Missing seat ${row}${missingNo} between ${row}${sorted[i]} and ${row}${sorted[i + 1]}.`,
                    };
                }
            }
        }
        return { valid: true };
    };

    const handleSeatClick = (seat: SeatLayoutDTO) => {
        const isCurrentlySelected = selectedSeats.includes(seat.id);
        let newSelectedSeats: number[];

        if (isCurrentlySelected) {
            newSelectedSeats = selectedSeats.filter(id => id !== seat.id);
            if (seat.type === 'SWEETBOX') {
                const pairSeat = findPairSeat(seat);
                if (pairSeat) {
                    newSelectedSeats = newSelectedSeats.filter(id => id !== pairSeat.id);
                }
            }
        } else {
            newSelectedSeats = [...selectedSeats, seat.id];
            if (seat.type === 'SWEETBOX') {
                const pairSeat = findPairSeat(seat);
                if (pairSeat && !newSelectedSeats.includes(pairSeat.id)) {
                    newSelectedSeats.push(pairSeat.id);
                }
            }
        }

        const continuityCheck = checkSeatContinuity(newSelectedSeats);
        if (!continuityCheck.valid) {
            onValidationError?.(continuityCheck.message || 'Invalid seat selection');
            return;
        }

        onSelectSeats(newSelectedSeats);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (seats.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
                No seat layout available. Please select a showtime first.
            </div>
        );
    }

    return (
        <div style={{ marginBottom: 20 }}>
            {/* SCREEN */}
            <div
                style={{
                    textAlign: 'center',
                    marginBottom: 40,
                    padding: '8px 0',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 16,
                    fontSize: 12,
                    letterSpacing: 3,
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
                }}
            >
                ◆ SCREEN ◆
            </div>

            {/* SEAT ROWS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowX: 'auto', paddingBottom: 10 }}>
                {Object.entries(groupedByRow).map(([row, rowSeats]) => (
                    <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', minWidth: 600 }}>
                        <span
                            style={{
                                width: 24,
                                textAlign: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'rgba(255,255,255,0.4)',
                                flexShrink: 0,
                            }}
                        >
                            {row}
                        </span>

                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'nowrap' }}>
                            {rowSeats.map((seat) => {
                                const isSelected = selectedSeats.includes(seat.id);
                                const isSold = seat.bookingStatus === 'SOLD';
                                const isAvailable = seat.bookingStatus === 'AVAILABLE';
                                const seatConfig = SEAT_TYPE_CONFIG[seat.type] || SEAT_TYPE_CONFIG.STANDARD;
                                const seatColor = seatConfig.color;
                                const pairSeat = findPairSeat(seat);
                                const isPairSelected = pairSeat && selectedSeats.includes(pairSeat.id);
                                const showGap = seat.type === 'SWEETBOX' && seat.seatNo % 2 === 0;

                                return (
                                    <div key={seat.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <Tooltip
                                            title={
                                                isSold
                                                    ? `${seat.seatRow}${seat.seatNo} - SOLD`
                                                    : seat.type === 'SWEETBOX'
                                                        ? `${seat.seatRow}${seat.seatNo} - ${seatConfig.label} (Couple Seat) - ${
                                                            seat.price ? `${seat.price.toLocaleString('vi-VN')}đ` : 'N/A'
                                                        }${pairSeat ? ` (paired with ${pairSeat.seatRow}${pairSeat.seatNo})` : ''}`
                                                        : `${seat.seatRow}${seat.seatNo} • ${seatConfig.label} • ${
                                                            seat.price ? `${seat.price.toLocaleString('vi-VN')}đ` : 'N/A'
                                                        }`
                                            }
                                            color="#000"
                                        >
                                            <button
                                                onClick={() => {
                                                    if (isAvailable || isSelected) {
                                                        handleSeatClick(seat);
                                                    }
                                                }}
                                                disabled={isSold}
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 6,
                                                    border: isSelected
                                                        ? `3px solid ${seatColor}`
                                                        : isSold
                                                            ? '1px solid rgba(255,255,255,0.1)'
                                                            : `2px solid ${seatColor}`,
                                                    background: isSelected
                                                        ? seatColor
                                                        : isSold
                                                            ? 'rgba(255,255,255,0.08)'
                                                            : 'transparent',
                                                    color: isSelected ? '#fff' : isSold ? 'rgba(255,255,255,0.2)' : seatColor,
                                                    cursor: isSold ? 'not-allowed' : 'pointer',
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    transition: 'all 0.2s ease',
                                                    opacity: isSold ? 0.3 : 1,
                                                    boxShadow: isSelected
                                                        ? `0 0 16px ${seatColor}a0`
                                                        : isPairSelected && seat.type === 'SWEETBOX'
                                                            ? `0 0 12px ${seatColor}40`
                                                            : 'none',
                                                    flexShrink: 0,
                                                }}
                                                onMouseEnter={(e) => {
                                                    if ((isAvailable || isSelected) && !isSold) {
                                                        const btn = e.currentTarget as HTMLButtonElement;
                                                        if (!isSelected) {
                                                            btn.style.background = `${seatColor}20`;
                                                        }
                                                        btn.style.transform = 'scale(1.1)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if ((isAvailable || isSelected) && !isSold) {
                                                        const btn = e.currentTarget as HTMLButtonElement;
                                                        if (!isSelected) {
                                                            btn.style.background = 'transparent';
                                                        }
                                                        btn.style.transform = 'scale(1)';
                                                    }
                                                }}
                                            >
                                                {seat.seatNo}
                                            </button>
                                        </Tooltip>
                                        {showGap && <div style={{ width: 8 }} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN POS BOOKING COMPONENT
// ─────────────────────────────────────────────────────────────

export const POSBookingPage: React.FC = () => {
    const { user } = useAuthStore();
    const [api, contextHolder] = notification.useNotification();

    // Data lists
    const [movies, setMovies] = useState<MoviePublish[]>([]);
    const dateList = useMemo(() => buildDateRange(), []);
    const [schedules, setSchedules] = useState<ShowtimeSchedule[]>([]);
    const [seatData, setSeatData] = useState<ResSeatAtRoomBookingDTO | null>(null);

    // Selections
    const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dateList[0]);
    const [selectedShowtime, setSelectedShowtime] = useState<ShowtimeSchedule | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

    // Customer
    const [customerType, setCustomerType] = useState<'member' | 'guest'>('guest');
    const [customerEmail, setCustomerEmail] = useState('');
    const [verifiedCustomer, setVerifiedCustomer] = useState<CustomerInfo | null>(null);
    const [verifyingCustomer, setVerifyingCustomer] = useState(false);

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<'COUNTER' | 'VNPAY'>('COUNTER');

    // Loading & Modal state
    const [loadingMovies, setLoadingMovies] = useState(false);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [loadingSeats, setLoadingSeats] = useState(false);
    const [bookingInProgress, setBookingInProgress] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Printable invoice modal state
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);

    // Ref for printing
    const receiptRef = useRef<HTMLDivElement>(null);

    // Fetch movies on load
    useEffect(() => {
        setLoadingMovies(true);
        axiosClient.get<any>('/api/v1/home/movies')
            .then((res) => {
                const data = res?.data ?? res;
                setMovies(data ?? []);
            })
            .catch(() => {
                api.error({ message: 'Failed to load movie list', placement: 'topRight' });
            })
            .finally(() => setLoadingMovies(false));
    }, []);

    // Fetch showtimes when movie or date changes
    useEffect(() => {
        if (!selectedMovieId) {
            setSchedules([]);
            setSelectedShowtime(null);
            return;
        }

        setLoadingSchedules(true);
        setSelectedShowtime(null);
        setSeatData(null);
        setSelectedSeats([]);

        axiosClient.get<any>(`/api/v1/movies/${selectedMovieId}/showtimes`, {
            params: { date: selectedDate.format('YYYY-MM-DD') }
        })
            .then((res) => {
                const data = res?.data ?? res;
                setSchedules(data?.schedules ?? []);
            })
            .catch(() => {
                setSchedules([]);
                api.error({ message: 'Failed to load showtimes', placement: 'topRight' });
            })
            .finally(() => setLoadingSchedules(false));
    }, [selectedMovieId, selectedDate]);

    // Fetch seat layout when showtime changes
    useEffect(() => {
        if (!selectedShowtime) {
            setSeatData(null);
            setSelectedSeats([]);
            return;
        }

        setLoadingSeats(true);
        setSeatData(null);
        setSelectedSeats([]);

        axiosClient.get<ResSeatAtRoomBookingDTO>(`/api/v1/showtimes/${selectedShowtime.showtimeId}/seats`)
            .then((res) => {
                setSeatData(res?.data ?? res);
            })
            .catch(() => {
                api.error({ message: 'Failed to load seat layout', placement: 'topRight' });
            })
            .finally(() => setLoadingSeats(false));
    }, [selectedShowtime]);

    // Real-time seat updates via WebSocket
    useEffect(() => {
        if (!selectedShowtime) return;

        const showtimeId = selectedShowtime.showtimeId;
        const wsUrl = baseURL.replace(/^http/, 'ws') + '/ws/websocket';

        const stompClient = new Client({
            brokerURL: wsUrl,
            reconnectDelay: 5000,
            onConnect: () => {
                stompClient.subscribe(`/topic/showtime/${showtimeId}/seats`, (message) => {
                    try {
                        const payload = JSON.parse(message.body) as {
                            bookingStatus: string;
                            seatIds: number[];
                        };
                        if (payload.bookingStatus === 'SOLD' && payload.seatIds?.length > 0) {
                            const soldIds = new Set(payload.seatIds);
                            setSeatData((prev) => {
                                if (!prev) return prev;
                                return {
                                    ...prev,
                                    seats: prev.seats.map((seat) =>
                                        soldIds.has(seat.id)
                                            ? { ...seat, bookingStatus: 'SOLD' as const }
                                            : seat
                                    ),
                                };
                            });
                            setSelectedSeats((prev) => prev.filter((id) => !soldIds.has(id)));
                        }
                    } catch (e) {
                        console.error('[POS WS] Failed to parse seat update', e);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('[POS WS] STOMP error', frame);
            },
        });

        stompClient.activate();

        return () => {
            stompClient.deactivate();
        };
    }, [selectedShowtime]);

    // Check customer logic
    const handleVerifyCustomer = async () => {
        if (!customerEmail || !customerEmail.includes('@')) {
            api.warning({ message: 'Invalid email address', placement: 'topRight' });
            return;
        }

        setVerifyingCustomer(true);
        setVerifiedCustomer(null);

        try {
            const res = await bookingService.getCustomerByEmail(customerEmail);
            const data = res?.data ?? res;
            if (data && data.id) {
                setVerifiedCustomer({
                    id: data.id,
                    name: data.name || data.login || 'Customer',
                    email: data.email,
                    phone: data.phone || 'N/A'
                });
                api.success({
                    message: 'Member Verified',
                    description: `Customer: ${data.name || data.login}`,
                    placement: 'topRight'
                });
            } else {
                api.error({ message: 'Customer account not found', placement: 'topRight' });
            }
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || 'Verification failed. Customer not found.';
            api.error({
                message: 'Verification Failed',
                description: errorMsg,
                placement: 'topRight'
            });
        } finally {
            setVerifyingCustomer(false);
        }
    };

    // Reset customer selection when toggle changes
    useEffect(() => {
        setCustomerEmail('');
        setVerifiedCustomer(null);
    }, [customerType]);

    // Total cost calculator
    const getTotalPrice = (): number => {
        if (!seatData) return 0;
        return selectedSeats.reduce((sum, seatId) => {
            const seat = seatData.seats.find((s) => s.id === seatId);
            return sum + (seat?.price ?? 0);
        }, 0);
    };

    // Confirm counter booking
    const handleConfirmBooking = async () => {
        if (selectedSeats.length === 0 || !selectedShowtime) return;
        if (customerType === 'member' && !verifiedCustomer) {
            api.error({ message: 'Please verify the member email first', placement: 'topRight' });
            return;
        }

        setBookingInProgress(true);
        try {
            const payload = {
                showtimeId: selectedShowtime.showtimeId,
                seatIds: selectedSeats,
                paymentMethod: paymentMethod,
                customerId: customerType === 'member' ? verifiedCustomer?.id : null,
                isNotMember: customerType === 'guest'
            };

            const res = await bookingService.createBookingByStaff(payload);
            const data = res?.data ?? res;

            if (paymentMethod === 'VNPAY' && data?.paymentUrl) {
                api.success({
                    message: 'Booking Created',
                    description: 'Redirecting to VNPay payment portal...',
                    placement: 'topRight'
                });
                setTimeout(() => {
                    window.location.href = data.paymentUrl;
                }, 1500);
            } else {
                api.success({
                    message: 'Booking Successful',
                    description: 'Tickets booked successfully. Fetching tickets for printing...',
                    placement: 'topRight'
                });

                try {
                    const ticketRes = await axiosClient.get(`/api/v1/tickets/booking/${data?.bookingId}`);
                    const tickets = ticketRes?.data ?? ticketRes;

                    setReceiptData({
                        bookingId: data?.bookingId || `BK-${Date.now()}`,
                        customerName: customerType === 'member' ? verifiedCustomer?.name : 'Walk-in Guest',
                        paymentMethod: paymentMethod,
                        cashier: user?.name || user?.login || 'Staff Counter',
                        totalPrice: getTotalPrice(),
                        room: selectedShowtime.roomId,
                        tickets: tickets || []
                    });

                    setShowReceiptModal(true);
                } catch (err) {
                    api.error({ message: 'Print Error', description: 'Failed to fetch tickets for printing', placement: 'topRight' });
                }

                const updatedSeatsRes = await axiosClient.get<ResSeatAtRoomBookingDTO>(`/api/v1/showtimes/${selectedShowtime.showtimeId}/seats`);
                setSeatData(updatedSeatsRes?.data ?? updatedSeatsRes);
                setSelectedSeats([]);
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Failed to complete counter booking.';
            api.error({
                message: 'Counter Booking Failed',
                description: msg,
                placement: 'topRight'
            });
        } finally {
            setBookingInProgress(false);
        }
    };

    const handlePrintReceipt = () => {
        const printContent = receiptRef.current?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '_blank');
            printWindow?.document.write(`
                <html>
                    <head>
                        <title>Print Receipt</title>
                        <style>
                            body {
                                font-family: monospace;
                                padding: 20px;
                                color: #000;
                                background: #fff;
                                font-size: 14px;
                                line-height: 1.4;
                            }
                            .receipt-container {
                                max-width: 320px;
                                margin: 0 auto;
                                border: 1px dashed #000;
                                padding: 15px;
                            }
                            .center { text-align: center; }
                            .divider { border-top: 1px dashed #000; margin: 10px 0; }
                            .flex-row { display: flex; justify-content: space-between; }
                            .bold { font-weight: bold; }
                            .ticket-header { font-size: 20px; margin-bottom: 5px; }
                        </style>
                    </head>
                    <body onload="window.print();window.close();">
                        <div class="receipt-container">
                            ${printContent}
                        </div>
                    </body>
                </html>
            `);
            printWindow?.document.close();
        }
    };

    return (
        <ConfigProvider locale={enUS}>
            <div style={{ padding: '24px 16px', background: '#141414', minHeight: 'calc(100vh - 64px)', color: '#f5f5f5' }}>
                {contextHolder}

                <Title level={2} style={{ color: '#ffd700', letterSpacing: '1px', fontWeight: 600, marginBottom: 24, textTransform: 'uppercase' }}>
                    Counter Ticket POS Booking
                </Title>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
                    {/* LEFT COLUMN: SETUP & CHECKOUT PANEL (5 grid cols) */}
                    <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <Card
                            title={<span style={{ color: '#ffd700', fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>1. SELECT MOVIE & DATE</span>}
                            styles={{ body: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' } }}
                            style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>CHOOSE MOVIE</div>
                                    <Select
                                        showSearch
                                        placeholder="Select a movie"
                                        optionFilterProp="children"
                                        value={selectedMovieId}
                                        onChange={(val) => {
                                            setSelectedMovieId(val);
                                            setSelectedShowtime(null);
                                        }}
                                        loading={loadingMovies}
                                        style={{ width: '100%' }}
                                        dropdownStyle={{ background: '#222', border: '1px solid rgba(255,255,255,0.08)' }}
                                    >
                                        {movies.map(movie => (
                                            <Option key={movie.id} value={movie.id}>
                                                <span style={{ color: '#fff' }}>{movie.title} ({movie.duration} mins)</span>
                                            </Option>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>CHOOSE DATE</div>
                                    <Select
                                        value={selectedDate.format('YYYY-MM-DD')}
                                        onChange={(val) => setSelectedDate(dayjs(val))}
                                        style={{ width: '100%' }}
                                    >
                                        {dateList.map(date => (
                                            <Option key={date.format('YYYY-MM-DD')} value={date.format('YYYY-MM-DD')}>
                                                {date.format('dddd, MMMM DD, YYYY')} {date.isSame(dayjs(), 'day') ? '(Today)' : ''}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>
                            </Space>
                        </Card>

                        <Card
                            title={<span style={{ color: '#ffd700', fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>2. SELECT SHOWTIME</span>}
                            styles={{ body: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' } }}
                            style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            {loadingSchedules ? (
                                <div style={{ textAlign: 'center', padding: '15px 0' }}><Spin size="small" /></div>
                            ) : !selectedMovieId ? (
                                <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '10px 0' }}>Please select a movie first</div>
                            ) : schedules.length === 0 ? (
                                <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '10px 0' }}>No showtimes on selected date</div>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                    {schedules.map((s) => {
                                        const isSelected = selectedShowtime?.showtimeId === s.showtimeId;
                                        return (
                                            <button
                                                key={s.showtimeId}
                                                onClick={() => setSelectedShowtime(s)}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: 6,
                                                    cursor: 'pointer',
                                                    background: isSelected ? '#e63946' : 'rgba(255,255,255,0.04)',
                                                    border: isSelected
                                                        ? '1px solid #e63946'
                                                        : '1px solid rgba(255,255,255,0.1)',
                                                    color: isSelected ? '#fff' : '#f0ece3',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    minWidth: 80,
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                            <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <ClockCircleOutlined style={{ fontSize: 10 }} />
                                                {dayjs(s.startDateTime).format('HH:mm')}
                                            </span>
                                                <span style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>
                                                Room {s.roomId}
                                            </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>

                        <Card
                            title={<span style={{ color: '#ffd700', fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>3. CUSTOMER DETAILS</span>}
                            styles={{ body: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' } }}
                            style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <Radio.Group
                                    value={customerType}
                                    className="pos-radio-group"
                                    onChange={(e) => setCustomerType(e.target.value)}
                                    buttonStyle="solid"
                                    style={{ width: '100%', display: 'flex' }}
                                >
                                    <Radio.Button value="guest" style={{ flex: 1, textAlign: 'center', background: 'transparent', borderColor: 'rgba(255,255,255,0.12)' }}>
                                        Walk-in Guest
                                    </Radio.Button>
                                    <Radio.Button value="member" style={{ flex: 1, textAlign: 'center', background: 'transparent', borderColor: 'rgba(255,255,255,0.12)' }}>
                                        Cinema Member
                                    </Radio.Button>
                                </Radio.Group>

                                {customerType === 'member' && (
                                    <div style={{ transition: 'all 0.3s ease' }}>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>MEMBER EMAIL</div>
                                        <Space.Compact style={{ width: '100%' }}>
                                            <Input
                                                placeholder="Enter customer email"
                                                value={customerEmail}
                                                onChange={(e) => setCustomerEmail(e.target.value)}
                                                onPressEnter={handleVerifyCustomer}
                                            />
                                            <Button
                                                type="primary"
                                                icon={<SearchOutlined />}
                                                onClick={handleVerifyCustomer}
                                                loading={verifyingCustomer}
                                                style={{ background: '#e63946', borderColor: '#e63946' }}
                                            >
                                                Verify
                                            </Button>
                                        </Space.Compact>

                                        {verifiedCustomer && (
                                            <Alert
                                                message={<span style={{ fontWeight: 600 }}>Verification Success</span>}
                                                description={
                                                    <div style={{ fontSize: 12 }}>
                                                        <div><strong>Name:</strong> {verifiedCustomer.name}</div>
                                                        <div><strong>Email:</strong> {verifiedCustomer.email}</div>
                                                        <div><strong>Phone:</strong> {verifiedCustomer.phone}</div>
                                                    </div>
                                                }
                                                type="success"
                                                showIcon
                                                style={{ marginTop: 12, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}
                                            />
                                        )}
                                    </div>
                                )}

                                {customerType === 'guest' && (
                                    <Alert
                                        message="Guest Booking (Non-member)"
                                        description="No membership details required. Points will not be accumulated for this purchase."
                                        type="info"
                                        showIcon
                                        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}
                                    />
                                )}
                            </Space>
                        </Card>

                        <Card
                            title={<span style={{ color: '#ffd700', fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>4. CHECKOUT SUMMARY</span>}
                            styles={{ body: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' } }}
                            style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600 }}>PAYMENT METHOD</div>
                                    <Radio.Group
                                        value={paymentMethod}
                                        className="pos-radio-group"
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        buttonStyle="solid"
                                        style={{ width: '100%', display: 'flex' }}
                                    >
                                        <Radio.Button value="COUNTER" style={{ flex: 1, textAlign: 'center', background: 'transparent', borderColor: 'rgba(255,255,255,0.12)' }}>
                                            <DollarOutlined /> Cash/POS Counter
                                        </Radio.Button>
                                        <Radio.Button value="VNPAY" style={{ flex: 1, textAlign: 'center', background: 'transparent', borderColor: 'rgba(255,255,255,0.12)' }}>
                                            VNPay
                                        </Radio.Button>
                                    </Radio.Group>
                                </div>

                                <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

                                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>TOTAL AMOUNT</span>
                                    <span style={{ fontSize: 24, fontWeight: 700, color: '#e63946', fontFamily: "'Bebas Neue', sans-serif" }}>
                                    {getTotalPrice().toLocaleString('vi-VN')}đ
                                </span>
                                </div>

                                <Button
                                    type="primary"
                                    disabled={selectedSeats.length === 0 || !selectedShowtime || (customerType === 'member' && !verifiedCustomer) || bookingInProgress}
                                    loading={bookingInProgress}
                                    onClick={handleConfirmBooking}
                                    style={{
                                        width: '100%',
                                        height: 44,
                                        background: selectedSeats.length > 0 ? '#e63946' : undefined,
                                        borderColor: selectedSeats.length > 0 ? '#e63946' : undefined,
                                        fontWeight: 600,
                                        fontSize: 15,
                                        letterSpacing: 0.5
                                    }}
                                >
                                    {bookingInProgress ? 'Completing Transaction...' : 'Confirm & Process Payment'}
                                </Button>
                            </Space>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: SEAT MAP PANEL (7 grid cols) */}
                    <div style={{ gridColumn: 'span 7' }}>
                        <Card
                            title={
                                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#ffd700', fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>SELECT SEATS</span>
                                    {selectedShowtime && (
                                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                                        Room {selectedShowtime.roomId} • {dayjs(selectedShowtime.startDateTime).format('HH:mm')}
                                    </span>
                                    )}
                                </div>
                            }
                            styles={{ body: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', padding: 24 } }}
                            style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)', minHeight: '100%' }}
                        >
                            {validationError && (
                                <Alert
                                    message="Invalid Seat Selection"
                                    description={validationError}
                                    type="error"
                                    showIcon
                                    closable
                                    onClose={() => setValidationError(null)}
                                    style={{ marginBottom: 16 }}
                                />
                            )}

                            <SeatGrid
                                seats={seatData?.seats ?? []}
                                selectedSeats={selectedSeats}
                                onSelectSeats={(seats) => {
                                    setSelectedSeats(seats);
                                    setValidationError(null);
                                }}
                                loading={loadingSeats}
                                onValidationError={(msg) => {
                                    setValidationError(msg);
                                    api.error({ message: 'Seat Rule Error', description: msg, placement: 'topRight' });
                                }}
                            />

                            {selectedShowtime && seatData && (
                                <>
                                    <Divider style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>
                                            SELECTED SEATS ({selectedSeats.length})
                                        </div>
                                        {selectedSeats.length === 0 ? (
                                            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Click on available seats to select</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {selectedSeats
                                                    .map(id => seatData.seats.find(s => s.id === id))
                                                    .filter(Boolean)
                                                    .map(seat => {
                                                        const config = SEAT_TYPE_CONFIG[seat!.type] || SEAT_TYPE_CONFIG.STANDARD;
                                                        return (
                                                            <Tag
                                                                key={seat!.id}
                                                                closable
                                                                onClose={() => setSelectedSeats(selectedSeats.filter(id => id !== seat!.id))}
                                                                style={{ background: `${config.color}20`, border: `1px solid ${config.color}50`, color: config.color }}
                                                            >
                                                                {seat!.seatRow}{seat!.seatNo} ({config.label})
                                                            </Tag>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </Card>
                    </div>
                </div>

                {/* RECEIPT / PRINT TICKET MODAL */}
                <Modal
                    title={<span style={{ color: '#ffd700', fontWeight: 600 }}><CheckCircleOutlined /> Counter Booking Receipt</span>}
                    open={showReceiptModal}
                    onCancel={() => setShowReceiptModal(false)}
                    footer={[
                        <Button key="close" onClick={() => setShowReceiptModal(false)}>Close</Button>,
                        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintReceipt} style={{ background: '#e63946', borderColor: '#e63946' }}>
                            Print Ticket
                        </Button>
                    ]}
                    width={360}
                    styles={{ content: { background: '#181818', color: '#fff' } }}
                >
                    {receiptData && (
                        <div style={{ padding: '10px 0', maxHeight: '60vh', overflowY: 'auto' }}>
                            <div
                                ref={receiptRef}
                                style={{
                                    background: '#fff',
                                    color: '#000',
                                    padding: '24px 16px',
                                    borderRadius: 8,
                                    fontFamily: 'monospace',
                                    border: '1px solid #ddd',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                {receiptData.tickets?.map((ticket: any, index: number) => (
                                    <div key={ticket.id || index} style={{ marginBottom: index !== receiptData.tickets.length - 1 ? 24 : 0, pageBreakAfter: index !== receiptData.tickets.length - 1 ? 'always' : 'auto' }}>
                                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                            <div style={{ fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }}>PREMIERE CINEMA</div>
                                            <div style={{ fontSize: 10, color: '#666' }}>POS TICKET OUTLET</div>
                                            <div style={{ fontSize: 12, marginTop: 4 }}>Booking ID: {receiptData.bookingId}</div>
                                            <div style={{ fontSize: 12 }}>Ticket Code: {ticket.ticketCode}</div>
                                        </div>

                                        <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }}></div>

                                        <div style={{ marginBottom: 12 }}>
                                            <div style={{ fontSize: 14, fontWeight: 'bold' }}>{ticket.movieTitle?.toUpperCase()}</div>
                                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                                <strong>Date:</strong> {ticket.releaseDate}
                                            </div>
                                            <div style={{ fontSize: 12 }}>
                                                <strong>Time:</strong> {ticket.startDateTime} - {ticket.endDateTime}
                                            </div>
                                            <div style={{ fontSize: 12 }}>
                                                <strong>Room:</strong> Room {receiptData.room}
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }}></div>

                                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>
                                            <span>SEAT:</span>
                                            <span>{ticket.seatPosition} ({ticket.seatType})</span>
                                        </div>

                                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                            <span>Customer:</span>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                                            {receiptData.customerName}
                                        </span>
                                        </div>

                                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 4 }}>
                                            <span>Cashier:</span>
                                            <span>{ticket.cashBy || receiptData.cashier}</span>
                                        </div>

                                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 4 }}>
                                            <span>Payment:</span>
                                            <span>{ticket.paymentMethod || receiptData.paymentMethod}</span>
                                        </div>

                                        <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }}></div>

                                        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 13, fontWeight: 'bold' }}>TICKET PRICE:</span>
                                            <span style={{ fontSize: 16, fontWeight: 'bold' }}>
                                            {ticket.price ? ticket.price.toLocaleString('vi-VN') : '0'}đ
                                        </span>
                                        </div>

                                        <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }}></div>

                                        <div style={{ textAlign: 'center', fontSize: 9, color: '#666', marginTop: 8 }}>
                                            THANK YOU FOR CHOOSING PREMIERE!<br />
                                            ENJOY YOUR MOVIE!
                                        </div>

                                        {index !== receiptData.tickets.length - 1 && (
                                            <div style={{ borderTop: '2px dashed #000', margin: '24px 0' }}></div>
                                        )}
                                    </div>
                                ))}

                                {(!receiptData.tickets || receiptData.tickets.length === 0) && (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>No tickets available</div>
                                )}
                            </div>
                        </div>
                    )}
                </Modal>
            </div>

        </ConfigProvider>
    );
};

export default POSBookingPage;
