import React, { useEffect, useRef, useState } from 'react';
import { type ActionType, type ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Input, Popconfirm, notification, Select } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    SearchOutlined,
    DoubleLeftOutlined,
    LeftOutlined,
    RightOutlined,
    DoubleRightOutlined,
} from '@ant-design/icons';
import { roleService, type IRole } from '@/services/role.service';
import RoleModalComponent from './role.modal';
import DetailModalComponent from './detail.modal';

const RoleManagement: React.FC = () => {
    const actionRef = useRef<ActionType>(null);

    // 2. States Management
    const [pagination, setPagination] = useState<{
        page: number;
        size: number;
        totalElements: number;
    }>({
        page: 1,
        size: 10,
        totalElements: 0,
    });

    // Modal states
    const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [selectedRole, setSelectedRole] = useState<IRole | null>(null);

    // Search query states
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedQuery, setDebouncedQuery] = useState<string>('');

    // Notification API
    const [api, contextHolder] = notification.useNotification();

    // 1. Debounce Search Input (300ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            // Reset to page 1 when query changes
            setPagination((prev) => ({ ...prev, page: 1 }));
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    // 2. Trigger automatic reload when page, size, or debounced query changes
    useEffect(() => {
        actionRef.current?.reload();
    }, [pagination.page, pagination.size, debouncedQuery]);

    // Delete handler
    const handleDelete = async (id: number) => {
        try {
            await roleService.deleteRole(id);
            api.success({
                message: 'Success',
                description: 'Role deleted successfully!',
                placement: 'topRight',
            });
            // Reload table
            actionRef.current?.reload();
        } catch (error: unknown) {
            console.error(error);
            api.error({
                message: 'Error',
                description: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete role!',
                placement: 'topRight',
            });
        }
    };

    // Date formatter helper
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
        } catch (error: unknown) {
            return dateString;
        }
    };

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(pagination.totalElements / pagination.size));

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
        const end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    // Define table columns matching ProTable types
    const columns: ProColumns<IRole>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            search: false,
        },
        {
            title: 'Role Code (Name)',
            dataIndex: 'name',
            key: 'name',
            render: (_, record) => (
                <span style={{ fontWeight: 600, color: '#ffd700', letterSpacing: '0.5px' }}>
                    {record.name}
                </span>
            ),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (_, record) => (
                <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    {record.description || '-'}
                </span>
            ),
        },
        {
            title: 'Created Date',
            dataIndex: 'createdDate',
            key: 'createdDate',
            render: (_, record) => (
                <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                    {formatDate(record.createdDate)}
                </span>
            ),
        },
        {
            title: 'Actions',
            valueType: 'option',
            key: 'option',
            width: 260,
            render: (_, record) => [
                <Button
                    key="view"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        setSelectedRole(record);
                        setIsDetailModalOpen(true);
                    }}
                    style={{ color: '#52c41a' }}
                >
                    Detail
                </Button>,
                <Button
                    key="edit"
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => {
                        setSelectedRole(record);
                        setIsRoleModalOpen(true);
                    }}
                    style={{ color: '#1890ff' }}
                >
                    Update
                </Button>,
                <Popconfirm
                    key="delete"
                    title="remove this role?"
                    description="Are you sure you want to delete this role? This action cannot be undone."
                    onConfirm={() => record.id && handleDelete(record.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                >
                    <Button
                        key="delete-btn"
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                    >
                        Delete
                    </Button>
                </Popconfirm>
            ],
        },
    ];

    return (
        <div style={{ padding: '24px', background: '#050505', minHeight: '100%' }}>
            {contextHolder}

            <ProTable<IRole>
                columns={columns}
                actionRef={actionRef}
                cardBordered
                rowKey="id"
                search={false}
                pagination={false}
                options={{
                    reload: true,
                    density: true,
                    setting: {
                        listsHeight: 400,
                    },
                }}
                headerTitle={
                    <div>
                        <h1 style={{
                            fontSize: '24px',
                            color: '#ffd700',
                            fontFamily: 'Playfair Display, serif',
                            margin: 0,
                            letterSpacing: '1px',
                        }}>
                            Management of Roles
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.45)', margin: '4px 0 0 0', fontSize: '12px' }}>
                            Management of Roles
                        </p>
                    </div>
                }
                toolBarRender={() => [
                    <Input
                        key="search"
                        prefix={<SearchOutlined style={{ color: '#ffd700' }} />}
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '240px', height: '36px' }}
                        allowClear
                    />,
                    <Button
                        key="button"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setSelectedRole(null);
                            setIsRoleModalOpen(true);
                        }}
                        type="primary"
                        style={{ height: '36px' }}
                    >
                        Create New Role
                    </Button>,
                ]}
                request={async () => {
                    try {
                        const res = await roleService.getRoles({
                            page: pagination.page,
                            size: pagination.size,
                            q: debouncedQuery,
                        });

                        if (res && res.data) {
                            setPagination((prev) => ({
                                ...prev,
                                totalElements: res.data.meta.total,
                            }));
                            return {
                                data: res.data.result,
                                success: true,
                                total: res.data.meta.total,
                            };
                        }
                    } catch (error: unknown) {
                        console.error(error);
                        api.error({
                            message: 'Error Loading Roles',
                            description: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Cannot load roles list.',
                            placement: 'topRight',
                        });
                    }
                    return {
                        data: [],
                        success: false,
                        total: 0,
                    };
                }}
            />

            {/* Custom Pagination Area */}
            <div style={{
                padding: '16px',
                background: 'rgba(20,20,20,0.85)',
                border: '1px solid rgba(255, 215, 0, 0.15)',
                borderTop: 'none',
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                {/* Size Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>
                    <span>Display</span>
                    <Select
                        value={pagination.size}
                        onChange={(value) => {
                            setPagination((prev) => ({
                                ...prev,
                                size: value,
                                page: 1, // Reset to page 1 when size changes
                            }));
                        }}
                        options={[
                            { value: 10, label: '10 / page' },
                            { value: 20, label: '20 / page' },
                            { value: 50, label: '50 / page' },
                        ]}
                        dropdownStyle={{ background: '#141414' }}
                        style={{ width: '120px' }}
                    />
                    <span>out of {pagination.totalElements} records</span>
                </div>

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Trang Ä‘áº§u */}
                    <Button
                        icon={<DoubleLeftOutlined />}
                        disabled={pagination.page === 1}
                        onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: pagination.page === 1 ? 'rgba(255, 255, 255, 0.25)' : '#fff',
                        }}
                    />

                    {/* Trang trÆ°á»›c */}
                    <Button
                        icon={<LeftOutlined />}
                        disabled={pagination.page === 1}
                        onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: pagination.page === 1 ? 'rgba(255, 255, 255, 0.25)' : '#fff',
                        }}
                    />

                    {/* Danh sÃ¡ch cÃ¡c sá»‘ trang */}
                    {getPageNumbers().map((num) => (
                        <Button
                            key={num}
                            onClick={() => setPagination((prev) => ({ ...prev, page: num }))}
                            style={{
                                border: num === pagination.page ? '1px solid #ffd700' : '1px solid rgba(255, 255, 255, 0.15)',
                                background: num === pagination.page ? 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)' : 'transparent',
                                color: num === pagination.page ? '#000' : '#fff',
                                fontWeight: num === pagination.page ? '600' : 'normal',
                            }}
                        >
                            {num}
                        </Button>
                    ))}

                    {/* Trang sau */}
                    <Button
                        icon={<RightOutlined />}
                        disabled={pagination.page === totalPages}
                        onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: pagination.page === totalPages ? 'rgba(255, 255, 255, 0.25)' : '#fff',
                        }}
                    />

                    {/* Trang cuá»‘i */}
                    <Button
                        icon={<DoubleRightOutlined />}
                        disabled={pagination.page === totalPages}
                        onClick={() => setPagination((prev) => ({ ...prev, page: totalPages }))}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: pagination.page === totalPages ? 'rgba(255, 255, 255, 0.25)' : '#fff',
                        }}
                    />
                </div>
            </div>

            {/* Reusable Form Modal (POST / PUT) */}
            <RoleModalComponent
                isOpen={isRoleModalOpen}
                onClose={() => {
                    setIsRoleModalOpen(false);
                    setSelectedRole(null);
                }}
                currentRole={selectedRole}
                onSuccess={() => actionRef.current?.reload()}
            />

            {/* Detail View Modal */}
            <DetailModalComponent
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedRole(null);
                }}
                role={selectedRole}
            />
        </div>
    );
};

export default RoleManagement;

