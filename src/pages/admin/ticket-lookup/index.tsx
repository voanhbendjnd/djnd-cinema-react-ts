import React, { useState, useEffect, useRef } from 'react';
import { 
    type ActionType, 
    type ProColumns, 
    ProTable 
} from '@ant-design/pro-components';
import { 
    Button, 
    Card, 
    Row, 
    Col, 
    Input, 
    Tag, 
    Typography, 
    Space, 
    Tooltip, 
    Statistic, 
    Progress, 
    Form, 
    Alert, 
    notification,
    Divider,
    Breadcrumb,
    Badge
} from 'antd';
import { 
    SearchOutlined, 
    ReloadOutlined, 
    CheckCircleOutlined, 
    ClockCircleOutlined,
    CreditCardOutlined,
    UserOutlined,
    GiftOutlined,
    PrinterOutlined,
    ArrowLeftOutlined,
    PlusOutlined
} from '@ant-design/icons';
import { bookingService } from '@/services/booking.service';
import type { IBooking, IInvoice } from '@/types/booking.types';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store/useAuthStore';

const { Title, Text, Paragraph } = Typography;

// Helper to generate deterministic occupied seats for visual simulation
const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

// --- Seat Map Visualizer ---
const SeatMap: React.FC<{ selectedSeats: string[]; roomCode: string }> = ({ selectedSeats, roomCode }) => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const cols = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div style={{ 
            background: '#121212', 
            padding: '24px 16px', 
            borderRadius: 12, 
            border: '1px solid rgba(255, 215, 0, 0.15)', 
            margin: '16px 0',
            boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.6)'
        }}>
            {/* Screen Line */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ 
                    width: '75%', 
                    height: 5, 
                    background: 'linear-gradient(90deg, transparent 0%, #ffd700 50%, transparent 100%)', 
                    margin: '0 auto 8px', 
                    borderRadius: 3, 
                    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)' 
                }}></div>
                <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.35)', textTransform: 'uppercase', letterSpacing: 3 }}>SCREEN</span>
            </div>
            
            {/* Grid Seats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', overflowX: 'auto', paddingBottom: 10 }}>
                {rows.map(r => (
                    <div key={r} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ width: 20, color: 'rgba(255, 255, 255, 0.3)', fontSize: 11, fontWeight: 'bold' }}>{r}</span>
                        {cols.map(c => {
                            const seatCode = `${r}${String(c).padStart(2, '0')}`;
                            const isSelected = selectedSeats.includes(seatCode);
                            // Mock occupancies based on a hash
                            const isOccupied = !isSelected && (hashString(seatCode + roomCode) % 3 === 0);

                            let bg = 'rgba(255, 255, 255, 0.05)';
                            let border = '1px solid rgba(255, 255, 255, 0.15)';
                            let color = '#fff';
                            let glow = 'none';

                            if (isSelected) {
                                bg = 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)';
                                border = '1px solid #ffd700';
                                color = '#000';
                                glow = '0 0 10px rgba(255, 215, 0, 0.5)';
                            } else if (isOccupied) {
                                bg = 'rgba(255, 255, 255, 0.15)';
                                border = '1px solid rgba(255, 255, 255, 0.05)';
                                color = 'transparent';
                            }

                            return (
                                <Tooltip key={seatCode} title={isSelected ? `Your Seat: ${seatCode}` : isOccupied ? `Occupied` : `Available Seat: ${seatCode}`}>
                                    <div style={{
                                        width: 26,
                                        height: 26,
                                        background: bg,
                                        border: border,
                                        borderRadius: 6,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 9,
                                        fontWeight: 'bold',
                                        color: color,
                                        cursor: isOccupied ? 'not-allowed' : 'pointer',
                                        boxShadow: glow,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        {isSelected ? seatCode : ''}
                                    </div>
                                </Tooltip>
                            );
                        })}
                        <span style={{ width: 20, color: 'rgba(255, 255, 255, 0.3)', fontSize: 11, fontWeight: 'bold', textAlign: 'right' }}>{r}</span>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20, fontSize: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 14, height: 14, background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)', borderRadius: 4, boxShadow: '0 0 5px rgba(255, 215, 0, 0.3)' }}></div>
                    <span style={{ color: 'rgba(255,255,255,0.85)' }}>Selected Seats</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 14, height: 14, background: 'rgba(255, 255, 255, 0.15)', borderRadius: 4 }}></div>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Occupied</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 14, height: 14, background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 4 }}></div>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Available</span>
                </div>
            </div>
        </div>
    );
};

const BarcodeSVG: React.FC<{ value: string }> = ({ value }) => {
    const binaryPattern = [];
    for (let i = 0; i < value.length; i++) {
        const charCode = value.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
            binaryPattern.push((charCode >> j) & 1);
        }
    }
    const barWidth = 1.3;
    const barHeight = 45;
    return (
        <svg width={binaryPattern.length * barWidth} height={barHeight} style={{ display: 'block', margin: '8px auto' }}>
            {binaryPattern.map((bit, idx) => (
                <rect 
                    key={idx}
                    x={idx * barWidth}
                    y={0}
                    width={barWidth}
                    height={barHeight}
                    fill={bit === 1 ? '#000' : 'transparent'}
                />
            ))}
        </svg>
    );
};

// --- Main Component ---
const TicketLookup: React.FC = () => {
    const { user } = useAuthStore();
    const staffName = user?.name || user?.login || 'HO TAN THANH';
    const actionRef = useRef<ActionType>(null);
    const [currentStep, setCurrentStep] = useState<'SEARCH' | 'VERIFY' | 'SUCCESS'>('SEARCH');
    
    // Search params state
    const [searchId, setSearchId] = useState('');
    const [searchCccd, setSearchCccd] = useState('');
    const [searchPhone, setSearchPhone] = useState('');
    
    const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);
    const [pointsToUse, setPointsToUse] = useState<number>(0);
    const [pointsError, setPointsError] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);
    
    // Receipt state
    const [currentInvoice, setCurrentInvoice] = useState<IInvoice | null>(null);
    const [redirectCountdown, setRedirectCountdown] = useState<number>(30);

    const [api, contextHolder] = notification.useNotification();

    // Today's showtimes for advisory widget
    // const moviesToday = bookingService.getMoviesToday();

    // // 30-Second Redirect Countdown for success page
    // useEffect(() => {
    //     let timer: any;
    //     if (currentStep === 'SUCCESS') {
    //         setRedirectCountdown(30);
    //         timer = setInterval(() => {
    //             setRedirectCountdown(prev => {
    //                 if (prev <= 1) {
    //                     clearInterval(timer);
    //                     handleResetToSearch();
    //                     return 30;
    //                 }
    //                 return prev - 1;
    //             });
    //         }, 1000);
    //     }
    //     return () => {
    //         if (timer) clearInterval(timer);
    //     };
    // }, [currentStep]);
    // Today's showtimes for advisory widget
    const [moviesToday, setMoviesToday] = useState<any[]>([]);

    useEffect(() => {
        const fetchMoviesToday = async () => {
            try {
                const res = await bookingService.getMoviesToday();
                // Láº¥y máº£ng dá»¯ liá»‡u phim tá»« káº¿t quáº£ tráº£ vá» cá»§a Backend
                // (TÃ¹y theo cáº¥u trÃºc API backend, thÆ°á»ng lÃ  res.data.result hoáº·c res.data)
                if (res && res.data && res.data.result) {
                    setMoviesToday(res.data.result);
                } else if (res && res.data) {
                    setMoviesToday(res.data);
                } else if (Array.isArray(res)) {
                    setMoviesToday(res);
                }
            } catch (error) {
                console.error("error when fetching movies today:", error);
            }
        };

        fetchMoviesToday();
    }, []);

    // Validation for member points
    const handlePointsChange = (val: string, maxPoints: number) => {
        const num = parseInt(val, 10);
        if (isNaN(num)) {
            setPointsToUse(0);
            setPointsError(null);
            return;
        }

        if (num < 0) {
            setPointsError("Points to use cannot be negative.");
        } else if (num > maxPoints) {
            setPointsError(`Invalid: Cannot exceed available points (${maxPoints}).`);
        } else {
            setPointsError(null);
        }
        setPointsToUse(num);
    };

    // Confirm Payment
    const handleConfirmPayment = async () => {
        if (!selectedBooking) return;
        if (pointsError) {
            api.error({
                message: "Verification Failed",
                description: "Please correct the points validation error before proceeding.",
                placement: 'topRight'
            });
            return;
        }

        setConfirming(true);
        try {
            const res = await bookingService.confirmBooking(selectedBooking.id, pointsToUse);
            if (res.statusCode === 200) {
                setCurrentInvoice(res.data);
                setCurrentStep('SUCCESS');
                api.success({
                    message: "Verification Successful",
                    description: `Booking ${selectedBooking.id} has been confirmed.`,
                    placement: 'topRight'
                });
            } else {
                api.error({
                    message: "Verification Failed",
                    description: res.message || "Failed to confirm payment.",
                    placement: 'topRight'
                });
            }
        } catch (err: any) {
            api.error({
                message: "Network Error",
                description: err.message || "Something went wrong during confirmation.",
                placement: 'topRight'
            });
        } finally {
            setConfirming(false);
        }
    };

    // Reset workflow to search
    const handleResetToSearch = () => {
        setSelectedBooking(null);
        setCurrentInvoice(null);
        setPointsToUse(0);
        setPointsError(null);
        setCurrentStep('SEARCH');
        // reload table
        setTimeout(() => actionRef.current?.reload(), 200);
    };

    // Browser thermal ticket print trigger
    const handlePrintTicket = () => {
        window.print();
    };

    // Table Columns Configuration
    const columns: ProColumns<IBooking>[] = [
        {
            title: 'Booking ID',
            dataIndex: 'id',
            key: 'id',
            render: (text) => <strong style={{ color: '#ffd700' }}>{text}</strong>,
        },
        {
            title: 'Customer Name',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: 'National ID (CCCD)',
            dataIndex: 'cccd',
            key: 'cccd',
        },
        {
            title: 'Phone Number',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Movie Name',
            dataIndex: 'movieTitle',
            key: 'movieTitle',
        },
        {
            title: 'Showtime',
            dataIndex: 'showtime',
            key: 'showtime',
            render: (text) => (
                <Space>
                    <ClockCircleOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />
                    <span>{dayjs(text as string).format('DD/MM/YYYY HH:mm')}</span>
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                if (status === 'PENDING') {
                    return <Badge status="warning" text={<Tag color="warning">Pending</Tag>} />;
                }
                if (status === 'CONFIRMED') {
                    return <Badge status="success" text={<Tag color="success">Confirmed</Tag>} />;
                }
                return <Badge status="error" text={<Tag color="error">Cancelled</Tag>} />;
            }
        },
        {
            title: 'Actions',
            valueType: 'option',
            key: 'option',
            render: (_, record) => [
                <Button
                    key="verify"
                    type="primary"
                    size="small"
                    disabled={record.status !== 'PENDING'}
                    onClick={() => {
                        setSelectedBooking(record);
                        setPointsToUse(0);
                        setPointsError(null);
                        setCurrentStep('VERIFY');
                    }}
                    style={{
                        background: record.status === 'PENDING' ? undefined : 'rgba(255,255,255,0.05)',
                        borderColor: record.status === 'PENDING' ? undefined : 'rgba(255,255,255,0.1)',
                        color: record.status === 'PENDING' ? '#000' : 'rgba(255,255,255,0.25)',
                    }}
                >
                    Verify
                </Button>
            ]
        }
    ];

    // Format currencies
    const formatVND = (num: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    };

    // CGV Ticket specific helpers
    const formatCGVPrice = (num: number) => {
        return num.toLocaleString('vi-VN');
    };

    const getMovieTimes = (movieTitle: string, startTimeStr: string) => {
        const movieToday = moviesToday.find(m => m.title === movieTitle);
        const durationMins = movieToday ? parseInt(movieToday.duration) : 120;
        
        let startFmt = dayjs(startTimeStr);
        if (!startFmt.isValid()) {
            startFmt = dayjs(startTimeStr, 'YYYY-MM-DD HH:mm');
        }
        if (!startFmt.isValid()) {
            startFmt = dayjs(startTimeStr, 'HH:mm');
        }
        const baseStart = startFmt.isValid() ? startFmt : dayjs();
        const endFmt = baseStart.add(durationMins, 'minute');
        
        return {
            date: baseStart.format('DD/MMM/YYYY').toUpperCase(),
            timeRange: `${baseStart.format('HH:mm A')} ~ ${endFmt.format('HH:mm A')}`
        };
    };

    const getTicketType = (roomCode: string) => {
        if (roomCode.toLowerCase().includes('a')) return 'Gold Class';
        if (roomCode.toLowerCase().includes('b')) return 'Sweetbox';
        return 'Standard Class';
    };

    const getFormattedSalesNo = (bookingId: string) => {
        const dateStr = dayjs().format('YYMM-DD');
        const cleanId = bookingId.replace(/[^0-9]/g, '');
        const paddedId = cleanId.padEnd(8, '0').slice(0, 8);
        const part2 = paddedId.slice(0, 4);
        const part3 = paddedId.slice(4, 8);
        return `${dateStr}01-${part2}-${part3}`;
    };

    return (
        <div style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto' }}>
            {contextHolder}

            {/* Print Only Thermal Stylesheet & Section */}
            {/* <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: auto;
                        margin: 0;
                    }
                    body {
                        background: #fff !important;
                        color: #000 !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #print-receipt-section, #print-receipt-section * {
                        visibility: visible;
                    }
                    #print-receipt-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm;
                        margin: 0;
                        padding: 8px;
                        box-sizing: border-box;
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 11px;
                        color: #000;
                        background: #fff;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}} /> */}



           {/* Print Only Thermal Stylesheet & Section */}
            <style dangerouslySetInnerHTML={{ __html: `
                /* ðŸŸ¢ 1. GIáº¤U CHIáº¾C VÃ‰ ÄI KHI XEM TRÃŠN MÃ€N HÃŒNH WEB */
                @media screen {
                    #print-receipt-section {
                        display: none !important;
                    }
                }

                /* ðŸŸ¢ 2. HIá»†N CHIáº¾C VÃ‰ LÃŠN KHI MÃY IN CHáº Y */
                @media print {
                    @page {
                        size: auto;
                        margin: 0;
                    }
                    body {
                        background: #fff !important;
                        color: #000 !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #print-receipt-section, #print-receipt-section * {
                        visibility: visible;
                    }
                    
                    /* CÄƒn chá»‰nh láº¡i form vÃ© */
                    #print-receipt-section {
                        display: block !important; /* Ã‰p hiá»‡n láº¡i khi in */
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm;
                        margin: 0;
                        padding: 8px;
                        box-sizing: border-box;
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 11px;
                        color: #000;
                        background: #fff;
                    }
                    .no-print {
                        display: none !important;
                    }
                    
                    /* áº¨n thÃ´ng bÃ¡o popup Ant Design */
                    .ant-notification, .ant-message {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    /* áº¨n Menu Sidebar vÃ  Header */
                    .ant-layout-sider,
                    .ant-layout-header,
                    .ant-menu,
                    aside,
                    header {
                        display: none !important;
                        visibility: hidden !important;
                    }
                }
            `}} />

            {/* Print Receipt Section (Only visible during print) */}
            {currentInvoice && (() => {
                const printDateTime = dayjs().format('DD/MMM/YYYY hh:mm A').toUpperCase();
                const movieTimes = getMovieTimes(currentInvoice.movieTitle, selectedBooking?.showtime || '');
                const ticketType = getTicketType(currentInvoice.roomCode);
                const formattedSalesNo = getFormattedSalesNo(currentInvoice.bookingId);
                return (
                    
                    <div id="print-receipt-section">
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                            <div style={{
                                display: 'inline-block',
                                border: '2px solid #000',
                                padding: '2px 8px',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                letterSpacing: '1px',
                                marginBottom: '6px'
                            }}>
                                THE VAO PHONG CHIEU PHIM
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Vincom Dong Khoi</div>
                            <div style={{ fontSize: '10px' }}>Tang 3, TTTM Vincom Center Dong Khoi, 72 Le Thanh Ton</div>
                            <div style={{ fontSize: '10px' }}>Ton & 45A Ly Tu Trong, Quan 1, TP. HCM.</div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginTop: '6px' }}>
                                <span>{printDateTime}</span>
                                <span>POS: BOX01</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-start', fontSize: '9px' }}>
                                <span>Staff: {staffName}</span>
                            </div>
                        </div>

                        <div style={{ letterSpacing: '-1px', margin: '4px 0' }}>=============================================</div>

                        {/* Movie name, ticket type, showtime */}
                        <div style={{ margin: '6px 0' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>
                                {currentInvoice.movieTitle} [C18]
                            </div>
                            <div style={{ fontSize: '11px', marginTop: '2px' }}>
                                <span style={{ fontWeight: 'bold' }}>{movieTimes.date}</span>
                                <span style={{ marginLeft: '12px', fontWeight: 'bold' }}>{movieTimes.timeRange}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>
                                <span>{ticketType}</span>
                                <span>Room {currentInvoice.roomCode.replace(/[^0-9]/g, '') || currentInvoice.roomCode}</span>
                                <span>Seat {currentInvoice.seats.join(', ')}</span>
                            </div>
                        </div>

                        <div style={{ letterSpacing: '-1px', margin: '4px 0' }}>=============================================</div>

                        {/* Cost details */}
                        <div style={{ margin: '6px 0' }}>
                            {currentInvoice.seats.map((seat) => {
                                const seatBasePrice = Math.round((selectedBooking?.originalPrice || 0) / currentInvoice.seats.length);
                                const seatSurcharge = Math.round((selectedBooking?.surcharge || 0) / currentInvoice.seats.length);
                                const seatTotal = seatBasePrice + seatSurcharge;
                                return (
                                    <div key={seat} style={{ marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                            <span>Adult {ticketType} ({seat})</span>
                                            <span>VND {formatCGVPrice(seatTotal)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', paddingLeft: '8px' }}>
                                            <span>- Ticket Price (bao gom 5% VAT)</span>
                                            <span>VND {formatCGVPrice(seatBasePrice)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', paddingLeft: '8px' }}>
                                            <span>- Surcharge (bao gom 10% VAT)</span>
                                            <span>VND {formatCGVPrice(seatSurcharge)}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {currentInvoice.pointsUsed > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#000', margin: '4px 0' }}>
                                    <span>- Points Discount (redemption)</span>
                                    <span>VND -{formatCGVPrice(currentInvoice.pointsUsed * 1000)}</span>
                                </div>
                            )}

                            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
                                <span>TOTAL PAID</span>
                                <span>VND {formatCGVPrice(currentInvoice.amountCollected)}</span>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

                        {/* Sales number & barcode */}
                        <div style={{ textAlign: 'center', margin: '8px 0 4px' }}>
                            <div style={{ fontSize: '10px' }}>Sales No. {formattedSalesNo}</div>
                            <BarcodeSVG value={formattedSalesNo} />
                        </div>
                    </div>
                );
            })()}

            <div className="no-print">
                {/* Header breadcrumb */}
                <div style={{ marginBottom: 24 }}>
                    <Breadcrumb items={[
                        { title: 'Cinema Admin' },
                        { title: 'Ticket Verification' }
                    ]} />
                    <Title level={2} style={{ marginTop: 8, color: '#fff', marginBottom: 0 }}>
                        Ticket Lookup & Verification
                    </Title>
                    <Paragraph style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                        Search customer bookings, verify movie details, apply member reward points, and print thermal tickets.
                    </Paragraph>
                </div>

                {/* --- SEARCH STEP --- */}
                {currentStep === 'SEARCH' && (
                    <Row gutter={[24, 24]}>
                        {/* Advisory graphical sidebar widget */}
                        <Col xs={24} lg={8}>
                            <Card 
                                title={
                                    <span style={{ fontFamily: 'Playfair Display, serif', color: '#ffd700', fontSize: 16 }}>
                                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                                        Today's Screening Schedule
                                    </span>
                                }
                                style={{ 
                                    background: 'rgba(20, 20, 20, 0.65)', 
                                    borderColor: 'rgba(255, 215, 0, 0.15)',
                                    height: '100%' 
                                }}
                            >
                                <Paragraph style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
                                    Live screening times for quick customer advisory guidance.
                                </Paragraph>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {moviesToday.map(movie => (
                                        <div key={movie.id} style={{ 
                                            display: 'flex', 
                                            gap: 12, 
                                            background: 'rgba(255, 255, 255, 0.02)', 
                                            padding: 12, 
                                            borderRadius: 8,
                                            border: '1px solid rgba(255, 255, 255, 0.05)'
                                        }}>
                                            <img src={movie.poster} alt={movie.title} style={{ 
                                                width: 55, 
                                                height: 80, 
                                                objectFit: 'cover', 
                                                borderRadius: 4,
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                                            }} />
                                            <div style={{ flex: 1 }}>
                                                <Text strong style={{ color: '#fff', fontSize: 13, display: 'block', lineHeight: '1.2' }}>
                                                    {movie.title}
                                                </Text>
                                                <div style={{ margin: '4px 0 6px 0' }}>
                                                    <Tag color="gold" style={{ fontSize: 10, padding: '0 4px' }}>{movie.room}</Tag>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>{movie.duration}</Text>
                                                </div>
                                                <Space wrap size={[4, 4]}>
                                                    {movie.showtimes.map(t => (
                                                        <Tag key={t} color="blue" style={{ fontSize: 11, margin: 0, background: 'rgba(22, 119, 255, 0.1)' }}>
                                                            {t}
                                                        </Tag>
                                                    ))}
                                                </Space>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </Col>

                        {/* Search Filter Panel and Results Table */}
                        <Col xs={24} lg={16}>
                            {/* Filter panel */}
                            <Card style={{ 
                                background: 'rgba(20, 20, 20, 0.65)', 
                                borderColor: 'rgba(255, 215, 0, 0.15)',
                                marginBottom: 20
                            }}>
                                <Title level={4} style={{ color: '#ffd700', marginBottom: 16 }}>
                                    Search Bookings
                                </Title>
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={8}>
                                        <Input
                                            placeholder="Enter Booking ID (e.g. BKG-98721A)"
                                            prefix={<SearchOutlined />}
                                            value={searchId}
                                            onChange={(e) => setSearchId(e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Input
                                            placeholder="Enter CCCD (e.g. 012345678901)"
                                            prefix={<UserOutlined />}
                                            value={searchCccd}
                                            onChange={(e) => setSearchCccd(e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Input
                                            placeholder="Enter Phone (e.g. 0987654321)"
                                            prefix={<CreditCardOutlined />}
                                            value={searchPhone}
                                            onChange={(e) => setSearchPhone(e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </Col>
                                </Row>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                                    <Button 
                                        icon={<ReloadOutlined />} 
                                        onClick={() => {
                                            setSearchId('');
                                            setSearchCccd('');
                                            setSearchPhone('');
                                            actionRef.current?.reload();
                                        }}
                                    >
                                        Reset Filters
                                    </Button>
                                    <Button 
                                        type="primary" 
                                        icon={<SearchOutlined />} 
                                        onClick={() => actionRef.current?.reload()}
                                    >
                                        Search
                                    </Button>
                                </div>
                            </Card>

                            {/* Table results list */}
                            <ProTable<IBooking>
                                columns={columns}
                                actionRef={actionRef}
                                cardBordered
                                request={async (params) => {
                                    const res = await bookingService.getBookings({
                                        current: params.current,
                                        pageSize: params.pageSize,
                                        id: searchId,
                                        cccd: searchCccd,
                                        phone: searchPhone
                                    });
                                    return {
                                        data: res.data.result,
                                        success: true,
                                        total: res.data.meta.total,
                                    };
                                }}
                                rowKey="id"
                                search={false} // Custom filter panel implemented above
                                options={{
                                    reload: true,
                                    density: true,
                                    setting: {
                                        listsHeight: 350,
                                    },
                                }}
                                pagination={{
                                    pageSize: 5,
                                    showSizeChanger: true
                                }}
                                headerTitle="Booking Database"
                                style={{
                                    background: 'rgba(20, 20, 20, 0.65)',
                                    borderRadius: 8
                                }}
                            />
                        </Col>
                    </Row>
                )}

                {/* --- VERIFY STEP --- */}
                {currentStep === 'VERIFY' && selectedBooking && (
                    <div>
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={handleResetToSearch}
                            style={{ marginBottom: 20 }}
                        >
                            Back to Search
                        </Button>

                        <Row gutter={[24, 24]}>
                            {/* Left details panel & seat map visualizer */}
                            <Col xs={24} md={14}>
                                <Card 
                                    title={
                                        <span style={{ fontFamily: 'Playfair Display, serif', color: '#ffd700', fontSize: 18 }}>
                                            Ticket Allocation & Room Layout
                                        </span>
                                    }
                                    style={{ 
                                        background: 'rgba(20, 20, 20, 0.65)', 
                                        borderColor: 'rgba(255, 215, 0, 0.15)' 
                                    }}
                                >
                                    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                        <Col span={12}>
                                            <Statistic 
                                                title={<Text type="secondary">Movie Title</Text>} 
                                                value={selectedBooking.movieTitle}
                                                valueStyle={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }} 
                                            />
                                        </Col>
                                        <Col span={6}>
                                            <Statistic 
                                                title={<Text type="secondary">Room Code</Text>} 
                                                value={selectedBooking.roomCode}
                                                valueStyle={{ fontSize: 16, color: '#ffd700' }} 
                                            />
                                        </Col>
                                        <Col span={6}>
                                            <Statistic 
                                                title={<Text type="secondary">Showtime</Text>} 
                                                value={dayjs(selectedBooking.showtime).format('HH:mm')}
                                                valueStyle={{ fontSize: 16, color: '#ffd700' }} 
                                            />
                                        </Col>
                                    </Row>

                                    <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.05)' }} />

                                    <Text strong style={{ color: '#fff', fontSize: 14 }}>Seating Allocation</Text>
                                    <SeatMap selectedSeats={selectedBooking.seats} roomCode={selectedBooking.roomCode} />
                                </Card>
                            </Col>

                            {/* Right billing & member point calculations */}
                            <Col xs={24} md={10}>
                                <Card 
                                    title={
                                        <span style={{ fontFamily: 'Playfair Display, serif', color: '#ffd700', fontSize: 18 }}>
                                            Billing & Member Points
                                        </span>
                                    }
                                    style={{ 
                                        background: 'rgba(20, 20, 20, 0.65)', 
                                        borderColor: 'rgba(255, 215, 0, 0.15)',
                                        height: '100%' 
                                    }}
                                >
                                    {/* Cost breakdown items */}
                                    <div style={{ marginBottom: 24 }}>
                                        <Title level={5} style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
                                            Price breakdown
                                        </Title>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: 13 }}>
                                            <Text type="secondary">Original Ticket Price:</Text>
                                            <Text style={{ color: '#fff' }}>{formatVND(selectedBooking.originalPrice)}</Text>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: 13 }}>
                                            <Text type="secondary">Room Surcharge:</Text>
                                            <Text style={{ color: '#fff' }}>+{formatVND(selectedBooking.surcharge)}</Text>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: 13 }}>
                                            <Text type="secondary">Points Discount Applied:</Text>
                                            <Text style={{ color: '#ff4d4f' }}>-{formatVND(pointsToUse * 1000)}</Text>
                                        </div>
                                        <Divider style={{ margin: '10px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0' }}>
                                            <Text strong style={{ fontSize: 15, color: '#fff' }}>Total Amount Collected:</Text>
                                            <Text strong style={{ fontSize: 18, color: '#ffd700' }}>
                                                {formatVND(Math.max(0, selectedBooking.totalPrice - (pointsToUse * 1000)))}
                                            </Text>
                                        </div>
                                    </div>

                                    {/* Member score converter module */}
                                    <div style={{ 
                                        background: 'rgba(255, 215, 0, 0.03)', 
                                        border: '1px solid rgba(255, 215, 0, 0.1)', 
                                        padding: 16, 
                                        borderRadius: 8,
                                        marginBottom: 24
                                    }}>
                                        <Title level={5} style={{ color: '#ffd700', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <GiftOutlined />
                                            Reward point converter
                                        </Title>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <Text type="secondary">Customer Reward Account:</Text>
                                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{selectedBooking.memberId}</Text>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <Text type="secondary">Available Points:</Text>
                                            <Tag color="gold" style={{ fontWeight: 'bold' }}>{selectedBooking.memberPoints} Points</Tag>
                                        </div>

                                        <Form layout="vertical">
                                            <Form.Item 
                                                label={<span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12 }}>Points to redeem:</span>}
                                                validateStatus={pointsError ? 'error' : 'success'}
                                                help={pointsError}
                                            >
                                                <Input 
                                                    type="number"
                                                    value={pointsToUse || ''}
                                                    onChange={(e) => handlePointsChange(e.target.value, selectedBooking.memberPoints)}
                                                    placeholder="Enter points count"
                                                    suffix="Pts"
                                                    style={{ background: '#000', border: '1px solid rgba(255,215,0,0.25)', color: '#fff' }}
                                                />
                                            </Form.Item>
                                        </Form>

                                        {/* Real-time preview */}
                                        <Alert 
                                            message={
                                                <div style={{ fontSize: 12 }}>
                                                    <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>-{formatVND(pointsToUse * 1000)}</span> discount applied 
                                                    (1 point = 1,000 VND).
                                                </div>
                                            } 
                                            type="info" 
                                            showIcon
                                            style={{ background: 'rgba(22, 119, 255, 0.05)', border: 'none' }}
                                        />
                                    </div>

                                    {/* Action verification */}
                                    <Button 
                                        type="primary" 
                                        block 
                                        size="large"
                                        disabled={!!pointsError || pointsToUse < 0 || confirming}
                                        loading={confirming}
                                        icon={<CheckCircleOutlined />}
                                        onClick={handleConfirmPayment}
                                        style={{ height: 48 }}
                                    >
                                        Confirm Payment & Ticket
                                    </Button>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                )}

                {/* --- SUCCESS STEP --- */}
                {currentStep === 'SUCCESS' && currentInvoice && (
                    <div style={{ maxWidth: 600, margin: '0 auto' }}>
                        <Card 
                            style={{ 
                                background: 'rgba(20, 20, 20, 0.65)', 
                                border: '2px solid #ffd700', 
                                borderRadius: 16,
                                textAlign: 'center',
                                padding: '24px 16px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
                            }}
                        >
                            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
                            
                            <Title level={3} style={{ color: '#fff', margin: '0 0 4px 0' }}>
                                Payment Confirmed!
                            </Title>
                            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.45)', marginBottom: 24 }}>
                                The ticket has been registered on the server successfully.
                            </Paragraph>

                            {/* Summary metrics */}
                            <div style={{ 
                                background: 'rgba(0, 0, 0, 0.3)', 
                                padding: 20, 
                                borderRadius: 12, 
                                border: '1px solid rgba(255,255,255,0.05)',
                                textAlign: 'left',
                                marginBottom: 24
                            }}>
                                <Title level={5} style={{ color: '#ffd700', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8, marginTop: 0 }}>
                                    Receipt Details
                                </Title>
                                
                                <Row gutter={[12, 12]} style={{ fontSize: 13 }}>
                                    <Col span={10}>
                                        <Text type="secondary">Invoice ID:</Text>
                                    </Col>
                                    <Col span={14} style={{ textAlign: 'right' }}>
                                        <strong style={{ color: '#fff' }}>{currentInvoice.invoiceId}</strong>
                                    </Col>

                                    <Col span={10}>
                                        <Text type="secondary">Movie Name:</Text>
                                    </Col>
                                    <Col span={14} style={{ textAlign: 'right' }}>
                                        <Text style={{ color: '#fff' }}>{currentInvoice.movieTitle}</Text>
                                    </Col>

                                    <Col span={10}>
                                        <Text type="secondary">Auditorium / Seats:</Text>
                                    </Col>
                                    <Col span={14} style={{ textAlign: 'right' }}>
                                        <Text style={{ color: '#fff' }}>
                                            {currentInvoice.roomCode} - <strong style={{ color: '#ffd700' }}>{currentInvoice.seats.join(', ')}</strong>
                                        </Text>
                                    </Col>

                                    <Col span={10}>
                                        <Text type="secondary">Total Amount Collected:</Text>
                                    </Col>
                                    <Col span={14} style={{ textAlign: 'right' }}>
                                        <strong style={{ color: '#ffd700', fontSize: 15 }}>{formatVND(currentInvoice.amountCollected)}</strong>
                                    </Col>

                                    <Col span={10}>
                                        <Text type="secondary">Points Redeemed:</Text>
                                    </Col>
                                    <Col span={14} style={{ textAlign: 'right' }}>
                                        <Text style={{ color: '#ff4d4f' }}>-{currentInvoice.pointsUsed} Points</Text>
                                    </Col>

                                    <Col span={10}>
                                        <Text type="secondary">Points Earned (+5%):</Text>
                                    </Col>
                                    <Col span={14} style={{ textAlign: 'right' }}>
                                        <Text style={{ color: '#52c41a' }}>+{currentInvoice.pointsEarned} Points</Text>
                                    </Col>

                                    <Col span={10}>
                                        <Text type="secondary">New Points Balance:</Text>
                                    </Col>
                                    <Col span={14} style={{ textAlign: 'right' }}>
                                        <Tag color="gold" style={{ margin: 0, fontWeight: 'bold' }}>{currentInvoice.newPointsBalance} Pts</Tag>
                                    </Col>
                                </Row>
                            </div>

                            {/* Ticket action print and reset buttons */}
                            <Space direction="vertical" style={{ width: '100%' }} size={12}>
                                <Button 
                                    type="primary" 
                                    block 
                                    size="large"
                                    icon={<PrinterOutlined />}
                                    onClick={handlePrintTicket}
                                    style={{ height: 48 }}
                                >
                                    Print Ticket (Therm)
                                </Button>
                                
                                <Button 
                                    block 
                                    icon={<PlusOutlined />}
                                    onClick={handleResetToSearch}
                                >
                                    Create New Verification
                                </Button>
                            </Space>

                            {/* Redirect Countdown Indicator */}
                            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <Progress 
                                    type="circle" 
                                    percent={(redirectCountdown / 30) * 100} 
                                    width={20} 
                                    strokeColor="#ffd700" 
                                    showInfo={false} 
                                />
                                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                                    Auto-returning to search in <strong style={{ color: '#ffd700' }}>{redirectCountdown}s</strong>
                                </Text>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketLookup;

