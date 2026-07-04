import React, { useEffect, useMemo, useState } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Select,
    TimePicker,
    InputNumber,
    Tag,
    Typography,
    notification,
    Popconfirm,
    Space,
    Card,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ClockCircleOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import axiosClient from '@/services/axiosClient';

const { Title, Text } = Typography;

interface ShowtimePriceDTO {
    id?: number;
    dayType: string;
    seatType: string;
    startTimeFrom: string; // "HH:mm:ss"
    startTimeTo: string;
    finalPrice: number;
}

const DAY_TYPE_OPTIONS = [
    { value: 'WEEKDAY', label: 'Weekday (Mon - Thu)' },
    { value: 'WEEKEND', label: 'Weekend (Fri - Sun)' },
    { value: 'HOLIDAY', label: 'Holiday' },
];
//STANDARD, VIP, SWEETBOX
const SEAT_TYPE_OPTIONS = [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'VIP', label: 'VIP' },
    { value: 'SWEETBOX', label: 'Sweet box' },
];

const DAY_TYPE_COLOR: Record<string, string> = {
    WEEKDAY: '#1677ff',
    WEEKEND: '#e63946',
    HOLIDAY: '#ffd700',
};

const SEAT_TYPE_COLOR: Record<string, string> = {
    STANDARD: 'rgba(255,255,255,0.5)',
    VIP: '#ffb703',
    SWEETBOX: '#eb2f96',
};

const darkInputStyle: React.CSSProperties = {
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#f0ece3',
};

const formatPrice = (value: number) =>
    new Intl.NumberFormat('vi-VN').format(value) + ' đ';

// HH:mm:ss (BE) <-> Dayjs (FE)
const toDayjs = (t: string) => dayjs(t, 'HH:mm:ss');
const toTimeString = (d: Dayjs) => d.format('HH:mm:ss');

