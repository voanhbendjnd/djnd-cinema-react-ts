'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Empty, Spin, Pagination, Tag, message, Modal, Alert } from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    GiftOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    LockOutlined,
} from '@ant-design/icons';
import axiosClient from '@/services/axiosClient';
import dayjs from 'dayjs';

interface PromotionDTO {
    id: number;
    title: string;
    detail: string;
    discountPercentage: number;
    startTime: string;
    endTime: string;
    active: boolean;
    releaseDate: string;
    quantity: number;
    thumbnailUrl: string;
    status: 'UPCOMING' | 'ACTIVE' | 'EXPIRED' | 'SOLDOUT';
}

interface ResultMeta {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
}

interface VoucherCollectResultDTO {
    errorMessages: string[];
    successTitles: string[];
}

interface ApiResponse {
    statusCode: number;
    message: string;
    data: {
        meta: ResultMeta;
        result: PromotionDTO[];
    };
}

const VoucherListPage: React.FC = () => {
    const [vouchers, setVouchers] = useState<PromotionDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedVouchers, setSelectedVouchers] = useState<number[]>([]);
    const [claiming, setClaiming] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 12,
        total: 0,
    });

    // ✅ Fetch vouchers
    const fetchVouchers = async (page = 1, pageSize = 12, query = '') => {
        try {
            setLoading(true);
            const res = await axiosClient.get<ApiResponse>('/api/promotions/customer', {
                params: {
                    q: query || '',
                    page: page - 1,
                    size: pageSize,
                    sort: 'endTime,desc',
                },
            });

            const data = (res as unknown as IBackendRes<IModelPaginate<PromotionDTO>>).data
            if (data && data.result && Array.isArray(data.result)) {
                setVouchers(data.result);
                setPagination({
                    current: page,
                    pageSize: pageSize,
                    total: data.meta?.total || 0,
                });
            }
        } catch (error) {
            console.error('Failed to fetch vouchers:', error);
            message.error('Failed to load vouchers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers(1, 12, '');
    }, []);

    // ✅ Claim vouchers
    const handleClaimVouchers = async () => {
        if (selectedVouchers.length === 0) {
            message.warning('Please select at least one voucher');
            return;
        }

        Modal.confirm({
            title: 'Claim Vouchers',
            content: `You are claiming ${selectedVouchers.length} voucher(s). Continue?`,
            okText: 'Claim',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    setClaiming(true);
                    const res = await axiosClient.post<VoucherCollectResultDTO>(
                        '/api/promotions/vouchers/collect',
                        { voucherIds: selectedVouchers }
                    );

                    // ✅ Lấy đúng field "data" bên trong response
                    const result = (res as unknown as IBackendRes<VoucherCollectResultDTO>).data;

                    if (result?.successTitles && result.successTitles.length > 0) {
                        message.success(
                            `Successfully claimed: ${result.successTitles.join(', ')}`
                        );
                    }

                    if (result?.errorMessages && result.errorMessages.length > 0) {
                        Modal.error({
                            title: 'Some Vouchers Failed',
                            content: (
                                <ul>
                                    {result.errorMessages.map((msg, idx) => (
                                        <li key={idx}>{msg}</li>
                                    ))}
                                </ul>
                            ),
                        });
                    }

                    setSelectedVouchers([]);
                    fetchVouchers(pagination.current, pagination.pageSize, searchText);
                } catch (error: any) {
                    const errorMsg =
                        error?.response?.data?.message || 'Failed to claim vouchers';
                    message.error(errorMsg);
                } finally {
                    setClaiming(false);
                }
            },        });
    };

    const handleSearch = () => {
        fetchVouchers(1, 12, searchText);
    };

    const handleReset = () => {
        setSearchText('');
        fetchVouchers(1, 12, '');
    };

    // ✅ Get status color and icon
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return { color: 'green', icon: <CheckCircleOutlined />, label: 'Available' };
            case 'UPCOMING':
                return { color: 'blue', icon: <ClockCircleOutlined />, label: 'Coming Soon' };
            case 'EXPIRED':
                return { color: 'red', icon: <LockOutlined />, label: 'Expired' };
            case 'SOLDOUT':
                return { color: 'orange', icon: <LockOutlined />, label: 'Sold Out' };
            default:
                return { color: 'default', icon: null, label: 'Unknown' };
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#0f0f0f',                padding: '40px 20px',
            }}
        >
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                {/* HEADER */}
                <div style={{ marginBottom: 30 }}>
                    <h1
                        style={{
                            fontSize: 32,
                            fontWeight: 700,
                            color: '#fff',
                            margin: '0 0 8px 0',
                            fontFamily: "'Bebas Neue', sans-serif",
                            letterSpacing: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <GiftOutlined style={{ fontSize: 36, color: '#e63946' }} />
                        EXCLUSIVE VOUCHERS
                    </h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                        Collect amazing discounts and special offers
                    </p>
                </div>

                {/* FILTER & ACTION CARD */}
                <Card
                    style={{
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        marginBottom: 24,
                    }}
                >
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                        <Input
                            placeholder="Search vouchers..."
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

                    {/* ACTION BUTTONS */}
                    {selectedVouchers.length > 0 && (
                        <Alert
                            message={`${selectedVouchers.length} voucher(s) selected`}
                            type="info"
                            showIcon
                            action={
                                <Button
                                    size="small"
                                    type="primary"
                                    loading={claiming}
                                    onClick={handleClaimVouchers}
                                    style={{
                                        background: '#e63946',
                                        border: 'none',
                                    }}
                                >
                                    Claim All
                                </Button>
                            }
                            style={{
                                background: 'rgba(230, 57, 70, 0.1)',
                                border: '1px solid rgba(230, 57, 70, 0.3)',
                            }}
                        />
                    )}
                </Card>

                {/* VOUCHER GRID */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <Spin size="large" tip="Loading vouchers..." />
                    </div>
                ) : vouchers.length === 0 ? (
                    <Card
                        style={{
                            background: '#111',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12,
                        }}
                    >
                        <Empty
                            description="No vouchers available"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                        />
                    </Card>
                ) : (
                    <>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: 20,
                                marginBottom: 30,
                            }}
                        >
                            {vouchers.map((voucher) => {
                                const isSelected = selectedVouchers.includes(voucher.id);
                                const statusInfo = getStatusInfo(voucher.status);
                                const canClaim =
                                    voucher.status === 'ACTIVE' && !selectedVouchers.includes(voucher.id);
                                const now = dayjs();
                                const daysLeft = dayjs(voucher.endTime).diff(now, 'day');

                                return (
                                    <Card
                                        key={voucher.id}
                                        style={{
                                            background: '#111',
                                            border: isSelected
                                                ? '2px solid #e63946'
                                                : '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: 12,
                                            overflow: 'hidden',
                                            cursor: canClaim ? 'pointer' : 'default',
                                            transition: 'all 0.3s',
                                            boxShadow: isSelected
                                                ? '0 0 20px rgba(230, 57, 70, 0.3)'
                                                : 'none',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (canClaim) {
                                                (
                                                    e.currentTarget as HTMLDivElement
                                                ).style.boxShadow =
                                                    '0 4px 16px rgba(255,255,255,0.1)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                (
                                                    e.currentTarget as HTMLDivElement
                                                ).style.boxShadow = 'none';
                                            }
                                        }}
                                    >
                                        {/* THUMBNAIL */}
                                        {voucher.thumbnailUrl && (
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: 160,
                                                    background: `url(${voucher.thumbnailUrl})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    position: 'relative',
                                                    marginBottom: 16,
                                                }}
                                            >
                                                {/* STATUS BADGE */}
                                                <Tag
                                                    icon={statusInfo.icon}
                                                    color={statusInfo.color}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {statusInfo.label}
                                                </Tag>

                                                {/* DISCOUNT BADGE */}
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        left: 0,
                                                        right: 0,
                                                        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                                        padding: '20px 12px 12px',
                                                        color: '#fff',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: 24,
                                                            fontWeight: 700,
                                                            fontFamily: "'Bebas Neue', sans-serif",
                                                        }}
                                                    >
                                                        {voucher.discountPercentage}%
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* CONTENT */}
                                        <div style={{ padding: '0 12px' }}>
                                            <h3
                                                style={{
                                                    fontSize: 16,
                                                    fontWeight: 700,
                                                    color: '#fff',
                                                    margin: '0 0 8px 0',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {voucher.title}
                                            </h3>

                                            <p
                                                style={{
                                                    fontSize: 12,
                                                    color: 'rgba(255,255,255,0.6)',
                                                    margin: '0 0 12px 0',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {voucher.detail}
                                            </p>

                                            {/* DATES */}
                                            <div
                                                style={{
                                                    marginBottom: 12,
                                                    fontSize: 11,
                                                    color: 'rgba(255,255,255,0.5)',
                                                }}
                                            >
                                                {voucher.status === 'ACTIVE' && daysLeft >= 0 && (
                                                    <div
                                                        style={{
                                                            color: daysLeft <= 3 ? '#f59e0b' : '#10b981',
                                                            fontWeight: 600,
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        {daysLeft === 0
                                                            ? 'Expires today'
                                                            : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                                                    </div>
                                                )}
                                                <div>
                                                    Ends: {dayjs(voucher.endTime).format('DD/MM/YYYY')}
                                                </div>
                                                {voucher.quantity > 0 && (
                                                    <div>
                                                        {voucher.quantity} available
                                                    </div>
                                                )}
                                            </div>

                                            {/* ACTION BUTTON */}
                                            <Button
                                                block
                                                onClick={() => {
                                                    if (canClaim) {
                                                        setSelectedVouchers([
                                                            ...selectedVouchers,
                                                            voucher.id,
                                                        ]);
                                                    } else if (isSelected) {
                                                        setSelectedVouchers(
                                                            selectedVouchers.filter(
                                                                (id) => id !== voucher.id
                                                            )
                                                        );
                                                    }
                                                }}
                                                type={isSelected ? 'primary' : 'default'}
                                                disabled={
                                                    voucher.status !== 'ACTIVE' && !isSelected
                                                }
                                                style={{
                                                    background: isSelected
                                                        ? '#e63946'
                                                        : voucher.status === 'ACTIVE'
                                                            ? 'rgba(255,255,255,0.06)'
                                                            : 'rgba(255,255,255,0.02)',
                                                    border: isSelected
                                                        ? '1px solid #e63946'
                                                        : '1px solid rgba(255,255,255,0.12)',
                                                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                                                    fontWeight: 600,
                                                    cursor: canClaim || isSelected ? 'pointer' : 'not-allowed',
                                                }}
                                            >
                                                {isSelected ? (
                                                    <>
                                                        <CheckCircleOutlined /> Selected
                                                    </>
                                                ) : voucher.status === 'ACTIVE' ? (
                                                    'Claim Voucher'
                                                ) : (
                                                    statusInfo.label
                                                )}
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* PAGINATION */}
                        {pagination.total > 0 && (
                            <div style={{ textAlign: 'center', marginTop: 30 }}>
                                <Pagination
                                    current={pagination.current}
                                    total={pagination.total}
                                    pageSize={pagination.pageSize}
                                    onChange={(page) =>
                                        fetchVouchers(page, pagination.pageSize, searchText)
                                    }
                                    showSizeChanger
                                    onShowSizeChange={(_, pageSize) =>
                                        fetchVouchers(1, pageSize, searchText)
                                    }
                                    pageSizeOptions={['12', '24', '48']}
                                    showTotal={(total) => `Total ${total} vouchers`}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default VoucherListPage;