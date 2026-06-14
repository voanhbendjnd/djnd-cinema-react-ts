import React, {useEffect, useState } from 'react';
import {
    Form,
    Input,
    Select,
    Switch,
    Button,
    Card,
    Typography,
    message,
    Row,
    Col,
    Space,
} from 'antd';
import {
    UserOutlined,
    MailOutlined,
    IdcardOutlined,
    PhoneOutlined,
    SafetyOutlined,
} from '@ant-design/icons';
import {type AdminUserDTO} from "@/types/user.types.ts";
import {adminUserService} from "@/services/user.service.ts";
import {type RoleUserDTO, roleService} from "@/services/role.service.ts";

const { Title, Text } = Typography;
interface Props {
    onClose?: () => void;
}
const { Option } = Select;

const AdminCreateUser: React.FC<Props> = ({ onClose }) => {
    const [form] = Form.useForm();
    const [roles, setRoles] = useState<RoleUserDTO[]>([]);
    const [loading, setLoading] = useState(false);



    const fetchRoles = async () => {
        try {
            setLoading(true);
            const res = await roleService.getAllRoles() as unknown as IBackendRes<RoleUserDTO>;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setRoles(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchRoles();
    }, []);
    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const payload: AdminUserDTO = {
                login: values.login.trim(),
                email: values.email.trim(),
                name: values.name.trim(),
                gender: values.gender,
                phone: values.phone?.trim() || null,
                roleId: values.roleId,
                activated: values.activated ?? true,
                langKey: 'vi',
            };

            const res: any = await adminUserService.createUserAdmin(payload);

            message.success({
                content: `Create account "${res?.data?.login ?? payload.login}" success. Email already send.`,
                style: { marginTop: '20vh' },
            });

            form.resetFields();
            onClose?.();
        } catch (error: any) {
            const status = error.response?.status;
            const backendMsg = error.response?.data?.message;

            if (status === 400 && backendMsg) {
                if (backendMsg.toLowerCase().includes('login')) {
                    form.setFields([{ name: 'login', errors: ['Login already exist'] }]);
                } else if (backendMsg.toLowerCase().includes('email')) {
                    form.setFields([{ name: 'email', errors: ['Email already used!'] }]);
                } else if (backendMsg.toLowerCase().includes('phone')) {
                    form.setFields([{ name: 'phone', errors: ['Phone already exists!'] }]);
                } else {
                    message.error({ content: backendMsg, style: { marginTop: '20vh' } });
                }
            } else if (status === 404) {
                form.setFields([{ name: 'roleId', errors: ['Role invalid!'] }]);
            } else {
                message.error({
                    content: backendMsg || 'Create account failure, try again.',
                    style: { marginTop: '20vh' },
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
            <Title level={3} style={{ marginBottom: 4 }}>
                Create user
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                Email activated and reset password will send auto for user
            </Text>

            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark="optional"
                    initialValues={{ activated: true }}
                    validateTrigger={['onBlur', 'onChange']}
                    scrollToFirstError
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="login"
                                label="Username login"
                                rules={[
                                    { required: true, message: 'Please input username' },
                                    { min: 3, max: 50, message: 'Login must 3-50 characters' },
                                    {
                                        pattern: /^[a-zA-Z0-9._-]+$/,
                                        message: 'Only contain . _ -',
                                    },
                                ]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="username" />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Email not empty!' },
                                    { type: 'email', message: 'Email invalid!' },
                                    { max: 100, message: 'Email max 100 characters' },
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="user@example.com" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Họ và tên"
                                rules={[
                                    { required: true, message: 'Please enter full name!' },
                                    { min: 2, max: 100, message: 'Name min 2 and max 100 characters!' },
                                    { whitespace: true, message: 'Name invalid!' },
                                ]}
                            >
                                <Input prefix={<IdcardOutlined />} placeholder="Adam Vo" />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                name="phone"
                                label="Số điện thoại"
                                rules={[
                                    {
                                        pattern: /^0\d{9,10}$/,
                                        message: 'Phone invalid (ex: 0912345678)!',
                                    },
                                ]}
                            >
                                <Input prefix={<PhoneOutlined />} placeholder="0912345678 (optinal)" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="gender"
                                label="Giới tính"
                                rules={[{ required: true, message: 'Please select gender!' }]}
                            >
                                <Select placeholder="Select gender">
                                    <Option value="MALE">Male</Option>
                                    <Option value="FEMALE">Female</Option>
                                    <Option value="OTHER">Other</Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                name="roleId"
                                label="Vai trò"
                                rules={[{ required: true, message: 'Please select role' }]}
                            >
                                <Select
                                    placeholder="Select role"
                                    loading={loading}
                                    suffixIcon={<SafetyOutlined />}
                                >
                                    {roles.map((role) => (
                                        <Option key={role.id} value={role.id}>
                                            {role.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="activated" label="Activated now" valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <Form.Item shouldUpdate style={{ marginTop: 16, marginBottom: 0 }}>
                        {() => {
                            const requiredFields = ['login', 'email', 'name', 'gender', 'roleId'];
                            const hasErrors = form.getFieldsError().some(({ errors }) => errors.length > 0);
                            const allFilled = requiredFields.every((f) => {
                                const v = form.getFieldValue(f);
                                return v !== undefined && v !== null && v !== '';
                            });
                            const disabled = hasErrors || !allFilled;

                            return (
                                <Space>
                                    <Button type="primary" htmlType="submit" loading={loading} disabled={disabled}>
                                        Create
                                    </Button>
                                    <Button onClick={() => onClose?.()}>
                                        Cancel
                                    </Button>
                                </Space>
                            );
                        }}
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default AdminCreateUser;