const ShowtimePriceManagementPage: React.FC = () => {
    const [data, setData] = useState<ShowtimePriceDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [api, contextHolder] = notification.useNotification();

    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form] = Form.useForm();

    const fetchData = () => {
        setLoading(true);
        return axiosClient
            .get<any>('/api/v1/admin/showtime-price')
            .then((res) => {
                const list = res?.data ?? res;
                setData(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                api.error({ message: 'Failed to load showtime price list', placement: 'topRight' });
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const sortedData = useMemo(
        () =>
            [...data].sort((a, b) => {
                if (a.dayType !== b.dayType) return a.dayType.localeCompare(b.dayType);
                if (a.seatType !== b.seatType) return a.seatType.localeCompare(b.seatType);
                return a.startTimeFrom.localeCompare(b.startTimeFrom);
            }),
        [data]
    );

    const openCreateModal = () => {
        setEditingId(null);
        form.resetFields();
        form.setFieldsValue({
            dayType: 'WEEKDAY',
            seatType: 'STANDARD',
        });
        setModalOpen(true);
    };

    const openEditModal = (record: ShowtimePriceDTO) => {
        setEditingId(record.id ?? null);
        form.setFieldsValue({
            dayType: record.dayType,
            seatType: record.seatType,
            timeRange: [toDayjs(record.startTimeFrom), toDayjs(record.startTimeTo)],
            finalPrice: record.finalPrice,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id?: number) => {
        if (id == null) return;
        try {
            await axiosClient.delete(`/api/v1/admin/showtime-price/${id}`);
            api.success({ message: 'Deleted successfully', placement: 'topRight' });
            await fetchData();
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to delete';
            api.error({ message: msg, placement: 'topRight' });
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const [from, to] = values.timeRange as [Dayjs, Dayjs];

            const payload: ShowtimePriceDTO = {
                dayType: values.dayType,
                seatType: values.seatType,
                startTimeFrom: toTimeString(from),
                startTimeTo: toTimeString(to),
                finalPrice: values.finalPrice,
            };

            if (editingId != null) {
                await axiosClient.put('/api/v1/admin/showtime-price', { ...payload, id: editingId });
                api.success({ message: 'Updated successfully', placement: 'topRight' });
            } else {
                await axiosClient.post('/api/v1/admin/showtime-price', payload);
                api.success({ message: 'Created successfully', placement: 'topRight' });
            }

            setModalOpen(false);
            await fetchData();
        } catch (err: any) {
            if (err?.errorFields) return; // lỗi validate form
            const msg = err?.response?.data?.message || 'Something went wrong';
            api.error({ message: msg, placement: 'topRight' });
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'DAY TYPE',
            dataIndex: 'dayType',
            key: 'dayType',
            render: (v: string) => (
                <Tag
                    style={{
                        background: `${DAY_TYPE_COLOR[v] ?? '#444'}22`,
                        border: `1px solid ${DAY_TYPE_COLOR[v] ?? '#444'}55`,
                        color: DAY_TYPE_COLOR[v] ?? '#fff',
                        borderRadius: 3,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                    }}
                >
                    {v}
                </Tag>
            ),
            filters: DAY_TYPE_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
            onFilter: (value: any, record: ShowtimePriceDTO) => record.dayType === value,
        },
        {
            title: 'SEAT TYPE',
            dataIndex: 'seatType',
            key: 'seatType',
            render: (v: string) => (
                <Tag
                    style={{
                        background: `${SEAT_TYPE_COLOR[v] ?? '#444'}22`,
                        border: `1px solid ${SEAT_TYPE_COLOR[v] ?? '#444'}55`,
                        color: SEAT_TYPE_COLOR[v] ?? '#fff',
                        borderRadius: 3,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                    }}
                >
                    {v}
                </Tag>
            ),
            filters: SEAT_TYPE_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
            onFilter: (value: any, record: ShowtimePriceDTO) => record.seatType === value,
        },
        {
            title: 'TIME RANGE',
            key: 'timeRange',
            render: (_: any, record: ShowtimePriceDTO) => (
                <span style={{ color: '#f0ece3' }}>
                    <ClockCircleOutlined style={{ marginRight: 6, color: 'rgba(255,255,255,0.4)' }} />
                    {record.startTimeFrom.slice(0, 5)} - {record.startTimeTo.slice(0, 5)}
                </span>
            ),
            sorter: (a: ShowtimePriceDTO, b: ShowtimePriceDTO) => a.startTimeFrom.localeCompare(b.startTimeFrom),
        },
        {
            title: 'FINAL PRICE',
            dataIndex: 'finalPrice',
            key: 'finalPrice',
            render: (v: number) => (
                <span style={{ color: '#ffd700', fontWeight: 700 }}>
                    <DollarOutlined style={{ marginRight: 6 }} />
                    {formatPrice(v)}
                </span>
            ),
            sorter: (a: ShowtimePriceDTO, b: ShowtimePriceDTO) => a.finalPrice - b.finalPrice,
        },
        {
            title: '',
            key: 'actions',
            width: 110,
            render: (_: any, record: ShowtimePriceDTO) => (
                <Space size={6}>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                        style={{ background: 'transparent', border: '1px solid rgba(230,57,70,0.4)', color: '#e63946' }}
                    />
                    <Popconfirm
                        title="Delete this price rule?"
                        description="This action cannot be undone."
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button
                            size="small"
                            icon={<DeleteOutlined />}
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#0a0a0a',
                padding: '32px 16px',
                fontFamily: "'Barlow', sans-serif",
            }}
        >
            {contextHolder}
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* ── Header ── */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginBottom: 24,
                        flexWrap: 'wrap',
                        gap: 12,
                    }}
                >
                    <div>
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
                            SHOWTIME PRICE MANAGEMENT
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1 }}>
                            CONFIGURE TICKET PRICE BY DAY TYPE, SEAT TYPE & TIME RANGE
                        </Text>
                    </div>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openCreateModal}
                        style={{
                            background: '#e63946',
                            border: 'none',
                            fontWeight: 600,
                            letterSpacing: 0.5,
                        }}
                    >
                        Add price rule
                    </Button>
                </div>

                {/* ── Table ── */}
                <Card
                    style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                    styles={{ body: { padding: 0 } }}
                >
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={sortedData}
                        loading={loading}
                        pagination={{ pageSize: 10, showSizeChanger: false }}
                        style={{ background: 'transparent' }}
                    />
                </Card>
            </div>

            {/* ── Modal create/edit ── */}
            <Modal
                title={
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1.5, color: '#f0ece3' }}>
                        {editingId != null ? 'EDIT PRICE RULE' : 'NEW PRICE RULE'}
                    </span>
                }
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={submitting}
                okText={editingId != null ? 'Save' : 'Create'}
                okButtonProps={{ style: { background: '#e63946', borderColor: '#e63946' } }}
                cancelButtonProps={{
                    style: { background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' },
                }}
                styles={{
                    header: { background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)' },
                    content: { background: '#111', border: '1px solid rgba(255,255,255,0.08)' },
                    body: { paddingTop: 16 },
                    mask: { backdropFilter: 'blur(2px)' },
                }}
                destroyOnClose
            >
                <Form form={form} layout="vertical" requiredMark={false}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <Form.Item
                            name="dayType"
                            label={<span style={{ color: 'rgba(255,255,255,0.6)' }}>Day type</span>}
                            rules={[{ required: true, message: 'Day type is required' }]}
                            style={{ flex: 1 }}
                        >
                            <Select options={DAY_TYPE_OPTIONS} />
                        </Form.Item>

                        <Form.Item
                            name="seatType"
                            label={<span style={{ color: 'rgba(255,255,255,0.6)' }}>Seat type</span>}
                            rules={[{ required: true, message: 'Seat type is required' }]}
                            style={{ flex: 1 }}
                        >
                            <Select options={SEAT_TYPE_OPTIONS} />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="timeRange"
                        label={<span style={{ color: 'rgba(255,255,255,0.6)' }}>Time range (from - to)</span>}
                        rules={[
                            { required: true, message: 'Time range is required' },
                            {
                                validator: (_, value) => {
                                    if (!value || value.length !== 2) return Promise.resolve();
                                    const [from, to] = value as [Dayjs, Dayjs];
                                    if (from.isAfter(to)) {
                                        return Promise.reject(new Error('Start time must be before end time'));
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <TimePicker.RangePicker
                            format="HH:mm"
                            style={{ width: '100%', ...darkInputStyle }}
                            minuteStep={15}
                        />
                    </Form.Item>

                    <Form.Item
                        name="finalPrice"
                        label={<span style={{ color: 'rgba(255,255,255,0.6)' }}>Final price (VND)</span>}
                        rules={[
                            { required: true, message: 'Final price is required' },
                            { type: 'number', min: 0, message: 'Price must be a positive number' },
                        ]}
                    >
                        <InputNumber
                            style={{ width: '100%', ...darkInputStyle }}
                            min={0}
                            step={1000}
                            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            //@ts-expect-error
                            parser={(v) => Number(v?.replace(/,/g, '') ?? 0)}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ShowtimePriceManagementPage;