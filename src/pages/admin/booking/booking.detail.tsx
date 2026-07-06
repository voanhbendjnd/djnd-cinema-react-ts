'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Empty, Button, Space,Tag, Table, Alert, Descriptions } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axiosClient from '@/services/axiosClient';
import dayjs from 'dayjs';

interface BookingDetail {
    id: number;
    bookingCode: string;
    createdBy: string;
    createdDate: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
    paymentMethod: string;
    status: string;
    totalAmount?: number;
    customer?: {
        id: number;
        email: string;
        fullName: string;
        phone: string;
    };
    bookingDetails?: Array<{
        id: number;
        seat?: {
            id: number;
            seatRow: string;
            seatNo: number;
            type: string;
        };
        showtime?: {
            id: number;
            startDateTime: string;
            endDateTime: string;
            movie?: {
                id: number;
                title: string;
            };
            room?: {
                id: number;
                name: string;
            };
        };
        price?: number;
    }>;
}

interface ApiDetailResponse {
    statusCode: number;
    error: any;
    message: string;
    data: BookingDetail;
}

// ✅ Helper function
const formatPrice = (price: number | undefined): string => {
    if (!price || typeof price !== 'number') {
        return '0.00';
    }
    try {
        return (price / 1000000).toFixed(2);
    } catch (error) {
        return '0.00';
    }
};

const BookingDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await axiosClient.get<ApiDetailResponse>(
                    `/api/v1/bookings/publish/${id}`
                );

                if (res?.data) {
                    setBooking(res.data);
                } else {
                    setError('Invalid booking data');
                }
            } catch (error: any) {
                console.error('Failed to fetch booking:', error);
                setError(
                    error?.response?.data?.message || 'Failed to load booking'
                );
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBooking();
        }
    }, [id]);

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1a0000 0%, #3d0000 100%)',
                }}
            >
                <Spin size="large" tip="Loading booking details..." />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1a0000 0%, #3d0000 100%)',
                    padding: '20px',
                }}
            >
                <Card style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Empty description={error || 'Booking not found'} />
                    <Button
                        onClick={() => navigate('/admin/bookings')}
                        style={{
                            marginTop: 16,
                            background: '#000000',
                            color: '#fff',
                            border: 'none',
                        }}
                    >
                        Back to Bookings
                    </Button>
                </Card>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        const statusMap: Record<string, string> = {
            SUCCESS: 'green',
            FAILED: 'red',
            PENDING: 'orange',
        };
        return statusMap[status] || 'default';
    };

    const getStatusIcon = (status: string) => {
        if (status === 'SUCCESS')
            return <CheckCircleOutlined style={{ color: '#10b981', marginRight: 8 }} />;
        if (status === 'FAILED')
            return <CloseCircleOutlined style={{ color: '#e63946', marginRight: 8 }} />;
        return null;
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a0000 0%, #3d0000 100%)',
                padding: '40px 20px',
            }}
        >
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* BACK BUTTON */}
                <div style={{ marginBottom: 20 }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/admin/bookings')}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#fff',
                            fontWeight: 600,
                        }}
                    >
                        Back to Bookings
                    </Button>
                </div>

                {/* HEADER CARD */}
                <Card
                    style={{
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        marginBottom: 20,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16,
                        }}
                    >
                        <div>
                            <h1
                                style={{
                                    fontSize: 24,
                                    fontWeight: 700,
                                    color: '#fff',
                                    margin: 0,
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    letterSpacing: 1,
                                }}
                            >
                                BOOKING DETAIL
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0' }}>
                                {booking.bookingCode || '-'}
                            </p>
                        </div>
                        <Tag
                            icon={getStatusIcon(booking.status)}
                            color={getStatusColor(booking.status)}
                            style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px' }}
                        >
                            {booking.status || 'UNKNOWN'}
                        </Tag>
                    </div>

                    {/* STATUS ALERT */}
                    {booking.status === 'SUCCESS' && (
                        <Alert
                            message="Payment Successful"
                            description="This booking has been confirmed and payment has been received."
                            type="success"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    {booking.status === 'FAILED' && (
                        <Alert
                            message="Payment Failed"
                            description="This booking payment was not successful. Customer needs to retry."
                            type="error"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    {/* ACTION BUTTONS */}
                    <Space>
                        <Button
                            type="primary"
                            icon={<PrinterOutlined />}
                            onClick={() => navigate(`/you/tickets/detail/${booking.id}`)}
                            style={{
                                background: '#e63946',
                                border: 'none',
                                fontWeight: 600,
                            }}
                        >
                            View Tickets
                        </Button>
                        <Button
                            icon={<DownloadOutlined />}
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: '#fff',
                            }}
                        >
                            Download Invoice
                        </Button>
                    </Space>
                </Card>

                {/* BOOKING INFO */}
                <Card
                    title={
                        <span style={{ color: '#fff', fontWeight: 600 }}>
                            Booking Information
                        </span>
                    }
                    style={{
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        marginBottom: 20,
                    }}
                >
                    <Descriptions column={{ xxl: 4, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}>
                        <Descriptions.Item
                            label="Booking Code"
                            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                            <span
                                style={{
                                    fontWeight: 600,
                                    color: '#e63946',
                                    fontFamily: 'monospace',
                                }}
                            >
                                {booking.bookingCode || '-'}
                            </span>
                        </Descriptions.Item>
                        <Descriptions.Item
                            label="Total Amount"
                            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                            <span
                                style={{
                                    fontWeight: 700,
                                    color: '#10b981',
                                    fontSize: 16,
                                }}
                            >
                                ${formatPrice(booking.totalAmount)}
                            </span>
                        </Descriptions.Item>
                        <Descriptions.Item
                            label="Payment Method"
                            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                            <span style={{ color: '#fff' }}>{booking.paymentMethod || '-'}</span>
                        </Descriptions.Item>
                        <Descriptions.Item
                            label="Status"
                            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                            <Tag color={getStatusColor(booking.status)}>
                                {booking.status || 'UNKNOWN'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item
                            label="Created Date"
                            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                            <span style={{ color: '#fff' }}>
                                {booking.createdDate
                                    ? dayjs(booking.createdDate).format('DD/MM/YYYY HH:mm:ss')
                                    : '-'}
                            </span>
                        </Descriptions.Item>
                        <Descriptions.Item
                            label="Created By"
                            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                            <span style={{ color: '#fff' }}>{booking.createdBy || '-'}</span>
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                {/* BOOKED SEATS */}
                {booking.bookingDetails && booking.bookingDetails.length > 0 && (
                    <Card
                        title={
                            <span style={{ color: '#fff', fontWeight: 600 }}>
                                Booked Seats ({booking.bookingDetails.length})
                            </span>
                        }
                        style={{
                            background: '#111',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12,
                        }}
                    >
                        <Table
                            columns={[
                                {
                                    title: 'Movie',
                                    dataIndex: ['showtime', 'movie', 'title'],
                                    key: 'movie',
                                    render: (text) => (
                                        <span style={{ color: '#fff' }}>{text || '-'}</span>
                                    ),
                                },
                                {
                                    title: 'Date & Time',
                                    dataIndex: ['showtime', 'startDateTime'],
                                    key: 'datetime',
                                    render: (text) => (
                                        <span style={{ color: '#fff' }}>
                                            {text && dayjs(text).isValid()
                                                ? dayjs(text).format('DD/MM/YYYY HH:mm')
                                                : '-'}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Room',
                                    dataIndex: ['showtime', 'room', 'name'],
                                    key: 'room',
                                    render: (text) => (
                                        <span style={{ color: '#fff' }}>{text || '-'}</span>
                                    ),
                                },
                                {
                                    title: 'Seat',
                                    dataIndex: 'seat',
                                    key: 'seat',
                                    render: (seat) => (
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                color: '#e63946',
                                                fontSize: 14,
                                            }}
                                        >
                                            {seat?.seatRow && seat?.seatNo
                                                ? `${seat.seatRow}${seat.seatNo}`
                                                : '-'}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Type',
                                    dataIndex: ['seat', 'type'],
                                    key: 'type',
                                    render: (text) => (
                                        <Tag>{text || '-'}</Tag>
                                    ),
                                },
                                {
                                    title: 'Price',
                                    dataIndex: 'price',
                                    key: 'price',
                                    align: 'right' as const,
                                    render: (price) => (
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                color: '#10b981',
                                            }}
                                        >
                                            ${formatPrice(price)}
                                        </span>
                                    ),
                                },
                            ]}
                            dataSource={booking.bookingDetails}
                            rowKey="id"
                            pagination={false}
                        />
                    </Card>
                )}
            </div>
        </div>
    );
};

export default BookingDetailPage;