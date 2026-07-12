import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Empty, Spin, Tag, notification, Tooltip } from 'antd';
import {
    GiftOutlined,
    CalendarOutlined,
    PercentageOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosClient from '@/services/axiosClient';

// ─────────────────────────────────────────────────────────────
// Hardcode tên thứ/tháng tiếng Anh — không phụ thuộc dayjs locale
// ─────────────────────────────────────────────────────────────
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtDate = (iso?: string): string => {
    if (!iso) return '—';
    const d = dayjs(iso);
    return `${d.format('DD')} ${MONTH_SHORT[d.month()]} ${d.format('YYYY, HH:mm')}`;
};

// ─────────────────────────────────────────────────────────────
// TYPES — khớp với PromotionDTO ở backend
// ─────────────────────────────────────────────────────────────

export type VoucherStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'OUT_OF_STOCK' | string;

export interface VoucherItem {
    id: number;
    title: string;
    detail?: string;
    discountPercentage: number;
    startTime: string;
    endTime: string;
    active: boolean;
    releaseDate?: string;
    quantity?: number;
    thumbnailUrl?: string;
    status: VoucherStatus;
}

export interface VoucherCursorResult {
    result: VoucherItem[];
    nextCursor: string | null; // LocalDateTime dạng ISO string
    voucherId: number | null;
    hasMore: boolean;
}

// ─────────────────────────────────────────────────────────────
// STATUS CONFIG — map hiển thị cho từng trạng thái voucher
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: { label: 'Active', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    UPCOMING: { label: 'Upcoming', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    EXPIRED: { label: 'Expired', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' },
    OUT_OF_STOCK: { label: 'Out of stock', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

const getStatusConfig = (status: string) =>
    STATUS_CONFIG[status] ?? { label: status, color: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.06)' };

const PAGE_SIZE = 10;

// ─────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────

const MyVouchersPage: React.FC = () => {
    const [api, contextHolder] = notification.useNotification();

    const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);

    const cursorRef = useRef<string | null>(null);
    const voucherIdRef = useRef<number | null>(null);

    const fetchVouchers = useCallback(async (reset = false) => {
        setLoading(true);
        try {
            const body: { size: number; cursor?: string | null; voucherId?: number | null } = {
                size: PAGE_SIZE,
            };
            if (!reset && cursorRef.current) {
                body.cursor = cursorRef.current;
                body.voucherId = voucherIdRef.current;
            }

            const res = await axiosClient.post<VoucherCursorResult>(
                '/api/promotions/customer/claimed',
                body
            );
            console.log(">>>> My voucher", res)
            const data: VoucherCursorResult = (res as any)?.data ?? res;
            const items: VoucherItem[] = Array.isArray(data?.result) ? data.result : [];

            setVouchers((prev) => (reset ? items : [...prev, ...items]));
            setHasMore(data?.hasMore ?? false);
            cursorRef.current = data?.nextCursor ?? null;
            voucherIdRef.current = data?.voucherId ?? null;
        } catch (err) {
            console.error('[MyVouchersPage] fetchVouchers failed:', err);
            api.error({
                message: 'Failed to load vouchers',
                description: 'Please try again in a moment.',
                placement: 'topRight',
            });
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    }, [api]);

    useEffect(() => {
        cursorRef.current = null;
        voucherIdRef.current = null;
        fetchVouchers(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = () => {
        cursorRef.current = null;
        voucherIdRef.current = null;
        fetchVouchers(true);
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'radial-gradient(circle at top, #1a0d0d 0%, #0a0a0a 60%)',
                padding: '48px 24px 80px',
            }}
        >
            {contextHolder}

            <div style={{ maxWidth: 1040, margin: '0 auto' }}>
                {/* HEADER */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        marginBottom: 32,
                        flexWrap: 'wrap',
                        gap: 16,
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 11,
                                letterSpacing: 2,
                                color: '#e63946',
                                fontWeight: 700,
                                marginBottom: 6,
                            }}
                        >
                            <GiftOutlined style={{ marginRight: 6 }} />
                            MY VOUCHERS
                        </div>
                        <h1
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 40,
                                letterSpacing: 1,
                                color: '#f0ece3',
                                margin: 0,
                            }}
                        >
                            Vouchers you've claimed
                        </h1>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                            {initialLoading ? 'Loading…' : `${vouchers.length} voucher${vouchers.length !== 1 ? 's' : ''} loaded`}
                        </div>
                    </div>

                    <Button
                        icon={<ReloadOutlined />}
                        onClick={handleRefresh}
                        loading={loading && vouchers.length === 0}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#f0ece3',
                        }}
                    >
                        Refresh
                    </Button>
                </div>

                {/* INITIAL LOADING */}
                {initialLoading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <Spin size="large" />
                    </div>
                ) : vouchers.length === 0 ? (
                    <div
                        style={{
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12,
                            padding: '60px 20px',
                            background: 'rgba(255,255,255,0.03)',
                        }}
                    >
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                                    You haven't claimed any vouchers yet
                                </span>
                            }
                        />
                    </div>
                ) : (
                    <>
                        {/* VOUCHER GRID */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: 16,
                            }}
                        >
                            {vouchers.map((v) => {
                                const statusCfg = getStatusConfig(v.status);
                                const isUsable = v.status === 'ACTIVE';

                                return (
                                    <div
                                        key={v.id}
                                        style={{
                                            position: 'relative',
                                            borderRadius: 12,
                                            border: `1px solid ${isUsable ? 'rgba(236,72,153,0.35)' : 'rgba(255,255,255,0.08)'}`,
                                            background: isUsable
                                                ? 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(255,255,255,0.03))'
                                                : 'rgba(255,255,255,0.03)',
                                            padding: 18,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 12,
                                            opacity: v.status === 'EXPIRED' ? 0.55 : 1,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {/* Perforation accent */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                width: 64,
                                                height: 64,
                                                background: `${statusCfg.color}14`,
                                                borderRadius: '0 0 0 64px',
                                            }}
                                        />

                                        {/* TOP ROW: thumbnail + title + status */}
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                            {v.thumbnailUrl ? (
                                                <img
                                                    src={v.thumbnailUrl}
                                                    alt={v.title}
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 8,
                                                        objectFit: 'cover',
                                                        flexShrink: 0,
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 8,
                                                        flexShrink: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: 'rgba(236,72,153,0.1)',
                                                        border: '1px solid rgba(236,72,153,0.25)',
                                                    }}
                                                >
                                                    <GiftOutlined style={{ color: '#ec4899', fontSize: 20 }} />
                                                </div>
                                            )}

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Tooltip title={v.title}>
                                                    <div
                                                        style={{
                                                            color: '#f0ece3',
                                                            fontWeight: 700,
                                                            fontSize: 15,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}
                                                    >
                                                        {v.title}
                                                    </div>
                                                </Tooltip>
                                                <Tag
                                                    style={{
                                                        marginTop: 6,
                                                        border: 'none',
                                                        color: statusCfg.color,
                                                        background: statusCfg.bg,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {statusCfg.label}
                                                </Tag>
                                            </div>
                                        </div>

                                        {/* DETAIL */}
                                        {v.detail && (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: 'rgba(255,255,255,0.55)',
                                                    lineHeight: 1.5,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {v.detail}
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                borderTop: '1px dashed rgba(255,255,255,0.12)',
                                                margin: '2px 0',
                                            }}
                                        />

                                        {/* DISCOUNT */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <PercentageOutlined style={{ color: '#ec4899', fontSize: 14 }} />
                                            <span
                                                style={{
                                                    fontFamily: "'Bebas Neue', sans-serif",
                                                    fontSize: 22,
                                                    letterSpacing: 0.5,
                                                    color: '#ec4899',
                                                }}
                                            >
                                                {v.discountPercentage}% OFF
                                            </span>
                                        </div>

                                        {/* VALID RANGE */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                fontSize: 11,
                                                color: 'rgba(255,255,255,0.45)',
                                            }}
                                        >
                                            <CalendarOutlined />
                                            <span>
                                                {fmtDate(v.startTime)} — {fmtDate(v.endTime)}
                                            </span>
                                        </div>

                                        {/* QUANTITY (if provided) */}
                                        {typeof v.quantity === 'number' && (
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                                                Remaining uses: {v.quantity}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* LOAD MORE */}
                        {hasMore && (
                            <div style={{ textAlign: 'center', marginTop: 28 }}>
                                <Button
                                    type="dashed"
                                    loading={loading}
                                    onClick={() => fetchVouchers(false)}
                                    style={{
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        color: 'rgba(255,255,255,0.7)',
                                        minWidth: 160,
                                    }}
                                >
                                    Load more
                                </Button>
                            </div>
                        )}

                        {!hasMore && vouchers.length > 0 && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    marginTop: 28,
                                    fontSize: 12,
                                    color: 'rgba(255,255,255,0.3)',
                                }}
                            >
                                — End of list —
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MyVouchersPage;