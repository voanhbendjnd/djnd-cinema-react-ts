import React, {useEffect, useState} from 'react';
import {
    Avatar,
    Button,
    Card,
    Spin,
    Tag,
    Typography,
    notification,
    Upload,
    Modal,
    Form,
    Input,
    Select,
    Space,
} from 'antd';
import type { UploadProps, UploadRequestOption } from 'rc-upload/lib/interface';
import ImgCrop from 'antd-img-crop';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    IdcardOutlined,
    EnvironmentOutlined,
    StarOutlined,
    EditOutlined,
    SafetyCertificateOutlined,
    CameraOutlined,
    LoadingOutlined,
    LockOutlined,
    SaveOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosClient, {baseURL} from '@/services/axiosClient';

const { Title, Text } = Typography;

interface AccountInfo {
    id: number;
    name: string;
    login: string;
    email: string;
    gender: string;
    activated: boolean;
    avatarUrl: string | null;
    loyaltyPoints: number;
    identityCard: string | null;
    address: string | null;
    phone: string | null;
    createdDate: string;
    lastModifiedDate: string;
    createdBy: string;
    lastModifiedBy: string;
}

const GENDER_LABEL: Record<string, string> = {
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other',
};

const GENDER_COLOR: Record<string, string> = {
    MALE: '#1677ff',
    FEMALE: '#eb2f96',
    OTHER: '#722ed1',
};

const darkInputStyle: React.CSSProperties = {
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#f0ece3',
};

// ── Row đa năng: hiển thị view-mode hoặc edit-mode tuỳ prop `editing` ──
const InfoRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    editing?: boolean;
    editor?: React.ReactNode;
}> = ({ icon, label, value, editing, editor }) => (
    <div
        style={{
            display: 'flex',
            alignItems: editing ? 'center' : 'flex-start',
            gap: 14,
            padding: '14px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
    >
        <div
            style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(230,57,70,0.12)',
                border: '1px solid rgba(230,57,70,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e63946',
                fontSize: 15,
                flexShrink: 0,
            }}
        >
            {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: editing ? 4 : 3 }}>
                {label.toUpperCase()}
            </div>
            {editing ? (
                editor
            ) : (
                <div style={{ color: '#f0ece3', fontSize: 14 }}>
                    {value ?? <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}
                </div>
            )}
        </div>
    </div>
);

