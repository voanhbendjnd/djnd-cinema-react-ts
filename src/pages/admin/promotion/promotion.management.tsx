import React, { useEffect, useRef, useState } from 'react';
import { type ActionType, type ProColumns, ProTable } from '@ant-design/pro-components';
import {
    Button,
    Input,
    Popconfirm,
    notification,
    Select,
    Modal,
    Form,
    InputNumber,
    DatePicker,
    Tag,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    DoubleLeftOutlined,
    LeftOutlined,
    RightOutlined,
    DoubleRightOutlined,
    TagOutlined,
    PictureOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { promotionService } from '@/services/promotion.service';

/* ─────────────────────────────────────────────────────────────────
   STATUS BADGE HELPER
───────────────────────────────────────────────────────────────── */
const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
    const config: Record<string, { color: string; bg: string; label: string }> = {
        Active:   { color: '#52c41a', bg: 'rgba(82,196,26,0.12)',   label: 'Active' },
        Upcoming: { color: '#1890ff', bg: 'rgba(24,144,255,0.12)',  label: 'Upcoming' },
        Expired:  { color: '#ff4d4f', bg: 'rgba(255,77,79,0.12)',   label: 'Expired' },
    };
    const cfg = config[status ?? ''] ?? { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.08)', label: status ?? '-' };
    return (
        <Tag style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.color, fontWeight: 600 }}>
            {cfg.label}
        </Tag>
    );
};

/* ─────────────────────────────────────────────────────────────────
   DATE FORMATTER
───────────────────────────────────────────────────────────────── */
const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        return dayjs(dateString).format('DD/MM/YYYY HH:mm');
    } catch {
        return dateString;
    }
};

/* ─────────────────────────────────────────────────────────────────
   PROMOTION MODAL (Create / Edit)
───────────────────────────────────────────────────────────────── */
interface PromotionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPromotion: IPromotion | null;
    onSuccess: () => void;
}

