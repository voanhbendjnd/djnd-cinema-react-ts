'use client';

import React, { useState } from 'react';
import { Card,  message, Row, Col, Divider } from 'antd';
import {
    UndoOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import RefundModal from "@/pages/admin/refund/refund.modal.tsx";

const RefundPage: React.FC = () => {
    const [refundModalVisible, setRefundModalVisible] = useState(false);

    const handleRefundSuccess = () => {
        message.success('Refund completed successfully');
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                // background: 'linear-gradient(135deg, #1a0000 0%, #3d0000 100%)',
                padding: '40px 20px',
            }}
        >
            <RefundModal
                visible={refundModalVisible}
                ticketId={null}
                onClose={() => setRefundModalVisible(false)}
                onSuccess={handleRefundSuccess}
            />

            <div style={{ maxWidth: 900, margin: '0 auto' }}>
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
                        <UndoOutlined style={{ fontSize: 36, color: '#e63946' }} />
                        REFUND MANAGEMENT
                    </h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                        Process ticket refunds for customers at the counter
                    </p>
                </div>

                {/* QUICK ACTION CARD */}
                <Card
                    style={{
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        marginBottom: 24,
                    }}
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <div
                                onClick={() => setRefundModalVisible(true)}
                                style={{
                                    padding: 24,
                                    background: 'rgba(220, 38, 38, 0.1)',
                                    border: '1px solid rgba(220, 38, 38, 0.3)',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.background =
                                        'rgba(220, 38, 38, 0.2)';
                                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.background =
                                        'rgba(220, 38, 38, 0.1)';
                                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ marginBottom: 12 }}>
                                    <UndoOutlined style={{ fontSize: 32, color: '#ef4444' }} />
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                                    Quick Action
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                                    Process Refund
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                                    Click to refund a ticket
                                </div>
                            </div>
                        </Col>

                        <Col xs={24} sm={12}>
                            <div
                                style={{
                                    padding: 24,
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: 12,
                                    cursor: 'default',
                                }}
                            >
                                <div style={{ marginBottom: 12 }}>
                                    <CheckCircleOutlined style={{ fontSize: 32, color: '#10b981' }} />
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                                    Information
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                                    Refund Ready
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                                    System is ready for refunds
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card>

                {/* REFUND POLICY */}
                <Card
                    title="Refund Policy"
                    style={{
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                    }}
                >
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
                        <div style={{ marginBottom: 12 }}>
                            <span style={{ color: '#fff', fontWeight: 600 }}>✓ Full Refund Eligible</span>
                            <p style={{ margin: '4px 0 0 0' }}>
                                Tickets can be refunded if they haven't been used and the movie hasn't started yet
                            </p>
                        </div>

                        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

                        <div style={{ marginBottom: 12 }}>
                            <span style={{ color: '#fff', fontWeight: 600 }}>📋 Required Information</span>
                            <p style={{ margin: '4px 0 0 0' }}>
                                Need valid ticket ID and refund reason. Refund will be credited to customer's account
                            </p>
                        </div>

                        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

                        <div>
                            <span style={{ color: '#fff', fontWeight: 600 }}>⏱️ Processing Time</span>
                            <p style={{ margin: '4px 0 0 0' }}>
                                Refunds are processed instantly and the booking is marked as CANCELLED
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default RefundPage;