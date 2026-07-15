'use client';

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    ConfigProvider,
    Modal,
    Button,
    Spin,
    Empty,
    notification,
    Divider,
    Tag,
    Tooltip,
    Alert,
} from 'antd';
import enUS from 'antd/locale/en_US';
import {
    LeftOutlined,
    RightOutlined,
    ClockCircleOutlined,
    LoginOutlined,
    StarFilled,
    CreditCardOutlined,
} from '@ant-design/icons';
import 'dayjs/locale/en';
import axiosClient, { baseURL } from '@/services/axiosClient';
import { Client } from '@stomp/stompjs';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from "@/store/useAuthStore.ts";
import VoucherSelector, {type VoucherCursorResult, type VoucherItem} from './voucher.selector';
// ✅ Hardcode tên thứ/tháng tiếng Anh, không phụ thuộc dayjs locale
// (tránh bị locale global của app đổi thành ngôn ngữ khác, vd 周日)
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

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


// ─────────────────────────────────────────────────────────────
// SEAT TYPE COLORS (Enhanced)
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

// ─────────────────────────────────────────────────────────────
// SEAT GRID COMPONENT
// ─────────────────────────────────────────────────────────────

const SeatGrid: React.FC<{
    seats: SeatLayoutDTO[];
    selectedSeats: number[];
    onSelectSeats: (seatIds: number[]) => void;  // ✅ Thay đổi: nhận full list thay vì toggle 1 ghế
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
        // ✅ Sort by seatNo để layout đúng
        Object.keys(groups).forEach((row) => {
            groups[row].sort((a, b) => a.seatNo - b.seatNo);
        });
        return groups;
    }, [seats]);

    // ─────────────────────────────────────────────────────────
    // FIND PAIR SEAT FOR SWEETBOX
    // ─────────────────────────────────────────────────────────
    const findPairSeat = (seat: SeatLayoutDTO): SeatLayoutDTO | null => {
        if (seat.type !== 'SWEETBOX') return null;

        const sameRowSeats = seats.filter(s => s.seatRow === seat.seatRow);
        const currentNo = seat.seatNo;

        // Nếu số ghế lẻ, tìm ghế chẵn kế bên (số+1)
        // Nếu số ghế chẵn, tìm ghế lẻ kế bên (số-1)
        const pairNo = currentNo % 2 === 1 ? currentNo + 1 : currentNo - 1;

        return sameRowSeats.find(s => s.seatNo === pairNo) || null;
    };

    // ─────────────────────────────────────────────────────────
    // CHECK SEAT CONTINUITY (No gaps)
    // ─────────────────────────────────────────────────────────
    const checkSeatContinuity = (newSelectedSeats: number[]): { valid: boolean; message?: string } => {
        if (newSelectedSeats.length <= 1) return { valid: true };

        // Group by row
        const groupByRow: Record<string, number[]> = {};
        newSelectedSeats.forEach((seatId) => {
            const seat = seats.find(s => s.id === seatId);
            if (!seat) return;

            if (!groupByRow[seat.seatRow]) {
                groupByRow[seat.seatRow] = [];
            }
            groupByRow[seat.seatRow].push(seat.seatNo);
        });

        // Check continuity for each row
        for (const [row, seatNos] of Object.entries(groupByRow)) {
            const sorted = seatNos.sort((a, b) => a - b);

            // Check if there's a gap
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

    // ─────────────────────────────────────────────────────────
    // HANDLE SEAT SELECTION WITH VALIDATION
    // ─────────────────────────────────────────────────────────
    const handleSeatClick = (seat: SeatLayoutDTO) => {
        const isCurrentlySelected = selectedSeats.includes(seat.id);
        let newSelectedSeats: number[];

        if (isCurrentlySelected) {
            // ✅ DESELECT
            newSelectedSeats = selectedSeats.filter(id => id !== seat.id);

            // If SWEETBOX, also deselect pair seat
            if (seat.type === 'SWEETBOX') {
                const pairSeat = findPairSeat(seat);
                if (pairSeat) {
                    newSelectedSeats = newSelectedSeats.filter(id => id !== pairSeat.id);
                }
            }
        } else {
            // ✅ SELECT
            newSelectedSeats = [...selectedSeats, seat.id];

            // If SWEETBOX, auto-select pair seat
            if (seat.type === 'SWEETBOX') {
                const pairSeat = findPairSeat(seat);
                if (pairSeat && !newSelectedSeats.includes(pairSeat.id)) {
                    newSelectedSeats.push(pairSeat.id);
                }
            }
        }

        // Validate continuity
        const continuityCheck = checkSeatContinuity(newSelectedSeats);
        if (!continuityCheck.valid) {
            onValidationError?.(continuityCheck.message || 'Invalid seat selection');
            return;
        }

        // ✅ Apply selection with full list
        onSelectSeats(newSelectedSeats);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin />
            </div>
        );
    }

    return (
        <div style={{ marginBottom: 20 }}>
            {/* SCREEN */}
            <div
                style={{
                    textAlign: 'center',
                    marginBottom: 30,
                    padding: '12px 0',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 8,
                    fontSize: 12,
                    letterSpacing: 1.5,
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                ◆ SCREEN ◆
            </div>

            {/* SEAT ROWS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(groupedByRow).map(([row, rowSeats]) => (
                    <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                        <span
                            style={{
                                width: 24,
                                textAlign: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'rgba(255,255,255,0.6)',
                                flexShrink: 0,
                            }}
                        >
                            {row}
                        </span>

                        {/* ✅ Fix: Flex container for seats */}
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', flex: 1 }}>
                            {rowSeats.map((seat) => {
                                const isSelected = selectedSeats.includes(seat.id);
                                const isSold = seat.bookingStatus === 'SOLD';
                                const isAvailable = seat.bookingStatus === 'AVAILABLE';
                                const seatConfig = SEAT_TYPE_CONFIG[seat.type] || SEAT_TYPE_CONFIG.STANDARD;
                                const seatColor = seatConfig.color;
                                const pairSeat = findPairSeat(seat);
                                const isPairSelected = pairSeat && selectedSeats.includes(pairSeat.id);

                                // ✅ Fix: Gap chỉ sau ghế chẵn của SWEETBOX
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
                                                    if (isAvailable || isSelected) {  // ✅ Allow click if available OR already selected (to deselect)
                                                        handleSeatClick(seat);
                                                    }
                                                }}
                                                disabled={isSold}
                                                style={{
                                                    width: 36,
                                                    height: 36,
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
                                                    color: isSelected ? '#fff' : isSold ? 'rgba(255,255,255,0.3)' : seatColor,
                                                    cursor: isSold ? 'not-allowed' : 'pointer',
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    transition: 'all 0.2s ease',
                                                    opacity: isSold ? 0.4 : 1,
                                                    boxShadow: isSelected
                                                        ? `0 0 16px ${seatColor}a0, inset 0 0 8px ${seatColor}40`
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
                                                            btn.style.boxShadow = `0 0 12px ${seatColor}60`;
                                                        }
                                                        btn.style.transform = 'scale(1.1)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if ((isAvailable || isSelected) && !isSold) {
                                                        const btn = e.currentTarget as HTMLButtonElement;
                                                        if (!isSelected) {
                                                            btn.style.background = 'transparent';
                                                            btn.style.boxShadow = isPairSelected && seat.type === 'SWEETBOX'
                                                                ? `0 0 12px ${seatColor}40`
                                                                : 'none';
                                                        }
                                                        btn.style.transform = 'scale(1)';
                                                    }
                                                }}
                                            >
                                                {seat.seatNo}
                                            </button>
                                        </Tooltip>
                                        {/* ✅ Gap sau ghế chẵn của SWEETBOX */}
                                        {showGap && <div style={{ width: 8 }} />}
                                    </div>
                                );
                            })}
                        </div>

                        <span style={{ width: 24, flexShrink: 0 }} />
                    </div>
                ))}
            </div>

            {/* LEGEND */}
            <div
                style={{
                    marginTop: 24,
                    padding: '16px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 12 }}>
                    SEAT TYPES & RULES
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                    {Object.entries(SEAT_TYPE_CONFIG).map(([type, config]) => (
                        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 4,
                                    background: 'transparent',
                                    border: `2px solid ${config.color}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: config.color,
                                }}
                            >
                                A
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                                    {config.label}
                                </div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                                    {config.description}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* BOOKING RULES */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8 }}>
                        BOOKING RULES
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                        <div>✓ Click seat to select, click again to deselect</div>
                        <div>✓ Sweet Box seats are paired - selecting/deselecting one affects both</div>
                        <div>✓ Seats must be consecutive (no gaps allowed)</div>
                        <div>✓ Example: Can't book C17 + C19 without C18</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// ─────────────────────────────────────────────────────────────
// BOOKING MODAL COMPONENT
// ─────────────────────────────────────────────────────────────

export const BookingModal: React.FC<{
    movieId: number | null;
    movieTitle?: string;
    onClose: () => void;
}> = ({ movieId, movieTitle, onClose }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [api, contextHolder] = notification.useNotification();
    const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
    // const [validationError, setValidationError] = useState<string | null>(null);

    // ✅ Thay handleSelectSeat bằng handleSelectSeats
    const handleSelectSeats = (seatIds: number[]) => {
        setSelectedSeats(seatIds);
        setValidationError(null);  // Clear error when user makes valid selection
    };
    const dateList = useMemo(() => buildDateRange(), []);
    const [step, setStep] = useState<'showtime' | 'seat'>('showtime');
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dateList[0]);
    const [schedules, setSchedules] = useState<ShowtimeSchedule[]>([]);
    const [selectedShowtime, setSelectedShowtime] = useState<ShowtimeSchedule | null>(null);
    const [loading, setLoading] = useState(false);
    const [seatData, setSeatData] = useState<ResSeatAtRoomBookingDTO | null>(null);
    const [booking, setBooking] = useState(false);
    const [usePointMode, setUsePointMode] = useState(false);
    const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
    const [pointsLoading, setPointsLoading] = useState(false);
    const dateScrollRef = useRef<HTMLDivElement>(null);

    // ─── VOUCHER STATE ───
    const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [voucherHasMore, setVoucherHasMore] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(null);

    const voucherCursorRef = useRef<string | null>(null);
    const voucherCursorIdRef = useRef<number | null>(null);

    const fetchLoyaltyPoints = useCallback(async () => {
        if (!isAuthenticated) return;
        setPointsLoading(true);
        try {
            const res = await axiosClient.get<any>('/api/v1/account/info');
            const data = (res as any)?.data ?? res;
            setLoyaltyPoints(data?.loyaltyPoints ?? 0);
        } catch (err) {
            console.error('[fetchLoyaltyPoints] failed:', err);
            setLoyaltyPoints(0);
        } finally {
            setPointsLoading(false);
        }
    }, [isAuthenticated]);

    const fetchVouchers = useCallback(async (reset = false) => {
        if (!isAuthenticated) return;
        setVoucherLoading(true);
        try {
            const body: any = { size: 5 };
            if (!reset && voucherCursorRef.current) {
                body.cursor = voucherCursorRef.current;
                body.voucherId = voucherCursorIdRef.current;
            }
            const res = await axiosClient.post<VoucherCursorResult>(
                '/api/promotions/customer/claimed',
                body
            );
            const data: VoucherCursorResult = (res as any)?.data ?? res;
            const items: VoucherItem[] = Array.isArray(data?.result) ? data.result : [];
            setVouchers(prev => (reset ? items : [...prev, ...items]));
            setVoucherHasMore(data?.hasMore ?? false);
            voucherCursorRef.current = data?.nextCursor ?? null;
            voucherCursorIdRef.current = data?.voucherId ?? null;
        } catch (err) {
            console.error('[fetchVouchers] failed:', err);
            api.error({ message: 'Failed to load vouchers', placement: 'topRight' });
        } finally {
            setVoucherLoading(false);
        }
    }, [isAuthenticated, api]);

    useEffect(() => {
        if (step === 'seat' && isAuthenticated) {
            voucherCursorRef.current = null;
            voucherCursorIdRef.current = null;
            fetchVouchers(true);
            fetchLoyaltyPoints();
        }
    }, [step, isAuthenticated, fetchVouchers, fetchLoyaltyPoints]);

    // ─────────────────────────────────────────────────────────
    // RESET WHEN MODAL OPENS
    // ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (movieId == null) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStep('showtime');
        setSelectedDate(dateList[0]);
        setSelectedShowtime(null);
        setSeatData(null);
        setSelectedSeats([]);
        setVouchers([]);
        setSelectedVoucher(null);
        voucherCursorRef.current = null;
        voucherCursorIdRef.current = null;
        setVoucherHasMore(false);
        setUsePointMode(false);
        setLoyaltyPoints(null);
    }, [movieId]);

    // ─────────────────────────────────────────────────────────
    // FETCH SHOWTIMES
    // ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (movieId == null) return;

        setLoading(true);
        setSelectedShowtime(null);
        axiosClient
            .get<any>(`/api/v1/movies/${movieId}/showtimes`, {
                params: { date: selectedDate.format('YYYY-MM-DD') },
            })
            .then((res) => {
                const data = res?.data ?? res;
                setSchedules(data?.schedules ?? []);
            })
            .catch(() => {
                setSchedules([]);
                api.error({ message: 'Failed to load showtimes', placement: 'topRight' });
            })
            .finally(() => setLoading(false));
    }, [movieId, selectedDate]);

    // ─────────────────────────────────────────────────────────
    // FETCH SEAT LAYOUT
    // ─────────────────────────────────────────────────────────

    useEffect(() => {
        if (!selectedShowtime) return;

        setLoading(true);
        setSeatData(null);
        setSelectedSeats([]);

        axiosClient
            .get<ResSeatAtRoomBookingDTO>(`/api/v1/showtimes/${selectedShowtime.showtimeId}/seats`)
            .then((res) => {
                setSeatData(res?.data ?? res);
            })
            .catch(() => {
                api.error({ message: 'Failed to load seat layout', placement: 'topRight' });
            })
            .finally(() => setLoading(false));
    }, [selectedShowtime]);

    // Real-time seat updates via WebSocket (active only when on seat selection step)
    useEffect(() => {
        if (step !== 'seat' || !selectedShowtime) return;

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
                        console.error('[Booking WS] Failed to parse seat update', e);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('[Booking WS] STOMP error', frame);
            },
        });

        stompClient.activate();

        return () => {
            stompClient.deactivate();
        };
    }, [step, selectedShowtime]);

    // ─────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────

    // const handleSelectSeat = (seatId: number) => {
    //     setSelectedSeats((prev) =>
    //         prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    //     );
    // };

    const scrollDates = (dir: 1 | -1) => {
        if (dateScrollRef.current) {
            dateScrollRef.current.scrollBy({ left: dir * 160, behavior: 'smooth' });
        }
    };

    const handleShowtimeSelect = () => {
        if (!isAuthenticated) {
            api.info({
                message: 'Authentication Required',
                description: 'Please log in to proceed with booking',
                placement: 'topRight',
            });
            setTimeout(() => {
                navigate('/login');
            }, 500);
            return;
        }

        if (selectedShowtime) {
            setStep('seat');
        }
    };

    const getOriginalPrice = (): number => {
        if (!seatData) return 0;
        return selectedSeats.reduce((sum, seatId) => {
            const seat = seatData.seats.find((s) => s.id === seatId);
            return sum + (seat?.price ?? 0);
        }, 0);
    };

    const getTotalPrice = (): number => {
        const original = getOriginalPrice();
        if (!selectedVoucher) return original;
        const discount = selectedVoucher.discountPercentage / 100;
        return Math.round(original * (1 - discount));
    };

    const getDiscountAmount = (): number => {
        if (!selectedVoucher) return 0;
        return getOriginalPrice() - getTotalPrice();
    };

    const handleConfirmBooking = async () => {
        if (selectedSeats.length === 0 || !selectedShowtime) return;

        setBooking(true);
        try {
            const res = await axiosClient.post('/api/v1/bookings', {
                showtimeId: selectedShowtime.showtimeId,
                seatIds: selectedSeats,
                paymentMethod: 'VNPAY',
                ...(selectedVoucher ? { voucherId: selectedVoucher.id } : {}),
            });

            const data = res?.data?.data ?? res.data;
            if (data?.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else {
                api.success({
                    message: 'Booking Successful',
                    description: 'Redirecting to payment gateway...',
                    placement: 'topRight',
                });
                setTimeout(() => {
                    window.location.href = data.paymentUrl;
                }, 1500);
            }
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.description ||
                'Failed to create booking. Please try again.';
            api.error({
                message: 'Booking Failed',
                description: message,
                placement: 'topRight',
                duration: 5,
            });
        } finally {
            setBooking(false);
        }
    };

    const handleConfirmWithPoints = async () => {
        if (selectedSeats.length === 0 || !selectedShowtime) return;

        setBooking(true);
        try {
            const res = await axiosClient.post('/api/v1/bookings/exchange-to-ticket', {
                showtimeId: selectedShowtime.showtimeId,
                seatIds: selectedSeats,
                paymentMethod: 'EXCHANGE_USING_POINTS',
                ...(selectedVoucher ? { voucherId: selectedVoucher.id } : {}),
            });

            const data = (res as any)?.data ?? res;
            api.success({
                message: 'Booking success!',
                description: `Ticket have been booked ${data?.totalPoints ?? loyaltyPoints} using reward points.`,
                placement: 'topRight',
                duration: 6,
            });
            // Refresh loyalty points
            fetchLoyaltyPoints();
            onClose();
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.description ||
                'Không đủ điểm hoặc đã có lỗi xảy ra. Vui lòng thử lại.';
            api.error({
                message: 'Đổi điểm thất bại',
                description: message,
                placement: 'topRight',
                duration: 5,
            });
        } finally {
            setBooking(false);
        }
    };

    const handleBack = () => {
        if (step === 'seat') {
            setStep('showtime');
            setSelectedShowtime(null);
            setSeatData(null);
            setSelectedSeats([]);
            setUsePointMode(false);
        } else {
            onClose();
        }
    };
    const [validationError, setValidationError] = useState<string | null>(null);

    // @ts-ignore
    return (
        <ConfigProvider locale={enUS}>
            {contextHolder}
            <Modal
                open={movieId != null}
                onCancel={handleBack}
                footer={null}
                width={720}
                styles={{
                    content: { background: '#111', border: '1px solid rgba(255,255,255,0.08)' },
                    header: { background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' },
                    mask: { backdropFilter: 'blur(2px)' },
                }}
                title={
                    <span
                        style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            letterSpacing: 1.5,
                            color: '#f0ece3',
                            fontSize: 16,
                        }}
                    >
                        {movieTitle ? movieTitle.toUpperCase() : 'BOOKING'} • STEP {step === 'showtime' ? '1/2' : '2/2'}
                    </span>
                }
                destroyOnClose
            >
                {/* ── STEP 1: SHOWTIME SELECTION ── */}
                {step === 'showtime' && (
                    <>
                        {/* DATE SELECTOR */}
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)', marginBottom: 12, fontWeight: 600 }}>
                                SELECT DATE
                            </div>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                    onClick={() => scrollDates(-1)}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: 6,
                                        color: '#f0ece3',
                                        width: 28,
                                        height: 28,
                                        flexShrink: 0,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                >
                                    <LeftOutlined style={{ fontSize: 11 }} />
                                </button>

                                <div
                                    ref={dateScrollRef}
                                    style={{
                                        display: 'flex',
                                        gap: 8,
                                        overflowX: 'auto',
                                        scrollbarWidth: 'none',
                                        padding: '2px 0',
                                        flex: 1,
                                    }}
                                >
                                    {dateList.map((d) => {
                                        const isActive = d.isSame(selectedDate, 'day');
                                        const isToday = d.isSame(dayjs(), 'day');
                                        return (
                                            <button
                                                key={d.format('YYYY-MM-DD')}
                                                onClick={() => setSelectedDate(d)}
                                                style={{
                                                    flexShrink: 0,
                                                    width: 58,
                                                    padding: '8px 0',
                                                    borderRadius: 8,
                                                    cursor: 'pointer',
                                                    background: isActive ? '#e63946' : 'rgba(255,255,255,0.04)',
                                                    border: isActive
                                                        ? '1px solid #e63946'
                                                        : '1px solid rgba(255,255,255,0.1)',
                                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                <div style={{ fontSize: 10, letterSpacing: 1, opacity: 0.85 }}>
                                                    {WEEKDAY_SHORT[d.day()].toUpperCase()}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 18,
                                                        fontFamily: "'Bebas Neue', sans-serif",
                                                        lineHeight: 1.2,
                                                    }}
                                                >
                                                    {d.format('DD')}
                                                </div>
                                                <div style={{ fontSize: 9, opacity: 0.7 }}>
                                                    {isToday ? 'TODAY' : MONTH_SHORT[d.month()]}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => scrollDates(1)}
                                    style={{
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: 6,
                                        color: '#f0ece3',
                                        width: 28,
                                        height: 28,
                                        flexShrink: 0,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                >
                                    <RightOutlined style={{ fontSize: 11 }} />
                                </button>
                            </div>
                        </div>

                        {/* SHOWTIME LIST */}
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)', marginBottom: 12, fontWeight: 600 }}>
                                SELECT SHOWTIME
                            </div>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                                    <Spin />
                                </div>
                            ) : schedules.length === 0 ? (
                                <Empty
                                    description={
                                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            No showtimes available for selected date
                                        </span>
                                    }
                                    style={{ padding: '20px 0' }}
                                />
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                    {schedules.map((s) => {
                                        const isSelected = selectedShowtime?.showtimeId === s.showtimeId;
                                        return (
                                            <button
                                                key={s.showtimeId}
                                                onClick={() => setSelectedShowtime(s)}
                                                style={{
                                                    padding: '10px 16px',
                                                    borderRadius: 8,
                                                    cursor: 'pointer',
                                                    background: isSelected ? '#e63946' : 'rgba(255,255,255,0.04)',
                                                    border: isSelected
                                                        ? '1px solid #e63946'
                                                        : '1px solid rgba(255,255,255,0.1)',
                                                    color: isSelected ? '#fff' : '#f0ece3',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    minWidth: 90,
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                <span style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <ClockCircleOutlined style={{ fontSize: 11 }} />
                                                    {dayjs(s.startDateTime).format('HH:mm')}
                                                </span>
                                                <span style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                                                    Room {s.roomId}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* AUTH STATUS INFO */}
                        {!isAuthenticated && (
                            <Alert
                                message="Login Required"
                                description="You need to log in or create an account to continue with booking"
                                type="info"
                                icon={<LoginOutlined />}
                                style={{ marginBottom: 20 }}
                                showIcon
                            />
                        )}

                        {/* ACTION BUTTONS */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <Button onClick={onClose}>Cancel</Button>
                            <Button
                                type="primary"
                                disabled={!selectedShowtime}
                                onClick={handleShowtimeSelect}
                                style={{
                                    background: selectedShowtime ? '#e63946' : undefined,
                                    border: 'none',
                                    fontWeight: 600,
                                    letterSpacing: 0.5,
                                }}
                            >
                                {!isAuthenticated ? 'Login & Continue →' : 'Select Seats →'}
                            </Button>
                        </div>
                    </>
                )}

                {step === 'seat' && (
                    <>
                        {/* SHOWTIME INFO */}
                        <div
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                    {`${WEEKDAY_LONG[selectedDate.day()]}, ${MONTH_LONG[selectedDate.month()]} ${selectedDate.format('DD, YYYY')}`}
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#f0ece3' }}>
                                    <ClockCircleOutlined style={{ marginRight: 6 }} />
                                    {selectedShowtime && dayjs(selectedShowtime.startDateTime).format('HH:mm')}
                                    {' '} • Room {selectedShowtime?.roomId}
                                </div>
                            </div>
                        </div>

                        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                        {/* VALIDATION ERROR */}
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

                        {/* SEAT GRID */}
                        <SeatGrid
                            seats={seatData?.seats ?? []}
                            selectedSeats={selectedSeats}
                            onSelectSeats={handleSelectSeats}
                            loading={loading}
                            onValidationError={(message) => {
                                setValidationError(message);
                                api.error({
                                    message: 'Booking Rule Violation',
                                    description: message,
                                    placement: 'topRight',
                                    duration: 4,
                                });
                            }}
                        />

                        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                        {/* SELECTED SEATS & PRICE */}
                        <div
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 8,
                                padding: 16,
                                marginBottom: 20,
                            }}
                        >
                            <div style={{ marginBottom: 12 }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'rgba(255,255,255,0.4)',
                                        letterSpacing: 1,
                                        marginBottom: 8,
                                        fontWeight: 600,
                                    }}
                                >
                                    SELECTED SEATS ({selectedSeats.length})
                                </div>
                                {selectedSeats.length === 0 ? (
                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                                        Click on available seats to select
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {selectedSeats
                                            .map((seatId) => seatData?.seats.find((s) => s.id === seatId))
                                            .filter(Boolean)
                                            .sort((a, b) => {
                                                if (a!.seatRow !== b!.seatRow) {
                                                    return a!.seatRow.localeCompare(b!.seatRow);
                                                }
                                                return a!.seatNo - b!.seatNo;
                                            })
                                            .map((seat) => {
                                                const seatConfig = SEAT_TYPE_CONFIG[seat!.type || 'STANDARD'] || SEAT_TYPE_CONFIG.STANDARD;
                                                return (
                                                    <Tag
                                                        key={seat!.id}
                                                        closable
                                                        onClose={() => {
                                                            let newSeats = selectedSeats.filter(id => id !== seat!.id);
                                                            if (seat!.type === 'SWEETBOX') {
                                                                const sameRowSeats = seatData?.seats.filter(s => s.seatRow === seat!.seatRow) || [];
                                                                const pairNo = seat!.seatNo % 2 === 1 ? seat!.seatNo + 1 : seat!.seatNo - 1;
                                                                const pairSeat = sameRowSeats.find(s => s.seatNo === pairNo);
                                                                if (pairSeat) {
                                                                    newSeats = newSeats.filter(id => id !== pairSeat.id);
                                                                }
                                                            }
                                                            handleSelectSeats(newSeats);
                                                        }}
                                                        style={{
                                                            background: `${seatConfig.color}20`,
                                                            border: `1px solid ${seatConfig.color}60`,
                                                            color: seatConfig.color,
                                                        }}
                                                    >
                                                        {seat!.seatRow}
                                                        {seat!.seatNo} ({seatConfig.label})
                                                    </Tag>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>

                            <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

                            {/* PAYMENT MODE TOGGLE */}
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>
                                    PAYMENT METHOD
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => setUsePointMode(false)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 12px',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            border: !usePointMode ? '2px solid #e63946' : '1px solid rgba(255,255,255,0.15)',
                                            background: !usePointMode ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.04)',
                                            color: !usePointMode ? '#e63946' : 'rgba(255,255,255,0.55)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                            fontWeight: !usePointMode ? 700 : 500,
                                            fontSize: 13,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <CreditCardOutlined style={{ fontSize: 14 }} />
                                        VNPAY
                                    </button>
                                    <button
                                        onClick={() => setUsePointMode(true)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 12px',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            border: usePointMode ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.15)',
                                            background: usePointMode ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                                            color: usePointMode ? '#f59e0b' : 'rgba(255,255,255,0.55)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                            fontWeight: usePointMode ? 700 : 500,
                                            fontSize: 13,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <StarFilled style={{ fontSize: 13 }} />
                                        Use point
                                    </button>
                                </div>
                            </div>

                            {/* POINT INFO PANEL */}
                            {usePointMode && (
                                <div
                                    style={{
                                        padding: '12px 14px',
                                        borderRadius: 8,
                                        background: 'rgba(245,158,11,0.08)',
                                        border: '1px solid rgba(245,158,11,0.3)',
                                        marginBottom: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.8)', letterSpacing: 0.5, marginBottom: 4, fontWeight: 600 }}>
                                            ĐIỂM TÍCH LŨY KHẢ DỤNG
                                        </div>
                                        <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 0.5 }}>
                                            {pointsLoading ? '...' : (loyaltyPoints ?? 0).toLocaleString('vi-VN')}
                                            <span style={{ fontSize: 12, marginLeft: 4, fontFamily: 'inherit', fontWeight: 500 }}>pts</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Chi phí đổi vé</div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0ece3' }}>
                                            {getOriginalPrice().toLocaleString('vi-VN')} pts
                                        </div>
                                    </div>
                                </div>
                            )}

                            {usePointMode && loyaltyPoints !== null && loyaltyPoints < getOriginalPrice() && (
                                <div
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: 6,
                                        background: 'rgba(239,68,68,0.08)',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                        marginBottom: 12,
                                        fontSize: 12,
                                        color: '#f87171',
                                    }}
                                >
                                    ⚠ Không đủ điểm. Bạn cần {getOriginalPrice().toLocaleString('vi-VN')} điểm nhưng chỉ có {loyaltyPoints.toLocaleString('vi-VN')} điểm.
                                </div>
                            )}

                            {/* VOUCHER SECTION (chỉ khi thanh toán VNPAY) */}
                            {!usePointMode && (
                                <VoucherSelector
                                    vouchers={vouchers}
                                    selectedVoucher={selectedVoucher}
                                    voucherLoading={voucherLoading}
                                    voucherHasMore={voucherHasMore}
                                    onSelectVoucher={setSelectedVoucher}
                                    onLoadMore={() => fetchVouchers(false)}
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    //@ts-expect-error

                                    onOpenPanel={() => {
                                        if (vouchers.length === 0 && !voucherLoading) {
                                            voucherCursorRef.current = null;
                                            voucherCursorIdRef.current = null;
                                            fetchVouchers(true);
                                        }
                                    }}
                                />
                            )}

                            <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

                            {!usePointMode && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                        <span>Original Price:</span>
                                        <span>{getOriginalPrice().toLocaleString('vi-VN')}đ</span>
                                    </div>

                                    {selectedVoucher && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#ec4899', fontWeight: 600 }}>
                                            <span>Discount (-{selectedVoucher.discountPercentage}%):</span>
                                            <span>-{getDiscountAmount().toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                                            TOTAL AMOUNT
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 22,
                                                fontWeight: 700,
                                                color: '#e63946',
                                                fontFamily: "'Bebas Neue', sans-serif",
                                                letterSpacing: 0.5,
                                            }}
                                        >
                                            {getTotalPrice().toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>
                                </>
                            )}

                            {usePointMode && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                                        ĐIỂM SẼ DÙNG
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 22,
                                            fontWeight: 700,
                                            color: '#f59e0b',
                                            fontFamily: "'Bebas Neue', sans-serif",
                                            letterSpacing: 0.5,
                                        }}
                                    >
                                        {getOriginalPrice().toLocaleString('vi-VN')} pts
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* ACTION BUTTONS */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <Button onClick={handleBack}>← Back</Button>
                            {!usePointMode ? (
                                <Button
                                    type="primary"
                                    disabled={selectedSeats.length === 0 || booking}
                                    loading={booking}
                                    onClick={handleConfirmBooking}
                                    style={{
                                        background: selectedSeats.length > 0 ? '#e63946' : undefined,
                                        border: 'none',
                                        fontWeight: 600,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    {booking ? 'Processing...' : 'Proceed to Payment'}
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    disabled={
                                        selectedSeats.length === 0 ||
                                        booking ||
                                        pointsLoading ||
                                        (loyaltyPoints !== null && loyaltyPoints < getOriginalPrice())
                                    }
                                    loading={booking}
                                    onClick={handleConfirmWithPoints}
                                    style={{
                                        background:
                                            selectedSeats.length > 0 &&
                                            (loyaltyPoints === null || loyaltyPoints >= getOriginalPrice())
                                                ? '#f59e0b'
                                                : undefined,
                                        border: 'none',
                                        fontWeight: 600,
                                        letterSpacing: 0.5,
                                        color: '#000',
                                    }}
                                    icon={<StarFilled />}
                                >
                                    {booking ? 'Đang xử lý...' : 'Submit'}
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </Modal>
        </ConfigProvider>
    );
};

export default BookingModal;