const PromotionModal: React.FC<PromotionModalProps> = ({ isOpen, onClose, currentPromotion, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [api, ctx] = notification.useNotification();
    const isEdit = !!currentPromotion?.id;

    useEffect(() => {
        if (isOpen && currentPromotion) {
            form.setFieldsValue({
                title: currentPromotion.title,
                detail: currentPromotion.detail,
                discountPercentage: currentPromotion.discountPercentage,
                startTime: currentPromotion.startTime ? dayjs(currentPromotion.startTime) : null,
                endTime: currentPromotion.endTime ? dayjs(currentPromotion.endTime) : null,
                thumbnailUrl: currentPromotion.thumbnailUrl,
            });
        } else if (isOpen) {
            form.resetFields();
        }
    }, [isOpen, currentPromotion, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const payload = {
                title: values.title,
                detail: values.detail,
                discountPercentage: values.discountPercentage,
                startTime: (values.startTime as dayjs.Dayjs).format('YYYY-MM-DDTHH:mm:ss'),
                endTime: (values.endTime as dayjs.Dayjs).format('YYYY-MM-DDTHH:mm:ss'),
                thumbnailUrl: values.thumbnailUrl,
            };

            if (isEdit && currentPromotion?.id) {
                await promotionService.updatePromotion(currentPromotion.id, payload);
                api.success({ message: 'Success', description: 'Promotion updated successfully!', placement: 'topRight' });
            } else {
                await promotionService.createPromotion(payload);
                api.success({ message: 'Success', description: 'Promotion created successfully!', placement: 'topRight' });
            }

            onSuccess();
            onClose();
            form.resetFields();
        } catch (error: unknown) {
            const errMsg = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
            if (errMsg) {
                api.error({ message: 'Error', description: errMsg, placement: 'topRight' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {ctx}
            <Modal
                title={
                    <span style={{ color: '#ffd700', fontSize: '18px', fontWeight: 700 }}>
                        <TagOutlined style={{ marginRight: 8 }} />
                        {isEdit ? 'Update Promotion' : 'Create New Promotion'}
                    </span>
                }
                open={isOpen}
                onCancel={() => { onClose(); form.resetFields(); }}
                onOk={handleSubmit}
                okText={isEdit ? 'Update' : 'Create'}
                confirmLoading={loading}
                width={640}
                styles={{
                    header: { background: '#141414', borderBottom: '1px solid rgba(255,215,0,0.2)' },
                    body:   { background: '#141414', padding: '24px' },
                    footer: { background: '#141414', borderTop: '1px solid rgba(255,255,255,0.08)' },
                }}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
                    <Form.Item
                        label={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Promotion Title</span>}
                        name="title"
                        rules={[{ required: true, message: 'Please enter title' }]}
                    >
                        <Input placeholder="e.g. Summer Sale 2025" maxLength={255} />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Discount Percentage (%)</span>}
                        name="discountPercentage"
                        rules={[
                            { required: true, message: 'Please enter discount percentage!' },
                            {
                                validator: (_, value) => {
                                    if (value === undefined || value === null || value === '') {
                                        return Promise.resolve();
                                    }
                                    const num = Number(value);
                                    if (num <= 0) {
                                        return Promise.reject(new Error('Discount percentage must be greater than 0!'));
                                    }
                                    if (num > 100) {
                                        return Promise.reject(new Error('Discount percentage cannot exceed 100!'));
                                    }
                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <InputNumber
                            step={1}
                            precision={0}
                            style={{ width: '100%' }}
                            addonAfter="%"
                            placeholder="e.g. 20"
                        />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <Form.Item
                            label={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Start Time</span>}
                            name="startTime"
                            style={{ flex: 1 }}
                            rules={[{ required: true, message: 'Please select start time' }]}
                        >
                            <DatePicker 
                                showTime 
                                style={{ width: '100%' }} 
                                format="DD/MM/YYYY HH:mm" 
                                disabled={isEdit && currentPromotion?.startTime ? new Date(currentPromotion.startTime) <= new Date() : false}
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span style={{ color: 'rgba(255,255,255,0.85)' }}>End Time</span>}
                            name="endTime"
                            style={{ flex: 1 }}
                            rules={[
                                { required: true, message: 'Please select end time' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || !getFieldValue('startTime')) return Promise.resolve();
                                        if ((value as dayjs.Dayjs).isAfter(getFieldValue('startTime') as dayjs.Dayjs)) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('End time must be after start time'));
                                    },
                                }),
                            ]}
                        >
                            <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
                        </Form.Item>
                    </div>


                </Form>
            </Modal>
        </>
    );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────────────────────────── */
const PromotionManagement: React.FC = () => {
    const actionRef = useRef<ActionType>(null);

    const [pagination, setPagination] = useState({ page: 1, size: 10, totalElements: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState<IPromotion | null>(null);

    const [api, contextHolder] = notification.useNotification();

    /* debounce search */
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setPagination((p) => ({ ...p, page: 1 }));
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    /* reload table when pagination / search changes */
    useEffect(() => {
        actionRef.current?.reload();
    }, [pagination.page, pagination.size, debouncedQuery]);

    /* ── Delete ── */
    const handleDelete = async (record: IPromotion) => {
        if (record.endTime && new Date(record.endTime) < new Date()) {
            api.warning({
                message: 'Warning',
                description: 'Cannot delete an expired promotion to preserve system history!',
                placement: 'topRight',
            });
            return;
        }

        try {
            await promotionService.deletePromotion(record.id!);
            api.success({ message: 'Deleted', description: 'Promotion deleted successfully!', placement: 'topRight' });
            actionRef.current?.reload();
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
            api.error({
                message: 'Cannot Delete',
                description: msg ?? 'Failed to delete promotion. Active promotions cannot be deleted.',
                placement: 'topRight',
            });
        }
    };

    /* ── Columns ── */
    const columns: ProColumns<IPromotion>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 70,
            search: false,
        },
        {
            title: 'Title',
            dataIndex: 'title',
            render: (_, record) => (
                <span style={{ fontWeight: 600, color: '#ffd700' }}>{record.title}</span>
            ),
        },
        {
            title: 'Discount',
            dataIndex: 'discountPercentage',
            width: 110,
            search: false,
            render: (_, record) => (
                <span style={{ color: '#ff7a45', fontWeight: 700 }}>
                    {Math.floor(Number(record.discountPercentage))}%
                </span>
            ),
        },
        {
            title: 'Start Time',
            dataIndex: 'startTime',
            width: 150,
            search: false,
            render: (_, record) => (
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                    {formatDate(record.startTime)}
                </span>
            ),
        },
        {
            title: 'End Time',
            dataIndex: 'endTime',
            width: 150,
            search: false,
            render: (_, record) => (
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                    {formatDate(record.endTime)}
                </span>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: 110,
            search: false,
            render: (_, record) => <StatusBadge status={record.status} />,
        },

        {
            title: 'Actions',
            valueType: 'option',
            width: 170,
            render: (_, record) => [
                <Button
                    key="edit"
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => { setSelectedPromotion(record); setIsModalOpen(true); }}
                    style={{ color: '#1890ff' }}
                >
                    Edit
                </Button>,
                <Popconfirm
                    key="delete"
                    title="Delete this promotion?"
                    description={
                        record.status === 'Active'
                            ? 'Warning: Active promotions cannot be deleted.'
                            : 'This action cannot be undone.'
                    }
                    onConfirm={() => record.id && handleDelete(record)}
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
                </Popconfirm>,
            ],
        },
    ];

    /* ── Pagination helpers ── */
    const totalPages = Math.max(1, Math.ceil(pagination.totalElements / pagination.size));
    const getPageNumbers = () => {
        const pages: number[] = [];
        const max = 5;
        let start = Math.max(1, pagination.page - Math.floor(max / 2));
        const end = Math.min(totalPages, start + max - 1);
        if (end - start + 1 < max) start = Math.max(1, end - max + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    /* ─── RENDER ─── */
    return (
        <div style={{ padding: '24px', background: '#050505', minHeight: '100%' }}>
            {contextHolder}

            <ProTable<IPromotion>
                columns={columns}
                actionRef={actionRef}
                cardBordered
                rowKey="id"
                search={false}
                pagination={false}
                options={{ reload: true, density: true, setting: { listsHeight: 400 } }}
                headerTitle={
                    <div>
                        <h1 style={{ fontSize: '24px', color: '#ffd700', fontFamily: 'Playfair Display, serif', margin: 0, letterSpacing: '1px' }}>
                            <TagOutlined style={{ marginRight: 10 }} />
                            Promotion Management
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.45)', margin: '4px 0 0 0', fontSize: '12px' }}>
                            Create and manage discount promotions
                        </p>
                    </div>
                }
                toolBarRender={() => [
                    <Input
                        key="search"
                        prefix={<SearchOutlined style={{ color: '#ffd700' }} />}
                        placeholder="Search by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '240px', height: '36px' }}
                        allowClear
                    />,
                    <Button
                        key="create"
                        icon={<PlusOutlined />}
                        type="primary"
                        style={{ height: '36px' }}
                        onClick={() => { setSelectedPromotion(null); setIsModalOpen(true); }}
                    >
                        Create Promotion
                    </Button>,
                ]}
                request={async () => {
                    try {
                        const res = await promotionService.getPromotions(pagination.page, pagination.size, debouncedQuery);
                        if (res?.data) {
                            setPagination((p) => ({ ...p, totalElements: res.data.meta.total }));
                            return { data: res.data.result, success: true, total: res.data.meta.total };
                        }
                    } catch (error: unknown) {
                        api.error({
                            message: 'Error',
                            description: (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Cannot load promotions.',
                            placement: 'topRight',
                        });
                    }
                    return { data: [], success: false, total: 0 };
                }}
            />

            {/* ── Custom Pagination ── */}
            <div style={{
                padding: '16px',
                background: 'rgba(20,20,20,0.85)',
                border: '1px solid rgba(255,215,0,0.15)',
                borderTop: 'none',
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>
                    <span>Display</span>
                    <Select
                        value={pagination.size}
                        onChange={(v) => setPagination((p) => ({ ...p, size: v, page: 1 }))}
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {[
                        { icon: <DoubleLeftOutlined />, disabled: pagination.page === 1, onClick: () => setPagination((p) => ({ ...p, page: 1 })) },
                        { icon: <LeftOutlined />,       disabled: pagination.page === 1, onClick: () => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) })) },
                    ].map((btn, i) => (
                        <Button key={i} icon={btn.icon} disabled={btn.disabled} onClick={btn.onClick}
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: btn.disabled ? 'rgba(255,255,255,0.25)' : '#fff' }}
                        />
                    ))}

                    {getPageNumbers().map((num) => (
                        <Button key={num} onClick={() => setPagination((p) => ({ ...p, page: num }))}
                            style={{
                                border: num === pagination.page ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.15)',
                                background: num === pagination.page ? 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)' : 'transparent',
                                color: num === pagination.page ? '#000' : '#fff',
                                fontWeight: num === pagination.page ? '600' : 'normal',
                            }}
                        >{num}</Button>
                    ))}

                    {[
                        { icon: <RightOutlined />,       disabled: pagination.page === totalPages, onClick: () => setPagination((p) => ({ ...p, page: Math.min(totalPages, p.page + 1) })) },
                        { icon: <DoubleRightOutlined />, disabled: pagination.page === totalPages, onClick: () => setPagination((p) => ({ ...p, page: totalPages })) },
                    ].map((btn, i) => (
                        <Button key={i + 10} icon={btn.icon} disabled={btn.disabled} onClick={btn.onClick}
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: btn.disabled ? 'rgba(255,255,255,0.25)' : '#fff' }}
                        />
                    ))}
                </div>
            </div>

            {/* ── Create / Edit Modal ── */}
            <PromotionModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedPromotion(null); }}
                currentPromotion={selectedPromotion}
                onSuccess={() => actionRef.current?.reload()}
            />
        </div>
    );
};

export default PromotionManagement;
