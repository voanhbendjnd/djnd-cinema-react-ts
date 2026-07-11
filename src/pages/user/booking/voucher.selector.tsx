import React, { useState } from 'react';
import { Button, Empty, Spin } from 'antd';
import { GiftOutlined, CheckCircleFilled } from '@ant-design/icons';

export interface VoucherItem {
    id: number;
    title: string;
    detail?: string;
    discountPercentage: number;
    startTime: string;
    endTime: string;
    thumbnailUrl?: string;
    status?: string;
}

export interface VoucherCursorResult {
    result: VoucherItem[];
    nextCursor: string | null;
    voucherId: number | null;
    hasMore: boolean;
}

interface VoucherSelectorProps {
    vouchers: VoucherItem[];
    selectedVoucher: VoucherItem | null;
    voucherLoading: boolean;
    voucherHasMore: boolean;
    onSelectVoucher: (voucher: VoucherItem | null) => void;
    onLoadMore: () => void;
    // ✅ Gọi khi panel được mở ra — dùng để fetch fallback nếu data chưa có sẵn
    onOpenPanel?: () => void;
}

const VoucherSelector: React.FC<VoucherSelectorProps> = ({
                                                             vouchers,
                                                             selectedVoucher,
                                                             voucherLoading,
                                                             voucherHasMore,
                                                             onSelectVoucher,
                                                             onLoadMore,
                                                             onOpenPanel,
                                                         }) => {
    const [voucherPanelOpen, setVoucherPanelOpen] = useState(false);

    const handleToggle = () => {
        const willOpen = !voucherPanelOpen;
        setVoucherPanelOpen(willOpen);

        // ✅ Fallback: nếu mở panel mà chưa có voucher nào (và không đang loading),
        // chủ động gọi API thay vì chỉ trông chờ vào effect ở component cha.
        if (willOpen) {
            onOpenPanel?.();
        }
    };

    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 13 }}>
                    <GiftOutlined style={{ marginRight: 8, color: '#ec4899' }} /> Vouchers
                </span>
                <Button
                    size="small"
                    type="primary"
                    ghost
                    onClick={handleToggle}
                    style={{ borderColor: selectedVoucher ? '#ec4899' : undefined, color: selectedVoucher ? '#ec4899' : undefined }}
                >
                    {selectedVoucher ? `Applied: -${selectedVoucher.discountPercentage}%` : 'Select Voucher'}
                </Button>
            </div>

            {voucherPanelOpen && (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
                    {voucherLoading && vouchers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 10 }}><Spin /></div>
                    ) : vouchers.length === 0 ? (
                        <Empty description="No vouchers available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                            {vouchers.map(v => (
                                <div
                                    key={v.id}
                                    style={{
                                        padding: '8px 12px',
                                        border: selectedVoucher?.id === v.id ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: selectedVoucher?.id === v.id ? 'rgba(236, 72, 153, 0.1)' : 'transparent'
                                    }}
                                    onClick={() => onSelectVoucher(selectedVoucher?.id === v.id ? null : v)}
                                >
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{v.title}</div>
                                        <div style={{ color: '#ec4899', fontSize: 11, fontWeight: 600 }}>Discount {v.discountPercentage}%</div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Valid until {new Date(v.endTime).toLocaleDateString('vi-VN')}</div>
                                    </div>
                                    {selectedVoucher?.id === v.id && <CheckCircleFilled style={{ color: '#ec4899', fontSize: 18 }} />}
                                </div>
                            ))}
                            {voucherHasMore && (
                                <Button
                                    type="dashed"
                                    loading={voucherLoading}
                                    onClick={onLoadMore}
                                    style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}
                                >
                                    Load More
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VoucherSelector;