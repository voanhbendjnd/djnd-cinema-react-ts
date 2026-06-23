import React, { useEffect, useState } from 'react';
import { Modal, Descriptions, Avatar, Tag, Spin, Typography, Divider, Space, Empty } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    CalendarOutlined,
    IdcardOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { userService } from '@/services/user.service.ts';
import type {UserDTO} from "@/types/user.types.ts";

const { Text, Title } = Typography;



interface UserDetailModalProps {
    open: boolean;
    userId: number | null;
    onClose: () => void;
}

const GENDER_LABELS: Record<string, string> = {
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other',
};

const GENDER_COLORS: Record<string, string> = {
    MALE: 'blue',
    FEMALE: 'magenta',
    OTHER: 'default',
};

// Generate a stable pastel-ish color from the user's name, so each avatar
// has a consistent identity-like color instead of always defaulting to grey.
const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 55%, 50%)`;
};

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const UserDetailModal: React.FC<UserDetailModalProps> = ({ open, userId, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<UserDTO | null>(null);

    useEffect(() => {
        if (!open || userId == null) {
            setUser(null);
            return;
        }

        const load = async () => {
            setLoading(true);
            try {
                const res = await userService.getUserById(userId);
                setUser(res.data as unknown as UserDTO);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [open, userId]);

    const formatDate = (d?: string) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—');

    return (
        <Modal
            title="User details"
            open={open}
            onCancel={onClose}
            footer={null}
            width={600}
            destroyOnClose
        >
            <Spin spinning={loading}>
                {!loading && !user ? (
                    <Empty description="Không tìm thấy thông tin người dùng" style={{ padding: '40px 0' }} />
                ) : (
                    <div style={{ minHeight: 200 }}>
                        {/* ── Header: avatar + name + login ── */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                marginBottom: 20,
                            }}
                        >
                            <Avatar
                                size={64}
                                style={{
                                    backgroundColor: user ? stringToColor(user.name || user.login) : '#888',
                                    fontSize: 22,
                                    fontWeight: 600,
                                }}
                            >
                                {getInitials(user?.name || user?.login)}
                            </Avatar>
                            <div>
                                <Title level={4} style={{ margin: 0 }}>
                                    {user?.name || '—'}
                                </Title>
                                <Space size={6}>
                                    <Text type="secondary">@{user?.login}</Text>
                                    {user?.gender && (
                                        <Tag color={GENDER_COLORS[user.gender] ?? 'default'}>
                                            {GENDER_LABELS[user.gender] ?? user.gender}
                                        </Tag>
                                    )}
                                </Space>
                            </div>
                        </div>

                        <Divider style={{ margin: '12px 0 20px' }} />

                        {/* ── Contact info ── */}
                        <Descriptions column={1} size="middle" labelStyle={{ width: 130 }}>
                            <Descriptions.Item
                                label={
                                    <Space size={6}>
                                        <IdcardOutlined /> ID
                                    </Space>
                                }
                            >
                                {user?.id}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={
                                    <Space size={6}>
                                        <UserOutlined /> Login
                                    </Space>
                                }
                            >
                                {user?.login || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={
                                    <Space size={6}>
                                        <MailOutlined /> Email
                                    </Space>
                                }
                            >
                                {user?.email || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={
                                    <Space size={6}>
                                        <PhoneOutlined /> Phone
                                    </Space>
                                }
                            >
                                {user?.phone || '—'}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider style={{ margin: '20px 0' }} />

                        {/* ── Audit info ── */}
                        <Title level={5} style={{ marginBottom: 12 }}>
                            History
                        </Title>
                        <Descriptions column={1} size="small" labelStyle={{ width: 130 }}>
                            <Descriptions.Item
                                label={
                                    <Space size={6}>
                                        <CalendarOutlined /> Created
                                    </Space>
                                }
                            >
                                <Text>{formatDate(user?.createdDate)}</Text>
                                {user?.createdBy && (
                                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                        by {user.createdBy}
                                    </Text>
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={
                                    <Space size={6}>
                                        <CalendarOutlined /> Last modified
                                    </Space>
                                }
                            >
                                <Text>{formatDate(user?.lastModifiedDate)}</Text>
                                {user?.lastModifiedBy && (
                                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                        by {user.lastModifiedBy}
                                    </Text>
                                )}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Spin>
        </Modal>
    );
};

export default UserDetailModal;