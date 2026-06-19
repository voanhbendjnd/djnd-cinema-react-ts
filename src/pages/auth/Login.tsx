import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import '@/styles/auth.css';
const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const onFinish = async (values: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authService.login(values) as unknown as IBackendRes<ILoginRes>;
      const accessToken = res?.data?.accessToken;
      const user = res?.data?.user;
      if (accessToken && user) {
        setAuth(accessToken, user);
        message.success("Login success");

        const role = useAuthStore.getState().role;
        if (role === 'ROLE_ADMIN') {
          navigate('/admin/employees');
        } else {
          navigate('/');
        }
      } else {
         message.error('Invalid response format from server.');
      }
    } catch (error: any) {

      const msg = error.response?.data?.message || error.response?.data?.detail || 'Username or password incorrect';
      setErrorMsg(msg); // Lưu vào state để hiển thị bằng Alert
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-container">
        <div className="glass-panel" style={{ borderRadius: 16, padding: '48px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Title className="cinema-title" level={1} style={{ margin: 0, color: '#ffd700', letterSpacing: '2px', fontWeight: 700 }}>PREMIERE</Title>
            <Text style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '12px' }}>Exclusive Cinema Access</Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            size="large"
            layout="vertical"
            requiredMark={false}
          >
            {errorMsg && (
              <Alert 
                message={errorMsg} 
                type="error" 
                showIcon 
                style={{ marginBottom: 24, borderRadius: 8 }} 
              />
            )}

            <Form.Item
              name="login"
              rules={[{ required: true, message: 'Please provide your Username or Email.' }]}
            >
              <Input
                prefix={<UserOutlined style={{ marginRight: 8 }} />}
                placeholder="Username or Email"
                style={{ padding: '12px 16px', borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Password is required for entry.' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ marginRight: 8 }} />}
                placeholder="Password"
                style={{ padding: '12px 16px', borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 32 }}>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '48px', borderRadius: 8 }}>
                ENTER
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)' }}>Not on the guest list? </Text>
              <Link to="/register" style={{ color: '#ffd700', borderBottom: '1px solid rgba(255,215,0,0.3)', paddingBottom: 2 }}>Request Invite</Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;
