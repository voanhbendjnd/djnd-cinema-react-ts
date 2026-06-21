import React from 'react';
import { Modal, Descriptions, Badge, Space, Card, Tag, Empty } from 'antd';
import { type IRole, type IPermission } from '@/services/role.service';

interface DetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: IRole | null;
}

const DetailModalComponent: React.FC<DetailModalProps> = ({ isOpen, onClose, role }) => {
    // Format Date helper
    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        } catch (e) {
            return dateString;
        }
    };

    // Group permissions by module
    const rolePermissions = (role?.permissions as IPermission[]) || [];
    const groupedPermissions = rolePermissions.reduce((acc, permission) => {
        const moduleName = permission.module || 'OTHER';
        if (!acc[moduleName]) {
            acc[moduleName] = [];
        }
        acc[moduleName].push(permission);
        return acc;
    }, {} as Record<string, IPermission[]>);

    return (
        <Modal
            open={isOpen}
            title={
                <span style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', color: '#ffd700' }}>
                     Role Detail
                </span>
            }
            onCancel={onClose}
            width={700}
            footer={null}
            destroyOnClose
            style={{ top: 80 }}
            styles={{
                content: {
                    background: '#141414',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                },
                header: {
                    background: 'transparent',
                    borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
                    paddingBottom: '10px',
                },
            }}
        >
            <div style={{ marginTop: '20px' }}>
                <Descriptions bordered column={1} size="small" styles={{ label: { color: '#ffd700', background: 'rgba(255, 255, 255, 0.02)', fontWeight: 600 } }}>
                    <Descriptions.Item label="Role Code (Name)">
                        <span style={{ fontWeight: 600, color: '#fff', letterSpacing: '0.5px' }}>
                            {role?.name}
                        </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Description">
                        <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                            {role?.description || '-'}
                        </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Created Date">
                        <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                            {formatDate(role?.createdDate)}
                        </span>
                    </Descriptions.Item>
                </Descriptions>

                <h4 style={{ color: '#ffd700', marginTop: '24px', marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
                    Permissions List
                </h4>

                {rolePermissions.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span style={{ color: 'rgba(255,255,255,0.45)' }}>Role has no permissions assigned</span>}
                    />
                ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                        {Object.entries(groupedPermissions).map(([moduleName, items]) => (
                            <Card
                                key={moduleName}
                                size="small"
                                title={<span style={{ color: '#ffd700', fontSize: '13px' }}>Module: {moduleName}</span>}
                                style={{
                                    marginBottom: '10px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255, 215, 0, 0.1)',
                                }}
                            >
                                <Space size={[8, 12]} wrap>
                                    {items.map((p) => {
                                        let color = 'red';
                                        if (p.method === 'GET') color = 'green';
                                        if (p.method === 'POST') color = 'blue';
                                        if (p.method === 'PUT') color = 'orange';

                                        return (
                                            <Tag
                                                key={p.id}
                                                color="rgba(0, 0, 0, 0.6)"
                                                style={{
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    color: '#fff',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                }}
                                            >
                                                <Badge status={color as any} style={{ marginRight: '6px' }} />
                                                <span style={{ fontWeight: 600, marginRight: '4px' }}>
                                                    {p.name}:
                                                </span>
                                                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                                    {p.apiPath}
                                                </span>
                                            </Tag>
                                        );
                                    })}
                                </Space>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default DetailModalComponent;
