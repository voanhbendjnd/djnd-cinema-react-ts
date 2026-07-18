'use client';

import React from 'react';
import { Modal, Button, Space, Divider, Tag, Alert, Spin, message, Popconfirm } from 'antd';
import { GiftOutlined, CheckCircleOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ticketService } from '@/services/ticket.service';
import { useExchangePoints } from '@/hooks/use-exchange-points';

interface ExchangePointsModalProps {
    visible: boolean;
    ticket: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const ExchangePointsModal: React.FC<ExchangePointsModalProps> = ({
                                                                            visible,
                                                                            ticket,
                                                                            onClose,
                                                                            onSuccess,
                                                                        }) => {
    const [loading, setLoading] = React.useState(false);

    if (!ticket) return null;

    const exchange = useExchangePoints(ticket.showtime, ticket.price);

    // ✅ Handle exchange function
    const handleExchange = async () => {
        try {
            setLoading(true);
            await ticketService.exchangeTicketToPoints(ticket.id);
            message.success(
                `Successfully exchanged ticket for ${exchange.points.toLocaleString('vi-VN')} points!`
            );
            onSuccess();
            onClose();
        } catch (error: any) {
            message.error(
                error?.response?.data?.message || 'Failed to exchange ticket'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GiftOutlined style={{ fontSize: 20, color: '#e63946' }} />
                    Exchange Ticket to Loyalty Points
                </div>
            }
            open={visible}
            onCancel={onClose}
            width={500}
            bodyStyle={{ background: '#1a1a1a' }}
            footer={null}
        >
            <Spin spinning={loading}>
                {/* TICKET INFO */}
                <div
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 16,
                    }}
                >
                    <div style={{ marginBottom: 12 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
                            TICKET INFO
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                Movie
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                                {ticket.movieTitle}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                Seat
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#e63946' }}>
                                {ticket.seatPosition}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                Showtime
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                                {dayjs(ticket.startDateTime).format('DD/MM/YYYY HH:mm')}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                Original Price
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                                {ticket.price?.toLocaleString('vi-VN')} VND
                            </div>
                        </div>
                    </div>
                </div>

                {!exchange.canExchange ? (
                    <Alert
                        message="Cannot Exchange"
                        description={exchange.reason}
                        type="error"
                        showIcon
                        style={{
                            background: 'rgba(220, 38, 38, 0.1)',
                            border: '1px solid rgba(220, 38, 38, 0.3)',
                            marginBottom: 16,
                        }}
                    />
                ) : (
                    <>
                        {/* EXCHANGE RULES */}
                        <div
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 8,
                                padding: 16,
                                marginBottom: 16,
                            }}
                        >
                            <div style={{ marginBottom: 12 }}>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
                                    EXCHANGE RULES
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: 8,
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 4,
                                    }}
                                >
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>More than 7 days</span>
                                    <Tag color="cyan">80%</Tag>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: 8,
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 4,
                                    }}
                                >
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>5 - 7 days</span>
                                    <Tag color="blue">70%</Tag>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: 8,
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 4,
                                    }}
                                >
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>3 - 5 days</span>
                                    <Tag color="geekblue">60%</Tag>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: 8,
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 4,
                                    }}
                                >
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>2 - 3 days</span>
                                    <Tag color="orange">50%</Tag>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: 8,
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 4,
                                    }}
                                >
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>1 - 2 days</span>
                                    <Tag color="volcano">40%</Tag>
                                </div>
                            </div>
                        </div>

                        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                        {/* CALCULATION */}
                        <div
                            style={{
                                background: 'rgba(230, 57, 70, 0.1)',
                                border: '1px solid rgba(230, 57, 70, 0.3)',
                                borderRadius: 8,
                                padding: 16,
                                marginBottom: 16,
                            }}
                        >
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8 }}>
                                    YOU WILL RECEIVE
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span style={{ fontSize: 32, fontWeight: 700, color: '#e63946' }}>
                                        {exchange.points.toLocaleString('vi-VN')}
                                    </span>
                                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                                        points ({exchange.percentage}% of ticket price)
                                    </span>
                                </div>
                            </div>

                            <div
                                style={{
                                    padding: 8,
                                    background: 'rgba(255,255,255,0.04)',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    color: 'rgba(255,255,255,0.6)',
                                }}
                            >
                                <CheckCircleOutlined style={{ marginRight: 6, color: '#10b981' }} />
                                Days remaining: {Math.ceil(exchange.daysRemaining)} days
                            </div>
                        </div>

                        {/* ACTION BUTTONS - ✅ Dùng Popconfirm */}
                        <Space style={{ width: '100%', display: 'flex', gap: 8 }}>
                            <Button
                                block
                                onClick={onClose}
                                style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: '#fff',
                                    fontWeight: 600,
                                }}
                            >
                                Cancel
                            </Button>
                            <Popconfirm
                                title="Confirm Exchange"
                                description={`Exchange ticket for ${exchange.points.toLocaleString('vi-VN')} points? This action cannot be undone.`}
                                onConfirm={handleExchange}
                                okText="Exchange"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true, loading }}
                                placement="topRight"
                            >
                                <Button
                                    block
                                    type="primary"
                                    danger
                                    loading={loading}
                                    style={{
                                        fontWeight: 600,
                                    }}
                                >
                                    <GiftOutlined /> Exchange Now
                                </Button>
                            </Popconfirm>
                        </Space>
                    </>
                )}
            </Spin>
        </Modal>
    );
};