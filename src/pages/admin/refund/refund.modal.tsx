'use client';

import React, { useState } from 'react';
import {
    Modal,
    Form,
    Input,
    Button,
    Space,
    Divider,
    Alert,
    Spin,
    Row,
    Col,
    message,
} from 'antd';
import {
    UndoOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {refundService, type TicketRefundInfo, type TransactionHistoryDTO} from '@/services/refund.service';

interface RefundModalProps {
    visible: boolean;
    ticketId: number | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
                                                            visible,
                                                            ticketId,
                                                            onClose,
                                                            onSuccess,
                                                        }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [ticketInfo, setTicketInfo] = useState<TicketRefundInfo | null>(null);
    const [step, setStep] = useState<'search' | 'confirm' | 'success'>('search');
    const [searchInput, setSearchInput] = useState<string>(ticketId?.toString() || '');

    // ✅ Reset modal state
    const resetModal = () => {
        setStep('search');
        setTicketInfo(null);
        setSearchInput('');
        form.resetFields();
    };

    // ✅ Fetch ticket info
    const handleSearchTicket = async () => {
        if (!searchInput.trim()) {
            message.error('Please enter ticket ID');
            return;
        }

        try {
            setLoading(true);
            const id = parseInt(searchInput);
            console.log('Searching for ticket:', id);

            const res = await refundService.getTicketForRefund(id);
            console.log('Ticket data received:', res);

            setTicketInfo(res.data);
            setStep('confirm');
        } catch (error: any) {
            console.error('Search error:', error);
            message.error(error?.response?.data?.message || 'Ticket not found');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Process refund
    const handleProcessRefund = async (values: any) => {
        if (!ticketInfo) return;

        try {
            setLoading(true);
            const refundPayload: TransactionHistoryDTO = {
                ticketId: ticketInfo.ticketId,
                reason: values.reason,
            };

            await refundService.processRefund(refundPayload);
            setStep('success');
            message.success('Refund processed successfully');
        } catch (error: any) {
            console.error('Refund error:', error);
            message.error(error?.response?.data?.message || 'Failed to process refund');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle close
    const handleClose = () => {
        resetModal();
        onClose();
    };

    const handleSuccess = () => {
        resetModal();
        onSuccess();
    };

    // ✅ Format price helper
    const formatPrice = (price: number | undefined) => {
        if (!price || typeof price !== 'number') {
            return '0 VND';
        }
        return `${(price)}VND`;
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UndoOutlined style={{ fontSize: 20, color: '#e63946' }} />
                    Process Refund
                </div>
            }
            open={visible}
            onCancel={handleClose}
            width={600}
            bodyStyle={{ background: '#1a1a1a', minHeight: 400 }}
            footer={null}
            destroyOnClose
        >
            <Spin spinning={loading}>
                {/* STEP 1: SEARCH */}
                {step === 'search' && (
                    <>
                        <Form layout="vertical" onFinish={() => handleSearchTicket()}>
                            <Form.Item
                                label="Ticket ID"
                                required
                                style={{ marginBottom: 16 }}
                            >
                                <Input
                                    placeholder="Enter ticket ID"
                                    type="number"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onPressEnter={() => handleSearchTicket()}
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: '#fff',
                                        borderRadius: 6,
                                        height: 40,
                                    }}
                                />
                            </Form.Item>

                            <div
                                style={{
                                    padding: 12,
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    color: 'rgba(255,255,255,0.6)',
                                    marginBottom: 16,
                                }}
                            >
                                💡 Enter the ticket ID to search for the ticket you want to refund.
                            </div>

                            <Button
                                block
                                type="primary"
                                onClick={() => handleSearchTicket()}
                                loading={loading}
                                style={{
                                    background: '#f59e0b',
                                    border: 'none',
                                    fontWeight: 600,
                                    height: 40,
                                    color: '#000',
                                }}
                            >
                                SEARCH TICKET
                            </Button>
                        </Form>
                    </>
                )}

                {/* STEP 2: CONFIRM */}
                {step === 'confirm' && ticketInfo && (
                    <>
                        <Alert
                            message="Confirm Refund"
                            description="Review the ticket information before processing the refund"
                            type="warning"
                            showIcon
                            style={{
                                marginBottom: 16,
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                color: '#fbbf24',
                            }}
                        />

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
                            <div
                                style={{
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: 1,
                                    marginBottom: 12,
                                    fontWeight: 600,
                                }}
                            >
                                TICKET INFORMATION
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                        Ticket Code
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: '#fff',
                                            fontFamily: 'monospace',
                                            wordBreak: 'break-all',
                                        }}
                                    >
                                        {ticketInfo.ticketCode}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                        Booking Code
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e63946' }}>
                                        {ticketInfo.bookingCode}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                        Movie
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                                        {ticketInfo.movieTitle}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                        Seat
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e63946' }}>
                                        {ticketInfo.seatPosition}
                                    </div>
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                        Showtime
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                                        {dayjs(ticketInfo.showtime).format('DD/MM/YYYY HH:mm')}
                                    </div>
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                        Customer Email
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6' }}>
                                        {ticketInfo.customerEmail}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* REFUND AMOUNT */}
                        <div
                            style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: 8,
                                padding: 16,
                                marginBottom: 16,
                            }}
                        >
                            <Row gutter={16}>
                                <Col xs={12}>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                        Original Amount
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
                                        {formatPrice(ticketInfo.originalAmount)}
                                    </div>
                                </Col>
                                <Col xs={12}>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                        Refund Amount
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
                                        {formatPrice(ticketInfo.refundAmount)}
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                        {/* REFUND FORM */}
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleProcessRefund}
                        >
                            <Form.Item
                                label="Refund Reason"
                                name="reason"
                                rules={[
                                    { required: true, message: 'Refund reason is required' },
                                    { min: 5, message: 'Reason must be at least 5 characters' },
                                ]}
                            >
                                <Input.TextArea
                                    placeholder="Enter refund reason..."
                                    rows={3}
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: '#fff',
                                        borderRadius: 6,
                                    }}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Space style={{ width: '100%', display: 'flex', gap: 8 }}>
                                    <Button
                                        block
                                        onClick={() => setStep('search')}
                                        disabled={loading}
                                        style={{
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            color: '#fff',
                                            fontWeight: 600,
                                            height: 40,
                                        }}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        block
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        danger
                                        style={{
                                            fontWeight: 600,
                                            height: 40,
                                        }}
                                    >
                                        <UndoOutlined /> PROCESS REFUND
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </>
                )}

                {/* STEP 3: SUCCESS */}
                {step === 'success' && ticketInfo && (
                    <>
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <CheckCircleOutlined
                                style={{
                                    fontSize: 64,
                                    color: '#10b981',
                                    marginBottom: 16,
                                    display: 'block',
                                }}
                            />
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                                Refund Successful
                            </h2>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
                                The refund has been processed and the ticket has been cancelled
                            </p>

                            <div
                                style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: 8,
                                    padding: 16,
                                    marginBottom: 24,
                                }}
                            >
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                    REFUND AMOUNT
                                </div>
                                <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>
                                    {formatPrice(ticketInfo.refundAmount)}
                                </div>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                                    Refunded to customer account
                                </div>
                            </div>

                            <Alert
                                message="Refund Completed"
                                description={`Ticket #${ticketInfo.ticketId} has been successfully refunded`}
                                type="success"
                                showIcon
                                style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    marginBottom: 16,
                                    color: '#10b981',
                                }}
                            />

                            <Button
                                block
                                type="primary"
                                onClick={handleSuccess}
                                style={{
                                    background: '#10b981',
                                    border: 'none',
                                    fontWeight: 600,
                                    height: 40,
                                }}
                            >
                                Done
                            </Button>
                        </div>
                    </>
                )}
            </Spin>
        </Modal>
    );
};

export default RefundModal;