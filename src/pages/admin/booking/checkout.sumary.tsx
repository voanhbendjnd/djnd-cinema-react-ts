'use client';

import React, { useState } from 'react';
import { Card, Radio, Button, Space, Divider, Tag } from 'antd';
import { CheckCircleOutlined, CreditCardOutlined, WalletOutlined, DollarOutlined, QrcodeOutlined } from '@ant-design/icons';

interface PaymentMethod {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    fee: number;
}

const PAYMENT_METHODS: PaymentMethod[] = [
    {
        id: 'credit_card',
        name: 'Credit/Debit Card',
        description: 'Visa, Mastercard, JCB',
        icon: <CreditCardOutlined />,
        fee: 0,
    },
    {
        id: 'ewallet',
        name: 'E-Wallet',
        description: 'Momo, ZaloPay, PayPal',
        icon: <WalletOutlined />,
        fee: 0,
    },
    {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Direct bank transfer',
        icon: <DollarOutlined />,
        fee: 0,
    },
    {
        id: 'qr_code',
        name: 'QR Code Payment',
        description: 'Scan QR with mobile app',
        icon: <QrcodeOutlined />,
        fee: 0,
    },
];

export const CheckoutSummary: React.FC<{
    totalAmount: number;
    onPaymentMethodChange?: (method: string) => void;
}> = ({ totalAmount, onPaymentMethodChange }) => {
    const [selectedMethod, setSelectedMethod] = useState<string>('credit_card');

    const handleMethodSelect = (methodId: string) => {
        setSelectedMethod(methodId);
        onPaymentMethodChange?.(methodId);
    };

    return (
        <div
            style={{
                maxWidth: 600,
                margin: '0 auto',
                padding: '20px',
            }}
        >
            {/* CHECKOUT SUMMARY CARD */}
            <Card
                style={{
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    marginBottom: 24,
                }}
            >
                <h2
                    style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#fff',
                        margin: '0 0 20px 0',
                        fontFamily: "'Bebas Neue', sans-serif",
                        letterSpacing: 1,
                    }}
                >
                    CHECKOUT SUMMARY
                </h2>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 16,
                        marginBottom: 20,
                    }}
                >
                    <div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
                            TICKETS
                        </span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '4px 0 0 0' }}>
                            2 × $15.00
                        </p>
                    </div>
                    <div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
                            BOOKING FEE
                        </span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '4px 0 0 0' }}>
                            $0.50
                        </p>
                    </div>
                </div>

                <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                        TOTAL AMOUNT
                    </span>
                    <span
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: '#e63946',
                            fontFamily: "'Bebas Neue', sans-serif",
                        }}
                    >
                        ${totalAmount.toFixed(2)}
                    </span>
                </div>
            </Card>

            {/* PAYMENT METHOD SELECTION */}
            <Card
                style={{
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                }}
            >
                <h3
                    style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#fff',
                        margin: '0 0 16px 0',
                        fontFamily: "'Bebas Neue', sans-serif",
                        letterSpacing: 1,
                    }}
                >
                    SELECT PAYMENT METHOD
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {PAYMENT_METHODS.map((method) => {
                        const isSelected = selectedMethod === method.id;

                        return (
                            <div
                                key={method.id}
                                onClick={() => handleMethodSelect(method.id)}
                                style={{
                                    cursor: 'pointer',
                                    padding: '16px',
                                    borderRadius: 10,
                                    border: isSelected
                                        ? '2px solid #e63946'
                                        : '1px solid rgba(255,255,255,0.1)',
                                    background: isSelected
                                        ? 'rgba(230, 57, 70, 0.1)'
                                        : 'rgba(255,255,255,0.02)',
                                    transition: 'all 0.25s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    boxShadow: isSelected
                                        ? '0 0 20px rgba(230, 57, 70, 0.3), inset 0 0 10px rgba(230, 57, 70, 0.1)'
                                        : 'none',
                                    position: 'relative',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)';
                                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.2)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
                                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)';
                                    }
                                }}
                            >
                                {/* CHECKBOX */}
                                <div
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 50,
                                        border: isSelected ? '2px solid #e63946' : '2px solid rgba(255,255,255,0.2)',
                                        background: isSelected ? '#e63946' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.25s ease',
                                        flexShrink: 0,
                                    }}
                                >
                                    {isSelected && (
                                        <CheckCircleOutlined style={{ color: '#fff', fontSize: 14 }} />
                                    )}
                                </div>

                                {/* METHOD INFO */}
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 4,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 16,
                                                color: isSelected ? '#e63946' : 'rgba(255,255,255,0.6)',
                                                transition: 'color 0.25s ease',
                                            }}
                                        >
                                            {method.icon}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                                                transition: 'color 0.25s ease',
                                            }}
                                        >
                                            {method.name}
                                        </span>
                                        {isSelected && (
                                            <Tag
                                                style={{
                                                    background: '#e63946',
                                                    border: 'none',
                                                    color: '#fff',
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    padding: '2px 8px',
                                                    marginLeft: 'auto',
                                                }}
                                            >
                                                SELECTED
                                            </Tag>
                                        )}
                                    </div>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: isSelected
                                                ? 'rgba(255,255,255,0.6)'
                                                : 'rgba(255,255,255,0.4)',
                                            transition: 'color 0.25s ease',
                                        }}
                                    >
                                        {method.description}
                                    </span>
                                </div>

                                {/* FEE BADGE */}
                                {method.fee > 0 && (
                                    <div
                                        style={{
                                            padding: '4px 8px',
                                            background: 'rgba(255,193,7,0.1)',
                                            border: '1px solid rgba(255,193,7,0.3)',
                                            borderRadius: 6,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            color: '#ffc107',
                                        }}
                                    >
                                        +${method.fee}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* SELECTED METHOD INFO */}
                {selectedMethod && (
                    <div
                        style={{
                            marginTop: 20,
                            padding: 12,
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: 8,
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: 12,
                                color: 'rgba(16, 185, 129, 0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <CheckCircleOutlined />
                            You have selected{' '}
                            <strong style={{ color: '#10b981' }}>
                                {PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.name}
                            </strong>{' '}
                            as your payment method
                        </p>
                    </div>
                )}

                {/* ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <Button
                        block
                        size="large"
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#fff',
                            fontWeight: 600,
                            borderRadius: 6,
                        }}
                    >
                        Back
                    </Button>
                    <Button
                        block
                        size="large"
                        type="primary"
                        style={{
                            background: '#e63946',
                            border: 'none',
                            fontWeight: 600,
                            borderRadius: 6,
                        }}
                    >
                        Proceed to Payment
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default CheckoutSummary;