'use client';

import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Button, Space, Tag, Empty, Spin, Pagination } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosClient from '@/services/axiosClient';
import dayjs from 'dayjs';

interface PublishBookingDTO {
    id: number;
    bookingCode: string;
    createdBy: string;
    createdDate: string;
    lastModifiedBy: string;
    lastModifiedDate: string;
    paymentMethod: string;
    status: string;
    totalAmount?: number;
}

interface ResultMeta {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
}

interface ResultPaginationDTO {
    meta: ResultMeta;
    result: PublishBookingDTO[];
}

interface ApiResponse {
    statusCode: number;
    error: any;
    message: string;
    data: ResultPaginationDTO;
}

// ✅ Helper function
const formatPrice = (price: number | undefined): string => {
    if (!price || typeof price !== 'number') {
        return '0.00';
    }
    try {
        return (price / 1000).toFixed(3);
    } catch (error) {
        return '0.00';
    }
};

const BookingListPage: React.FC = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<PublishBookingDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const fetchBookings = async (page = 1, pageSize = 10, query = '') => {
        try {
            setLoading(true);
            const res = await axiosClient.get<ApiResponse>('/api/v1/bookings/publish', {
                params: {
                    q: query || '',
                    page: page - 1,
                    size: pageSize,
                    sort: 'createdDate,desc',
                },
            });

            const data = res?.data;
            if (data && data.result && Array.isArray(data.result)) {
                setBookings(data.result);
                setPagination({
                    current: page,
                    pageSize: pageSize,
                    total: data.meta?.total || 0,
                });
            } else {
                console.error('Invalid response structure:', res);
                setBookings([]);
            }
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings(1, 10, '');
    }, []);

    const handleSearch = () => {
        fetchBookings(1, 10, searchText);
    };

    const handleReset = () => {
        setSearchText('');
        fetchBookings(1, 10, '');
    };

    const getStatusColor = (status: string) => {
        const statusMap: Record<string, string> = {
            SUCCESS: 'green',
            FAILED: 'red',
            PENDING: 'orange',
        };
        return statusMap[status] || 'default';
    };

    const getPaymentMethodLabel = (method: string) => {
        const methods: Record<string, string> = {
            CREDIT_CARD: 'Credit Card',
            EWALLET: 'E-Wallet',
            BANK_TRANSFER: 'Bank Transfer',
            QR_CODE: 'QR Code',
            VNPAY: 'VNPay',
            COUNTER: 'Counter',
        };
        return methods[method] || method;
    };

    const columns: any[] = [
        {
            title: 'Booking Code',
            dataIndex: 'bookingCode',
            key: 'bookingCode',
            width: 150,
            render: (text: string) => (
                <span
                    style={{
                        fontWeight: 600,
                        color: '#e63946',
                        fontFamily: 'monospace',
                        fontSize: 12,
                    }}
                >
                    {text || '-'}
                </span>
            ),
        },
        {
            title: 'Total Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 120,
            align: 'right' as const,
            render: (amount: number | undefined) => (
                <span style={{ fontWeight: 700, color: '#10b981' }}>
                    {formatPrice(amount)}VND
                </span>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>{status || 'UNKNOWN'}</Tag>
            ),
        },
        {
            title: 'Payment Method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            width: 140,
            render: (method: string) => (
                <span style={{ fontSize: 12 }}>{getPaymentMethodLabel(method)}</span>
            ),
        },
        {
            title: 'Created Date',
            dataIndex: 'createdDate',
            key: 'createdDate',
            width: 150,
            render: (date: string) =>
                dayjs(date).isValid()
                    ? dayjs(date).format('DD/MM/YYYY HH:mm')
                    : '-',
        },
        {
            title: 'Created By',
            dataIndex: 'createdBy',
            key: 'createdBy',
            width: 120,
            render: (text: string) => <span style={{ color: '#fff' }}>{text || '-'}</span>,
        },
        {
            title: 'Action',
            key: 'action',
            width: 140,
            fixed: 'right' as const,
            render: (_: any, record: PublishBookingDTO) => (
                <Space size="small">
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/admin/bookings/${record.id}`)}
                        style={{
                            background: '#e63946',
                            border: 'none',
                        }}
                    >
                        View
                    </Button>
                    <Button
                        type="default"
                        size="small"
                        icon={<PrinterOutlined />}
                        onClick={() => navigate(`/you/tickets/detail/${record.id}`)}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#fff',
                        }}
                    >
                        Print
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#0f0f0f',
                padding: '40px 20px',
            }}
        >
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                {/* HEADER */}
                <div style={{ marginBottom: 30 }}>
                    <h1
                        style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: '#fff',
                            margin: '0 0 8px 0',
                            fontFamily: "'Bebas Neue', sans-serif",
                            letterSpacing: 1,
                        }}
                    >
                        BOOKING MANAGEMENT
                    </h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                        View and manage all bookings
                    </p>
                </div>

                {/* FILTER CARD */}
                <Card
                    style={{
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        marginBottom: 20,
                    }}
                >
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <Input
                            placeholder="Search booking code..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onPressEnter={handleSearch}
                            style={{
                                flex: 1,
                                minWidth: 200,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 6,
                                color: '#fff',
                            }}
                            allowClear
                        />
                        <Button
                            type="primary"
                            onClick={handleSearch}
                            loading={loading}
                            style={{
                                background: '#e63946',
                                border: 'none',
                                fontWeight: 600,
                            }}
                        >
                            Search
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: '#fff',
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </Card>

                {/* TABLE */}
                <Card
                    style={{
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                    }}
                >
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <Spin size="large" tip="Loading bookings..." />
                        </div>
                    ) : bookings.length === 0 ? (
                        <Empty
                            description="No bookings found"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                        />
                    ) : (
                        <>
                            <Table
                                columns={columns}
                                dataSource={bookings}
                                rowKey="id"
                                loading={loading}
                                pagination={false}
                                scroll={{ x: 1200 }}
                            />

                            {/* PAGINATION */}
                            {pagination.total > 0 && (
                                <div style={{ marginTop: 20, textAlign: 'center' }}>
                                    <Pagination
                                        current={pagination.current}
                                        total={pagination.total}
                                        pageSize={pagination.pageSize}
                                        onChange={(page) =>
                                            fetchBookings(page, pagination.pageSize, searchText)
                                        }
                                        showSizeChanger
                                        onShowSizeChange={(_, pageSize) =>
                                            fetchBookings(1, pageSize, searchText)
                                        }
                                        pageSizeOptions={['10', '20', '50']}
                                        showTotal={(total) => `Total ${total} bookings`}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default BookingListPage;