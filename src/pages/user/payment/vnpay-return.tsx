import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, Card, Typography, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ArrowRightOutlined, HomeOutlined } from '@ant-design/icons';
import axiosClient from '@/services/axiosClient';

const { Title, Text } = Typography;

const VNPayReturnPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState<boolean | null>(null);

    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
    const vnp_TxnRef = searchParams.get('vnp_TxnRef');
    const vnp_Amount = searchParams.get('vnp_Amount');

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // We call the backend to process the callback.
                // The backend handles saving tickets and updating booking status.
                const queryString = searchParams.toString();
                await axiosClient.get(`/api/v1/payments/vnpay-return?${queryString}`);
                
                if (vnp_ResponseCode === '00') {
                    setSuccess(true);
                } else {
                    setSuccess(false);
                }
            } catch (error) {
                console.error("Error processing payment callback", error);
                // Even if the API call fails, we rely on the IPN to eventually succeed, 
                // but we display status based on response code
                if (vnp_ResponseCode === '00') {
                    setSuccess(true);
                } else {
                    setSuccess(false);
                }
            } finally {
                setLoading(false);
            }
        };

        if (vnp_ResponseCode) {
            verifyPayment();
        } else {
            setLoading(false);
            setSuccess(false);
        }
    }, [searchParams, vnp_ResponseCode]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', background: '#141414' }}>
                <Spin size="large" tip="Verifying payment..." />
            </div>
        );
    }

    const amountVND = vnp_Amount ? (parseInt(vnp_Amount) / 100).toLocaleString('vi-VN') + 'đ' : '';

    return (
        <div style={{ 
            minHeight: '80vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '2rem',
            background: 'linear-gradient(135deg, #141414 0%, #0a0a0a 100%)'
        }}>
            <Card 
                style={{ 
                    maxWidth: 500, 
                    width: '100%', 
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: '#1f1f1f',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                }}
            >
                <Result
                    icon={success ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#e63946' }} />}
                    title={
                        <Title level={3} style={{ color: '#fff', marginBottom: 0 }}>
                            {success ? 'Payment Successful!' : 'Payment Failed'}
                        </Title>
                    }
                    subTitle={
                        <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
                            {success 
                                ? 'Your ticket has been booked and confirmed.' 
                                : 'There was an issue processing your payment. Your booking has been cancelled.'}
                        </Text>
                    }
                    extra={[
                        <div key="actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                            <Button 
                                type="primary" 
                                size="large" 
                                icon={<ArrowRightOutlined />} 
                                onClick={() => navigate('/profile')}
                                style={{ 
                                    background: success ? '#52c41a' : undefined,
                                    width: '100%',
                                    fontWeight: 600
                                }}
                            >
                                View My Tickets
                            </Button>
                            <Button 
                                size="large" 
                                icon={<HomeOutlined />} 
                                onClick={() => navigate('/')}
                                style={{ width: '100%' }}
                            >
                                Return to Home
                            </Button>
                        </div>
                    ]}
                >
                    {vnp_TxnRef && (
                        <div style={{ 
                            background: 'rgba(0,0,0,0.2)', 
                            padding: '1.5rem', 
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.04)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Transaction Ref</Text>
                                <Text strong style={{ color: '#fff' }}>{vnp_TxnRef}</Text>
                            </div>
                            <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.08)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Amount</Text>
                                <Text strong style={{ color: '#ffd700', fontSize: 18 }}>{amountVND}</Text>
                            </div>
                        </div>
                    )}
                </Result>
            </Card>
        </div>
    );
};

export default VNPayReturnPage;
