import React, { useState } from 'react';
import {Form, Input, Button, Typography, Select, notification} from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';

const { Title, Text } = Typography;
const { Option } = Select;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await authService.register(values);
      api.success({ 
        message: 'Success',
        description: 'Register successfully, please check mail activated profile',
        placement: 'topRight'
      });
      navigate('/login');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || 'Registration failed. Please check the fields.';
      
      api.error({
        message: 'Register failure',
        description: errorMsg,
        placement: 'topRight',
        duration: 5
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {contextHolder}
      <div className="glass-panel" style={{ borderRadius: 16, padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title className="cinema-title" level={2} style={{ margin: 0, color: '#ffd700', letterSpacing: '2px', fontWeight: 700 }}>RESERVE SEAT</Title>
          <Text style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '12px' }}>Join the Premiere Club</Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          size="large"
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="login"
            rules={[{ required: true, message: 'Alias is required!' }]}
          >
            <Input
              prefix={<UserOutlined style={{ marginRight: 8 }} />}
              placeholder="Alias (Username)"
              style={{ padding: '10px 16px', borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Email is required!' },
              { type: 'email', message: 'Not a valid Email!' }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ marginRight: 8 }} />}
              placeholder="Email Address"
              style={{ padding: '10px 16px', borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Full name is required!' }]}
          >
            <Input placeholder="Full Name" style={{ padding: '10px 16px', borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            name="gender"
            rules={[{ required: true, message: 'Gender selection is required!' }]}
          >
            <Select
              placeholder="Select Gender"
              dropdownStyle={{ background: '#141414', border: '1px solid rgba(255, 215, 0, 0.2)' }}
            >
              <Option value="MALE">Male</Option>
              <Option value="FEMALE">Female</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Password is required!' },
              { min: 4, message: 'Password must be at least 4 characters!' }
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined style={{ marginRight: 8 }} />}
              placeholder="Secure Password"
              style={{ padding: '10px 16px', borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your Password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ marginRight: 8 }} />}
              placeholder="Confirm Password"
              style={{ padding: '10px 16px', borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '48px', borderRadius: 8 }}>
              BECOME A MEMBER
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)' }}>Already hold a ticket? </Text>
            <Link to="/login" style={{ color: '#ffd700', borderBottom: '1px solid rgba(255,215,0,0.3)', paddingBottom: 2 }}>Enter Here</Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Register;
