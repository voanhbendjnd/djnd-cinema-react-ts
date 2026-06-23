import React, { useState } from 'react';
import { Form, Input, Button, Typography, Result, Card } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '@/services/axiosClient'; // adjust to your axios instance path

const { Title, Text } = Typography;

const PASSWORD_MIN_LENGTH = 4;
const PASSWORD_MAX_LENGTH = 100;

const ResetPasswordFinish: React.FC = () => {
    const [form] = Form.useForm();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const resetKey = searchParams.get('key');

    const onFinish = async (values: { newPassword: string; confirmPassword: string }) => {
        if (!resetKey) {
            setErrorMsg('Link reset password invalid or over date!');
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        try {
            await axiosClient.post('/api/v1/account/reset-password/finish', {
                key: resetKey,
                newPassword: values.newPassword,
                confirmPassword: values.confirmPassword,
            });

            setSuccess(true);
        } catch (error: unknown) {
            
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const backendMsg = error.response?.data?.message;

            if (backendMsg?.toLowerCase().includes('not strong')) {
                form.setFields([
                    { name: 'newPassword', errors: ['Password not strong'] },
                ]);
            } else if (backendMsg?.toLowerCase().includes('not the same')) {
                form.setFields([
                    { name: 'confirmPassword', errors: ['Password not match'] },
                ]);
            } else if (
                backendMsg?.toLowerCase().includes('reset key') ||
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                error.response?.status === 400 && !backendMsg
            ) {
                setErrorMsg('Link reset password invalid or over date!');
            } else {
                setErrorMsg(backendMsg || 'Wrong, please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // No key in URL at all
    if (!resetKey) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 16px' }}>
                <Result
                    status="error"
                    title="Link invalid"
                    subTitle="Link reset password invalid or over date!"
                    extra={
                        <Link to="/account/reset/request">
                            <Button type="primary">Required reset password</Button>
                        </Link>
                    }
                />
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 16px' }}>
                <Result
                    status="success"
                    title="Set password successfully"
                    subTitle="Password already change"
                    extra={
                        <Button type="primary" onClick={() => navigate('/login')}>
                            Go to login
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 16px' }}>
            <Card style={{ width: '100%', maxWidth: 420 }}>
                <Title level={3} style={{ marginBottom: 4 }}>
                    Reset password
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    Please input password for account
                </Text>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                    validateTrigger={['onBlur', 'onChange']}
                >
                    <Form.Item
                        name="newPassword"
                        label="New password"
                        rules={[
                            { required: true, message: 'Please input new password' },
                            {
                                min: PASSWORD_MIN_LENGTH,
                                max: PASSWORD_MAX_LENGTH,
                                message: `Password must have ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters!`,
                            },
                        ]}
                        hasFeedback
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Input new password" autoComplete="new-password" />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Confirm password"
                        dependencies={['newPassword']}
                        hasFeedback
                        rules={[
                            { required: true, message: 'Please input password!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Confirm password not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Input new password" autoComplete="new-password" />
                    </Form.Item>

                    {errorMsg && (
                        <div style={{ marginBottom: 16, color: '#ff4d4f', fontSize: 13 }}>{errorMsg}</div>
                    )}

                    <Form.Item shouldUpdate style={{ marginBottom: 0 }}>
                        {() => {
                            const hasErrors = form.getFieldsError().some(({ errors }) => errors.length > 0);
                            const touched = form.isFieldsTouched(['newPassword', 'confirmPassword'], false);
                            const allFilled = ['newPassword', 'confirmPassword'].every(
                                (f) => !!form.getFieldValue(f)
                            );
                            const disabled = hasErrors || !touched || !allFilled;

                            return (
                                <Button type="primary" htmlType="submit" loading={loading} disabled={disabled} block>
                                    Reset password
                                </Button>
                            );
                        }}
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default ResetPasswordFinish;