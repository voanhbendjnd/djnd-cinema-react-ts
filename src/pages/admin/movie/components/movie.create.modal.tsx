import React, {useEffect, useState} from 'react';
import {
  Avatar,
  Button,
  Card,
  Spin,
  Tag,
  Typography,
  Upload,
  notification,
} from 'antd';
import type { UploadProps, RcFile } from 'antd/es/upload';
import ImgCrop from 'antd-img-crop';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  StarOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  CameraOutlined,
  LoadingOutlined,
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
  dateOfBirth: string | null;
  loyaltyPoints: string;
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

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
    <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
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
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 3 }}>
          {label.toUpperCase()}
        </div>
        <div style={{ color: '#f0ece3', fontSize: 14 }}>{value ?? <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}</div>
      </div>
    </div>
);

const AccountInfoPage: React.FC = () => {
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    axiosClient
        .get<any>('/api/v1/account/info')
        .then((res) => {
          const data = res?.data ?? res;
          setInfo(data);
        })
        .catch(() =>    api.error({
          message:'Cannot loading data account',
          placement: 'topRight'
        }))
        .finally(() => setLoading(false));
  }, []);

  const beforeCrop = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      api.error({
        message: 'Invalid file',
        description: 'Please select an image file.',
        placement: 'topRight',
      });
    }
    return isImage;
  };

  const uploadAvatar = async (croppedFile: File) => {
    const formData = new FormData();
    formData.append('avatarUrl', croppedFile);

    setAvatarUploading(true);
    try {
      await axiosClient.post('/api/v1/account/change-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Show a local preview immediately while we don't have the
      // server-generated file name back from this endpoint.
      const localPreviewUrl = URL.createObjectURL(croppedFile);
      setInfo((prev) => (prev ? { ...prev, avatarUrl: localPreviewUrl } : prev));

      api.success({
        message: 'Avatar updated',
        placement: 'topRight',
      });
    } catch (err) {
      api.error({
        message: 'Cannot update avatar',
        placement: 'topRight',
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const customUploadRequest: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    try {
      await uploadAvatar(file as File);
      onSuccess?.({}, new XMLHttpRequest());
    } catch (err) {
      onError?.(err as Error);
    }
  };

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
  const lastUpdate = dayjs(info.lastModifiedDate).format('DD/MM/YYYY HH:mm');
  const avatarSrc = info.avatarUrl
      ? (info.avatarUrl.startsWith('blob:') ? info.avatarUrl : `${baseURL}/api/v1/files/${info.avatarUrl}`)
      : undefined;
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
              {/* Decorative bg text */}
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

              <div
                  style={{
                    position: 'relative',
                    width: 96,
                    height: 96,
                    flexShrink: 0,
                  }}
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
                  {!info.avatarUrl && initials}
                </Avatar>

                {/* Edit avatar overlay button */}
                <ImgCrop
                    rotationSlider
                    modalTitle="Edit avatar"
                    aspect={1}
                    quality={1}
                    beforeCrop={beforeCrop}
                >
                  <Upload
                      accept="image/*"
                      showUploadList={false}
                      customRequest={customUploadRequest}
                      disabled={avatarUploading}
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        zIndex: 10,
                        lineHeight: 0,
                      }}
                  >
                    <div
                        title="Change avatar"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: '#e63946',
                          border: '2px solid #0a0a0a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: avatarUploading ? 'default' : 'pointer',
                          color: '#fff',
                          fontSize: 13,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        }}
                    >
                      {avatarUploading ? <LoadingOutlined spin /> : <CameraOutlined />}
                    </div>
                  </Upload>
                </ImgCrop>
              </div>

              <div style={{ flex: 1, minWidth: 180 }}>
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
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                  @{info.login} · Member since {memberSince}
                </Text>
              </div>

              {/* Loyalty points */}
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
              {/* Left: contact */}
              <Card
                  title={
                    <span
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          letterSpacing: 2,
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.55)',
                        }}
                    >
                CONTACT INFORMATION
              </span>
                  }
                  styles={{
                    header: {
                      background: 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      minHeight: 44,
                    },
                    body: { padding: '0 20px' },
                  }}
                  style={{
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                  }}
              >
                <InfoRow icon={<MailOutlined />} label="Email" value={info.email} />
                <InfoRow icon={<PhoneOutlined />} label="Phone" value={info.phone} />
                <InfoRow icon={<EnvironmentOutlined />} label="Address" value={info.address} />
                <InfoRow
                    icon={<CalendarOutlined />}
                    label="Date of birth"
                    value={info.dateOfBirth ? dayjs(info.dateOfBirth).format('DD/MM/YYYY') : null}
                />
              </Card>

              {/* Right: identity + account meta */}
              <Card
                  title={
                    <span
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          letterSpacing: 2,
                          fontSize: 13,
                          color: 'rgba(255,255,255,0.55)',
                        }}
                    >
                INFORMATION ACCOUNT
              </span>
                  }
                  styles={{
                    header: {
                      background: 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      minHeight: 44,
                    },
                    body: { padding: '0 20px' },
                  }}
                  style={{
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                  }}
              >
                <InfoRow icon={<UserOutlined />} label="Username" value={info.login} />
                <InfoRow
                    icon={<IdcardOutlined />}
                    label="CCCD / CMND"
                    value={info.identityCard}
                />
                <InfoRow
                    icon={<SafetyCertificateOutlined />}
                    label="Create at"
                    value={dayjs(info.createdDate).format('DD/MM/YYYY HH:mm')}
                />
                <InfoRow
                    icon={<CalendarOutlined />}
                    label="Last modified at"
                    value={lastUpdate}
                />
              </Card>
            </div>

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Button
                  icon={<EditOutlined />}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(230,57,70,0.4)',
                    color: '#e63946',
                    borderRadius: 4,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    letterSpacing: 1,
                    fontWeight: 600,
                  }}
              >
                Edit
              </Button>
              <Button
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
      </>

  );
};

export default AccountInfoPage;