const modalStyles = {
    header: { background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' },
    content: { background: '#111', border: '1px solid rgba(255,255,255,0.08)' },
    body: { paddingTop: 16 },
    mask: { backdropFilter: 'blur(2px)' },
};

const cardEditBtnStyle = (active: boolean): React.CSSProperties => ({
    background: 'transparent',
    border: `1px solid ${active ? 'rgba(255,255,255,0.15)' : 'rgba(230,57,70,0.4)'}`,
    color: active ? 'rgba(255,255,255,0.55)' : '#e63946',
    fontSize: 12,
});

const AccountInfoPage: React.FC = () => {
    const [info, setInfo] = useState<AccountInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [api, contextHolder] = notification.useNotification();

    // ── Inline edit state cho profile (name + gender, hiển thị ở hero) ──
    const [profileEditing, setProfileEditing] = useState(false);
    const [profileSubmitting, setProfileSubmitting] = useState(false);
    const [profileForm] = Form.useForm();

    // ── Inline edit state cho Contact card ──
    const [contactEditing, setContactEditing] = useState(false);
    const [contactSubmitting, setContactSubmitting] = useState(false);
    const [contactForm] = Form.useForm();

    // ── Inline edit state cho Account info card ──
    const [accountEditing, setAccountEditing] = useState(false);
    const [accountSubmitting, setAccountSubmitting] = useState(false);
    const [accountForm] = Form.useForm();

    // ── Change password modal ──
    const [pwdOpen, setPwdOpen] = useState(false);
    const [pwdSubmitting, setPwdSubmitting] = useState(false);
    const [pwdForm] = Form.useForm();

    const fetchInfo = () => {
        return axiosClient
            .get<any>('/api/v1/account/info')
            .then((res) => {
                const data = res?.data ?? res;
                setInfo(data);
            })
            .catch(() => api.error({
                message: 'Cannot loading data account',
                placement: 'topRight',
            }));
    };

    useEffect(() => {
        fetchInfo().finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!info) return null;

    const initials = info.name
        .split(' ')
        .slice(-2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    const memberSince = dayjs(info.createdDate).format('MM/YYYY');
    const avatarSrc = avatarPreview
        ? avatarPreview
        : info.avatarUrl
            ? `${baseURL}/api/v1/files/${info.avatarUrl}`
            : undefined;

    // ── Avatar upload ──
    const beforeUpload = (file: File) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            api.error({ message: 'Only image files are allowed', placement: 'topRight' });
            return false;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            api.error({ message: 'Image must be smaller than 5MB', placement: 'topRight' });
            return false;
        }
        return true;
    };

    const customRequest = async (options: UploadRequestOption) => {
        const { file, onSuccess, onError } = options;
        const localPreviewUrl = URL.createObjectURL(file as Blob);
        setAvatarPreview(localPreviewUrl);
        setAvatarUploading(true);

        const formData = new FormData();
        formData.append('avatarUrl', file as Blob);

        try {
            await axiosClient.post('/api/v1/account/change-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            api.success({ message: 'Avatar updated successfully', placement: 'topRight' });
            await fetchInfo();
            onSuccess?.({});
        } catch (err) {
            api.error({ message: 'Failed to update avatar', placement: 'topRight' });
            setAvatarPreview(null);
            onError?.(err as Error);
        } finally {
            setAvatarUploading(false);
            URL.revokeObjectURL(localPreviewUrl);
        }
    };

    const uploadProps: UploadProps = {
        accept: 'image/*',
        showUploadList: false,
        beforeUpload,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-expect-error
        customRequest,
    };

    // ── Profile (name) inline edit ──
    const startProfileEdit = () => {
        profileForm.setFieldsValue({ name: info.name, gender: info.gender });
        setProfileEditing(true);
    };

    const cancelProfileEdit = () => {
        setProfileEditing(false);
        profileForm.resetFields();
    };

    const saveProfileEdit = async () => {
        try {
            const values = await profileForm.validateFields();
            setProfileSubmitting(true);

            const requests: Promise<any>[] = [];
            if (values.name !== info.name) {
                requests.push(
                    axiosClient.post('/api/v1/account/rename', null, { params: { name: values.name } })
                );
            }
            if (values.gender !== info.gender) {
                requests.push(
                    axiosClient.patch('/api/v1/account/change-info', {
                        id: info.id,
                        email: info.email,
                        gender: values.gender,
                        phone: info.phone,
                        address: info.address,
                        identityCard: info.identityCard,
                    })
                );
            }

            if (requests.length > 0) {
                await Promise.all(requests);
                api.success({ message: 'Profile updated successfully', placement: 'topRight' });
                await fetchInfo();
            }
            setProfileEditing(false);
        } catch (err: any) {
            if (err?.errorFields) return;
            const msg = err?.response?.data?.message || 'Failed to update profile';
            api.error({ message: msg, placement: 'topRight' });
        } finally {
            setProfileSubmitting(false);
        }
    };

    // ── Contact card inline edit (email, phone, address, dob) ──
    const startContactEdit = () => {
        contactForm.setFieldsValue({
            email: info.email,
            phone: info.phone,
            address: info.address,
        });
        setContactEditing(true);
    };

    const cancelContactEdit = () => {
        setContactEditing(false);
        contactForm.resetFields();
    };

    const saveContactEdit = async () => {
        try {
            const values = await contactForm.validateFields();
            setContactSubmitting(true);

            await axiosClient.patch('/api/v1/account/change-info', {
                id: info.id,
                email: values.email,
                gender: info.gender,
                phone: values.phone,
                address: values.address,
                identityCard: info.identityCard
            });

            api.success({ message: 'Contact information updated', placement: 'topRight' });
            setContactEditing(false);
            await fetchInfo();
        } catch (err: any) {
            if (err?.errorFields) return;
            const msg = err?.response?.data?.message || 'Failed to update contact information';
            api.error({ message: msg, placement: 'topRight' });
        } finally {
            setContactSubmitting(false);
        }
    };

    // ── Account info card inline edit (identityCard) ──
    const startAccountEdit = () => {
        accountForm.setFieldsValue({ identityCard: info.identityCard });
        setAccountEditing(true);
    };

    const cancelAccountEdit = () => {
        setAccountEditing(false);
        accountForm.resetFields();
    };

    const saveAccountEdit = async () => {
        try {
            const values = await accountForm.validateFields();
            setAccountSubmitting(true);

            await axiosClient.patch('/api/v1/account/change-info', {
                id: info.id,
                email: info.email,
                gender: info.gender,
                phone: info.phone,
                address: info.address,
                identityCard: values.identityCard,
            });

            api.success({ message: 'Account information updated', placement: 'topRight' });
            setAccountEditing(false);
            await fetchInfo();
        } catch (err: any) {
            if (err?.errorFields) return;
            const msg = err?.response?.data?.message || 'Failed to update account information';
            api.error({ message: msg, placement: 'topRight' });
        } finally {
            setAccountSubmitting(false);
        }
    };

    // ── Change password ──
    const handlePasswordSubmit = async () => {
        try {
            const values = await pwdForm.validateFields();
            setPwdSubmitting(true);

            await axiosClient.post('/api/v1/account/change-password', {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });

            api.success({ message: 'Password changed successfully', placement: 'topRight' });
            setPwdOpen(false);
            pwdForm.resetFields();
        } catch (err: any) {
            if (err?.errorFields) return;
            const msg = err?.response?.data?.message || 'Failed to change password';
            api.error({ message: msg, placement: 'topRight' });
        } finally {
            setPwdSubmitting(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div
                style={{
                    minHeight: '100vh',
                    background: '#0a0a0a',
                    padding: '32px 16px',
                    fontFamily: "'Barlow', sans-serif",
                }}
            >
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    {/* ── Page title ── */}
                    <div style={{ marginBottom: 28 }}>
                        <Title
                            level={3}
                            style={{
                                color: '#f0ece3',
                                margin: 0,
                                fontFamily: "'Bebas Neue', sans-serif",
                                letterSpacing: 3,
                                fontSize: 32,
                            }}
                        >
                            MY ACCOUNT
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1 }}>
                            INFORMATION ACCOUNT
                        </Text>
                    </div>

                    {/* ── Hero card: avatar + name + points ── */}
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #1a0000 0%, #2d0a0a 50%, #111 100%)',
                            border: '1px solid rgba(230,57,70,0.2)',
                            borderRadius: 12,
                            padding: '28px 28px 24px',
                            marginBottom: 20,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 24,
                            flexWrap: 'wrap',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <span
                            style={{
                                position: 'absolute',
                                right: -10,
                                top: -10,
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: 120,
                                color: 'rgba(230,57,70,0.04)',
                                userSelect: 'none',
                                letterSpacing: -4,
                                lineHeight: 1,
                            }}
                        >
            MEMBER
          </span>

                        <ImgCrop rotationSlider cropShape="round" quality={1} aspect={1}>

                            <Upload {...uploadProps}>
                                <div
                                    style={{
                                        position: 'relative',
                                        width: 96,
                                        height: 96,
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                    }}
                                    className="avatar-upload-wrapper"
                                >
                                    <Avatar
                                        size={96}
                                        src={avatarSrc}
                                        style={{
                                            background: 'linear-gradient(135deg, #e63946, #c1121f)',
                                            fontSize: 32,
                                            fontWeight: 700,
                                            border: '3px solid rgba(230,57,70,0.4)',
                                        }}
                                    >
                                        {!avatarSrc && initials}
                                    </Avatar>
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            borderRadius: '50%',
                                            background: 'rgba(0,0,0,0.45)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: avatarUploading ? 1 : 0,
                                            transition: 'opacity 0.2s',
                                        }}
                                        className="avatar-upload-overlay"
                                    >
                                        {avatarUploading ? (
                                            <LoadingOutlined style={{ color: '#f0ece3', fontSize: 22 }} />
                                        ) : (
                                            <CameraOutlined style={{ color: '#f0ece3', fontSize: 22 }} />
                                        )}
                                    </div>
                                </div>
                            </Upload>
                        </ImgCrop>

                        <div style={{ flex: 1, minWidth: 180 }}>
                            {profileEditing ? (
                                <Form form={profileForm} layout="vertical" requiredMark={false}>
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        <Form.Item
                                            name="name"
                                            label={<span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>FULL NAME</span>}
                                            rules={[{ required: true, message: 'Name is required' }]}
                                            style={{ marginBottom: 8, minWidth: 180, flex: 1 }}
                                        >
                                            <Input style={darkInputStyle} />
                                        </Form.Item>
                                        <Form.Item
                                            name="gender"
                                            label={<span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>GENDER</span>}
                                            rules={[{ required: true, message: 'Gender is required' }]}
                                            style={{ marginBottom: 8, minWidth: 140 }}
                                        >
                                            <Select
                                                options={[
                                                    { value: 'MALE', label: 'Male' },
                                                    { value: 'FEMALE', label: 'Female' },
                                                    { value: 'OTHER', label: 'Other' },
                                                ]}
                                            />
                                        </Form.Item>
                                    </div>
                                </Form>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <Text
                                        style={{
                                            fontSize: 22,
                                            fontWeight: 700,
                                            color: '#f0ece3',
                                            fontFamily: "'Barlow Condensed', sans-serif",
                                            letterSpacing: 1,
                                        }}
                                    >
                                        {info.name}
                                    </Text>
                                    <Tag
                                        style={{
                                            background: 'rgba(230,57,70,0.15)',
                                            border: '1px solid rgba(230,57,70,0.3)',
                                            color: '#e63946',
                                            borderRadius: 3,
                                            fontSize: 10,
                                            letterSpacing: 1.5,
                                            fontFamily: "'Barlow Condensed', sans-serif",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {info.activated ? 'ACTIVE' : 'INACTIVE'}
                                    </Tag>
                                    <Tag
                                        style={{
                                            background: GENDER_COLOR[info.gender] + '22',
                                            border: `1px solid ${GENDER_COLOR[info.gender]}55`,
                                            color: GENDER_COLOR[info.gender],
                                            borderRadius: 3,
                                            fontSize: 10,
                                            letterSpacing: 1.5,
                                            fontFamily: "'Barlow Condensed', sans-serif",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {GENDER_LABEL[info.gender] ?? info.gender}
                                    </Tag>
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: profileEditing ? 4 : 0 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                                    @{info.login} · Member since {memberSince}
                                </Text>

                                {profileEditing ? (
                                    <Space size={6}>
                                        <Button
                                            size="small"
                                            icon={<SaveOutlined />}
                                            loading={profileSubmitting}
                                            onClick={saveProfileEdit}
                                            style={{ background: '#e63946', borderColor: '#e63946', color: '#fff' }}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            size="small"
                                            icon={<CloseOutlined />}
                                            onClick={cancelProfileEdit}
                                            style={cardEditBtnStyle(true)}
                                        >
                                            Cancel
                                        </Button>
                                    </Space>
                                ) : (
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={startProfileEdit}
                                        style={{ color: 'rgba(255,255,255,0.4)' }}
                                    />
                                )}
                            </div>
                        </div>

                        <div
                            style={{
                                background: 'rgba(255,215,0,0.06)',
                                border: '1px solid rgba(255,215,0,0.2)',
                                borderRadius: 10,
                                padding: '16px 24px',
                                textAlign: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <StarOutlined style={{ color: '#ffd700', fontSize: 20, marginBottom: 6, display: 'block' }} />
                            <div
                                style={{
                                    fontSize: 30,
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    color: '#ffd700',
                                    letterSpacing: 2,
                                    lineHeight: 1,
                                }}
                            >
                                {info.loyaltyPoints}
                            </div>
                            <div style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,215,0,0.6)', marginTop: 4 }}>
                                LOYALTY POINTS
                            </div>
                        </div>
                    </div>

                    {/* ── Two-column info ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* ── Left: Contact Information (inline editable) ── */}
                        <Card
                            title={
                                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 2, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                CONTACT INFORMATION
              </span>
                            }
                            extra={
                                contactEditing ? (
                                    <Space size={6}>
                                        <Button size="small" icon={<SaveOutlined />} loading={contactSubmitting} onClick={saveContactEdit} style={{ background: '#e63946', borderColor: '#e63946', color: '#fff' }}>
                                            Save
                                        </Button>
                                        <Button size="small" icon={<CloseOutlined />} onClick={cancelContactEdit} style={cardEditBtnStyle(true)}>
                                            Cancel
                                        </Button>
                                    </Space>
                                ) : (
                                    <Button size="small" icon={<EditOutlined />} onClick={startContactEdit} style={cardEditBtnStyle(false)}>
                                        Edit
                                    </Button>
                                )
                            }
                            styles={{
                                header: { background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: 44 },
                                body: { padding: '0 20px' },
                            }}
                            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                        >
                            <Form form={contactForm} component={false}>
                                <InfoRow
                                    icon={<MailOutlined />}
                                    label="Email"
                                    value={info.email}
                                    editing={contactEditing}
                                    editor={
                                        <Form.Item
                                            name="email"
                                            style={{ margin: 0 }}
                                            rules={[
                                                { required: true, message: 'Email is required' },
                                                { type: 'email', message: 'Invalid email format' },
                                            ]}
                                        >
                                            <Input size="small" style={darkInputStyle} />
                                        </Form.Item>
                                    }
                                />
                                <InfoRow
                                    icon={<PhoneOutlined />}
                                    label="Phone"
                                    value={info.phone}
                                    editing={contactEditing}
                                    editor={
                                        <Form.Item
                                            name="phone"
                                            style={{ margin: 0 }}
                                            rules={[{ pattern: /^[0-9]{9,11}$/, message: 'Invalid phone number' }]}
                                        >
                                            <Input size="small" style={darkInputStyle} />
                                        </Form.Item>
                                    }
                                />
                                <InfoRow
                                    icon={<EnvironmentOutlined />}
                                    label="Address"
                                    value={info.address}
                                    editing={contactEditing}
                                    editor={
                                        <Form.Item name="address" style={{ margin: 0 }}>
                                            <Input size="small" style={darkInputStyle} />
                                        </Form.Item>
                                    }
                                />
                                {/*<InfoRow*/}
                                {/*    icon={<CalendarOutlined />}*/}
                                {/*    label="Date of birth"*/}
                                {/*    value={info.dateOfBirth ? dayjs(info.dateOfBirth).format('DD/MM/YYYY') : null}*/}
                                {/*    editing={contactEditing}*/}
                                {/*    editor={*/}
                                {/*        <Form.Item name="dateOfBirth" style={{ margin: 0 }}>*/}
                                {/*            <DatePicker size="small" format="DD/MM/YYYY" style={{ width: '100%', ...darkInputStyle }} />*/}
                                {/*        </Form.Item>*/}
                                {/*    }*/}
                                {/*/>*/}
                            </Form>
                        </Card>

                        {/* ── Right: Account Information (inline editable cho identityCard) ── */}
                        <Card
                            title={
                                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 2, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                INFORMATION ACCOUNT
              </span>
                            }
                            extra={
                                accountEditing ? (
                                    <Space size={6}>
                                        <Button size="small" icon={<SaveOutlined />} loading={accountSubmitting} onClick={saveAccountEdit} style={{ background: '#e63946', borderColor: '#e63946', color: '#fff' }}>
                                            Save
                                        </Button>
                                        <Button size="small" icon={<CloseOutlined />} onClick={cancelAccountEdit} style={cardEditBtnStyle(true)}>
                                            Cancel
                                        </Button>
                                    </Space>
                                ) : (
                                    <Button size="small" icon={<EditOutlined />} onClick={startAccountEdit} style={cardEditBtnStyle(false)}>
                                        Edit
                                    </Button>
                                )
                            }
                            styles={{
                                header: { background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: 44 },
                                body: { padding: '0 20px' },
                            }}
                            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                        >
                            <InfoRow icon={<UserOutlined />} label="Username" value={info.login} />

                            <Form form={accountForm} component={false}>
                                <InfoRow
                                    icon={<IdcardOutlined />}
                                    label="CCCD / CMND"
                                    value={info.identityCard}
                                    editing={accountEditing}
                                    editor={
                                        <Form.Item
                                            name="identityCard"
                                            style={{ margin: 0 }}
                                            rules={[{ pattern: /^[0-9]{9,12}$/, message: 'Invalid identity card number' }]}
                                        >
                                            <Input size="small" style={darkInputStyle} />
                                        </Form.Item>
                                    }
                                />
                            </Form>

                            <InfoRow
                                icon={<SafetyCertificateOutlined />}
                                label="Create at"
                                value={dayjs(info.createdDate).format('DD/MM/YYYY HH:mm')}
                            />
                            {/*<InfoRow icon={<CalendarOutlined />} label="Last modified at" value={lastUpdate} />*/}
                        </Card>
                    </div>

                    {/* ── Actions ── */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                        <Button
                            icon={<LockOutlined />}
                            onClick={() => setPwdOpen(true)}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: 'rgba(255,255,255,0.55)',
                                borderRadius: 4,
                                fontFamily: "'Barlow Condensed', sans-serif",
                                letterSpacing: 1,
                            }}
                        >
                            Change password
                        </Button>
                    </div>

                    {/* ── Meta footer ── */}
                    <div
                        style={{
                            marginTop: 24,
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 6,
                            display: 'flex',
                            gap: 20,
                            flexWrap: 'wrap',
                        }}
                    >
                        <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                            Created by: <span style={{ color: 'rgba(255,255,255,0.45)' }}>{info.createdBy}</span>
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                            Edit by: <span style={{ color: 'rgba(255,255,255,0.45)' }}>{info.lastModifiedBy}</span>
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                            ID: <span style={{ color: 'rgba(255,255,255,0.45)' }}>#{info.id}</span>
                        </Text>
                    </div>
                </div>
            </div>

            {/* ── Modal: Change password (giữ modal, vì cần ẩn hoàn toàn) ── */}
            <Modal
                title={
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1.5, color: '#f0ece3' }}>
            CHANGE PASSWORD
          </span>
                }
                open={pwdOpen}
                onCancel={() => { setPwdOpen(false); pwdForm.resetFields(); }}
                onOk={handlePasswordSubmit}
                confirmLoading={pwdSubmitting}
                okText="Change"
                okButtonProps={{ style: { background: '#e63946', borderColor: '#e63946' } }}
                cancelButtonProps={{ style: { background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' } }}
                styles={modalStyles}
                destroyOnClose
            >
                <Form form={pwdForm} layout="vertical" requiredMark={false}>
                    <Form.Item
                        name="currentPassword"
                        label={<span style={{ color: 'rgba(255,255,255,0.6)' }}>Current password</span>}
                        rules={[{ required: true, message: 'Current password is required' }]}
                    >
                        <Input.Password style={darkInputStyle} />
                    </Form.Item>

                    <Form.Item
                        name="newPassword"
                        label={<span style={{ color: 'rgba(255,255,255,0.6)' }}>New password</span>}
                        rules={[
                            { required: true, message: 'New password is required' },
                            { min: 6, message: 'Password must be at least 6 characters' },
                        ]}
                    >
                        <Input.Password style={darkInputStyle} />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label={<span style={{ color: 'rgba(255,255,255,0.6)' }}>Confirm new password</span>}
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Please confirm the new password' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Passwords do not match'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password style={darkInputStyle} />
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
                .avatar-upload-wrapper:hover .avatar-upload-overlay {
                    opacity: 1 !important;
                }
                .ant-form-item-explain-error {
                    font-size: 12px;
                }
            `}</style>
        </>
    );
};

export default AccountInfoPage;