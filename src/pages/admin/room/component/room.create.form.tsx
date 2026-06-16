import React, { useMemo, useState } from 'react';
import {
    Form,
    Input,
    Select,
    InputNumber,
    Button,
    Card,
    Typography,
    message,
    Row,
    Col,
    Space,
    Divider,
    Alert,
    Modal,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import {
    RoomStatus,
    RoomType,
    ROOM_STATUS_LABELS,
    ROOM_TYPE_LABELS,
    SEAT_TYPE_LABELS,
} from '@/types/room.types.ts';
import type { RoomDTO, SeatTypeType } from '@/types/room.types.ts';
import { roomService } from '@/services/room.service.ts';

const { Text } = Typography;
const { Option } = Select;

const MAX_ROWS = 10;
const MAX_COLS = 30;

/**
 * Mirrors backend RoomService#getSeats type-assignment logic exactly:
 *   rows D–H          → VIP
 *   row J, last seat when totalCols is odd → STANDARD (no pair partner)
 *   row J, everything else                 → SWEETBOX
 *   everything else   → STANDARD
 */
const getSeatType = (
    rowLetter: string,
    seatNo: number,
    totalCols: number,
): SeatTypeType => {
    if (rowLetter >= 'D' && rowLetter <= 'H') return 'VIP';
    if (rowLetter === 'J') {
        if (seatNo === totalCols && totalCols % 2 !== 0) return 'STANDARD';
        return 'SWEETBOX';
    }
    return 'STANDARD';
};

const seatColor: Record<string, string> = {
    STANDARD: '#d9d9d9',
    VIP: '#ffd666',
    SWEETBOX: '#ff85c0',
};

interface PreviewRow {
    rowLetter: string;
    totalCols: number;
}

interface RoomCreateModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const RoomCreateForm: React.FC<RoomCreateModalProps> = ({ open, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const totalRows = Form.useWatch('totalRows', form);
    const totalCols = Form.useWatch('totalCols', form);

    const previewRows = useMemo<PreviewRow[]>(() => {
        const rows = Number(totalRows) || 0;
        const cols = Number(totalCols) || 0;
        if (rows <= 0 || cols <= 0) return [];

        return Array.from({ length: rows }, (_, i) => ({
            rowLetter: String.fromCharCode('A'.charCodeAt(0) + i),
            totalCols: cols,
        }));
    }, [totalRows, totalCols]);

    const totalSeats = (Number(totalRows) || 0) * (Number(totalCols) || 0);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const payload: RoomDTO = {
                name: values.name.trim(),
                status: values.status,
                type: values.type,
                totalRows: values.totalRows ?? undefined,
                totalCols: values.totalCols ?? undefined,
            };

            const res = await roomService.createRoom(payload);
            const created = res.data;

            message.success(`Tạo phòng "${created.name}" thành công!`);
            form.resetFields();
            onSuccess?.();
            onClose?.();
        } catch (error: any) {
            const backendMsg = error.response?.data?.message;
            if (backendMsg?.toLowerCase().includes('name')) {
                form.setFields([{ name: 'name', errors: ['Tên phòng đã tồn tại!'] }]);
            } else {
                message.error(backendMsg || 'Tạo phòng thất bại. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="New room"
            open={open}
            onCancel={onClose}
            footer={null}
            width={1200}
            destroyOnClose
        >
            <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    Configure room name, room type, and seating chart. Seat type (Standard / VIP / Sweetbox)
                    will be automatically assigned by the system in each row.
                </Text>

                <Row gutter={24}>
                    {/* ── Left: form ── */}
                    <Col xs={24} md={11}>
                        <Card title="Room information">
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                requiredMark="optional"
                                validateTrigger={['onBlur', 'onChange']}
                                initialValues={{ status: RoomStatus.ACTIVE, type: RoomType.R2D }}
                            >
                                <Form.Item
                                    name="name"
                                    label="Name"
                                    rules={[
                                        { required: true, message: 'Please input room name!' },
                                        { max: 50, message: 'Room name max 50 characters!' },
                                    ]}
                                >
                                    <Input placeholder="VD: Room 01" />
                                </Form.Item>

                                <Form.Item
                                    name="type"
                                    label="Room type"
                                    rules={[{ required: true, message: 'Please select room type!' }]}
                                >
                                    <Select placeholder="Select room type">
                                        {Object.values(RoomType).map((t) => (
                                            <Option key={t} value={t}>
                                                {ROOM_TYPE_LABELS[t] ?? t}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="status"
                                    label="Status"
                                    rules={[{ required: true, message: 'Please select room status!' }]}
                                >
                                    <Select placeholder="Select status">
                                        {Object.values(RoomStatus).map((s) => (
                                            <Option key={s} value={s}>
                                                {ROOM_STATUS_LABELS[s] ?? s}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Divider />

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="totalRows"
                                            label="Row of seat"
                                            rules={[
                                                { required: true, message: 'Please input row of seat!' },
                                                {
                                                    type: 'number',
                                                    min: 1,
                                                    max: MAX_ROWS,
                                                    message: `From 1 to ${MAX_ROWS} row!`,
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                min={1}
                                                max={MAX_ROWS}
                                                style={{ width: '100%' }}
                                                placeholder="VD: 10"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="totalCols"
                                            label="Seat / col"
                                            rules={[
                                                { required: true, message: 'Please input seat on col' },
                                                {
                                                    type: 'number',
                                                    min: 1,
                                                    max: MAX_COLS,
                                                    message: `From 1 to ${MAX_COLS} seat!`,
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                min={1}
                                                max={MAX_COLS}
                                                style={{ width: '100%' }}
                                                placeholder="VD: 12"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                {totalSeats > 0 && (
                                    <Alert
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                        message={`Total seats: ${totalSeats}`}
                                    />
                                )}

                                <Form.Item shouldUpdate style={{ marginTop: 8, marginBottom: 0 }}>
                                    {() => {
                                        const hasErrors = form
                                            .getFieldsError()
                                            .some(({ errors }) => errors.length > 0);
                                        const required = ['name', 'type', 'status', 'totalRows', 'totalCols'];
                                        const allFilled = required.every((f) => {
                                            const v = form.getFieldValue(f);
                                            return v !== undefined && v !== null && v !== '';
                                        });

                                        return (
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                icon={<SaveOutlined />}
                                                loading={loading}
                                                disabled={hasErrors || !allFilled}
                                                block
                                            >
                                                Save &amp; Create room
                                            </Button>
                                        );
                                    }}
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>

                    {/* ── Right: seating chart preview ── */}
                    <Col xs={24} md={13}>
                        <Card title="Preview seating chart">
                            {previewRows.length === 0 ? (
                                <Text type="secondary">Input row and row/seat</Text>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    {/* Screen label */}
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            padding: '8px 0 20px',
                                            color: '#999',
                                            letterSpacing: 4,
                                            fontWeight: 600,
                                            borderBottom: '2px solid #444',
                                            marginBottom: 16,
                                        }}
                                    >
                                        SCREEN
                                    </div>

                                    {/* Seat grid */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 6,
                                            alignItems: 'center',
                                        }}
                                    >
                                        {previewRows.map((row) => (
                                            <div
                                                key={row.rowLetter}
                                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                            >
                                                <Text style={{ width: 20, textAlign: 'center', fontWeight: 600 }}>
                                                    {row.rowLetter}
                                                </Text>

                                                {Array.from({ length: row.totalCols }).map((_, i) => {
                                                    const seatNo = i + 1;
                                                    const cellType = getSeatType(
                                                        row.rowLetter,
                                                        seatNo,
                                                        row.totalCols,
                                                    );

                                                    return (
                                                        <div
                                                            key={i}
                                                            title={`${row.rowLetter}${seatNo} - ${SEAT_TYPE_LABELS[cellType]}`}
                                                            style={{
                                                                width: 22,
                                                                height: 22,
                                                                borderRadius: 4,
                                                                background: seatColor[cellType],
                                                                fontSize: 9,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: '#333',
                                                            }}
                                                        >
                                                            {seatNo}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>

                                    <Divider />

                                    {/* Legend */}
                                    <Space size="large" wrap>
                                        {Object.entries(SEAT_TYPE_LABELS).map(([key, label]) => (
                                            <Space key={key} size={6}>
                                                <div
                                                    style={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: 4,
                                                        background: seatColor[key],
                                                    }}
                                                />
                                                <Text>{label}</Text>
                                            </Space>
                                        ))}
                                    </Space>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
        </Modal>
    );
};

export default RoomCreateForm;