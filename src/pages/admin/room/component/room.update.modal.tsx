import React, { useEffect, useMemo, useState } from 'react';
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
    Spin, notification,
    Segmented,
} from 'antd';
import { SaveOutlined, ReloadOutlined, ToolOutlined, CheckCircleOutlined } from '@ant-design/icons';
import {
    RoomStatus,
    RoomType,
    ROOM_STATUS_LABELS,
    ROOM_TYPE_LABELS,
    SEAT_TYPE_LABELS,
    SEAT_STATUS_LABELS,
} from '@/types/room.types.ts';
import type { RoomDetailDTO, SeatDTO, SeatTypeType, SeatStatusType } from '@/types/room.types.ts';
import { roomService } from '@/services/room.service.ts';

const { Text } = Typography;
const { Option } = Select;

const MAX_ROWS = 10;
const MAX_COLS = 30;

// Which attribute the user is currently painting onto seats when they click on the chart
type EditMode = 'TYPE' | 'STATUS';

const getDefaultSeatType = (
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

const seatStatusColor: Record<string, string> = {
    ACTIVE: '#52c41a',
    MAINTENANCE: '#ff4d4f',
};

const seatKey = (row: string, no: number) => `${row}-${no}`;
const pairSeatNo = (seatNo: number): number => (seatNo % 2 === 1 ? seatNo + 1 : seatNo - 1);

interface SeatCell {
    id?: number;
    type: SeatTypeType;
    status: SeatStatusType;
}

interface RoomUpdateModalProps {
    open: boolean;
    roomId: number | undefined;
    onClose: () => void;
    onSuccess: () => void;
}

const RoomUpdateForm: React.FC<RoomUpdateModalProps> = ({ open, roomId, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const totalRows = Form.useWatch('totalRows', form);
    const totalCols = Form.useWatch('totalCols', form);

    // What attribute clicking on a seat currently paints
    const [editMode, setEditMode] = useState<EditMode>('TYPE');
    const [activeType, setActiveType] = useState<SeatTypeType>('STANDARD');
    const [activeStatus, setActiveStatus] = useState<SeatStatusType>('MAINTENANCE');
    const [seatTypes, setSeatTypes] = useState<Record<string, SeatCell>>({});
    const [api, contextHolder] = notification.useNotification();

    const rows = Number(totalRows) || 0;
    const cols = Number(totalCols) || 0;

    const rowLetters = useMemo(
        () => Array.from({ length: rows }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i)),
        [rows],
    );

    // Load room detail whenever the modal opens with a room id
    useEffect(() => {
        if (!open || roomId == null) return;

        const load = async () => {
            setFetching(true);
            try {
                const res = await roomService.fetchRoomDetail(roomId);
                const detail = res.data;

                const seats = detail.seats ?? [];

                // Backend doesn't return totalRows/totalCols directly — derive from seat list
                const derivedRows = seats.length
                    ? Math.max(...seats.map((s) => s.seatRow.charCodeAt(0) - 'A'.charCodeAt(0) + 1))
                    : 0;
                const derivedCols = seats.length ? Math.max(...seats.map((s) => s.seatNo)) : 0;

                form.setFieldsValue({
                    name: detail.name,
                    status: detail.status,
                    type: detail.type,
                    totalRows: derivedRows || undefined,
                    totalCols: derivedCols || undefined,
                });

                const map: Record<string, SeatCell> = {};
                seats.forEach((s) => {
                    map[seatKey(s.seatRow, s.seatNo)] = {
                        id: s.id,
                        type: s.type as SeatTypeType,
                        status: (s.status as SeatStatusType) ?? 'ACTIVE',
                    };
                });
                setSeatTypes(map);
            } catch (error: any) {
                message.error('No loading data for room, try again later');
                onClose?.();
            } finally {
                setFetching(false);
            }
        };

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, roomId]);

    // Reset everything when the modal closes
    useEffect(() => {
        if (!open) {
            form.resetFields();
            setSeatTypes({});
            setActiveType('STANDARD');
            setActiveStatus('MAINTENANCE');
            setEditMode('TYPE');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Whenever rows/cols change (e.g. user resizes the grid), fill in any
    // newly-added seats with the default rule while keeping existing ones (incl. their id).
    useEffect(() => {
        if (rows <= 0 || cols <= 0) return;
        setSeatTypes((prev) => {
            const next: Record<string, SeatCell> = {};
            rowLetters.forEach((rowLetter) => {
                for (let no = 1; no <= cols; no++) {
                    const key = seatKey(rowLetter, no);
                    next[key] = prev[key] ?? {
                        type: getDefaultSeatType(rowLetter, no, cols),
                        status: 'ACTIVE',
                    };
                }
            });
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, cols]);

    const totalSeats = rows * cols;

    const handleSeatClick = (rowLetter: string, seatNo: number) => {
        const key = seatKey(rowLetter, seatNo);
        const current = seatTypes[key] ?? {
            type: getDefaultSeatType(rowLetter, seatNo, cols),
            status: 'ACTIVE' as SeatStatusType,
        };

        // ── Editing seat TYPE (existing behaviour) ──
        if (editMode === 'TYPE') {
            const isLastSeatOfOddRow = cols % 2 !== 0 && seatNo === cols;
            if (activeType === 'SWEETBOX' && isLastSeatOfOddRow) {
                message.warning(
                    `A seat ${rowLetter}${seatNo} is last seat in row, cannot set this seat is sweetbox!`,
                );
                return;
            }

            setSeatTypes((prev) => {
                const next = { ...prev };
                const partnerNo = pairSeatNo(seatNo);
                const hasValidPartner = partnerNo >= 1 && partnerNo <= cols;
                const partnerKey = hasValidPartner ? seatKey(rowLetter, partnerNo) : null;
                const partnerCurrent = partnerKey
                    ? prev[partnerKey] ?? {
                    type: getDefaultSeatType(rowLetter, partnerNo, cols),
                    status: 'ACTIVE' as SeatStatusType,
                }
                    : null;

                next[key] = { ...current, type: activeType };

                if (activeType === 'SWEETBOX') {
                    if (partnerKey && partnerCurrent) {
                        next[partnerKey] = { ...partnerCurrent, type: activeType };
                    }
                } else if (
                    current.type === 'SWEETBOX' &&
                    partnerKey &&
                    partnerCurrent?.type === 'SWEETBOX'
                ) {
                    next[partnerKey] = { ...partnerCurrent, type: activeType };
                }

                return next;
            });
            return;
        }

        // ── Editing seat STATUS (Active / Maintenance) ──
        setSeatTypes((prev) => {
            const next = { ...prev };
            next[key] = { ...current, status: activeStatus };

            // A sweetbox is a single physical couple-seat, so its paired half
            // should follow the same status (both usable or both under maintenance).
            if (current.type === 'SWEETBOX') {
                const partnerNo = pairSeatNo(seatNo);
                const hasValidPartner = partnerNo >= 1 && partnerNo <= cols;
                const partnerKey = hasValidPartner ? seatKey(rowLetter, partnerNo) : null;
                const partnerCurrent = partnerKey ? prev[partnerKey] : null;
                if (partnerKey && partnerCurrent?.type === 'SWEETBOX') {
                    next[partnerKey] = { ...partnerCurrent, status: activeStatus };
                }
            }

            return next;
        });
    };

    const handleResetDefaults = () => {
        const next: Record<string, SeatCell> = {};
        rowLetters.forEach((rowLetter) => {
            for (let no = 1; no <= cols; no++) {
                const key = seatKey(rowLetter, no);
                next[key] = {
                    id: seatTypes[key]?.id,
                    type: getDefaultSeatType(rowLetter, no, cols),
                    status: 'ACTIVE',
                };
            }
        });
        setSeatTypes(next);
        message.success('Reset seat defaults successfully');
    };

    const onFinish = async (values: any) => {
        if (roomId == null) return;
        if (rows <= 0 || cols <= 0) {
            message.error('Input number of row and seat/row');
            return;
        }

        const seats: SeatDTO[] = [];
        rowLetters.forEach((rowLetter) => {
            for (let no = 1; no <= cols; no++) {
                const cell = seatTypes[seatKey(rowLetter, no)];
                seats.push({
                    id: cell?.id,
                    seatRow: rowLetter,
                    seatNo: no,
                    type: cell?.type ?? getDefaultSeatType(rowLetter, no, cols),
                    status: cell?.status ?? 'ACTIVE',
                });
            }
        });

        setLoading(true);
        try {
            const payload: RoomDetailDTO = {
                id: roomId,
                name: values.name.trim(),
                status: values.status,
                type: values.type,
                totalRows: values.totalRows,
                totalCols: values.totalCols,

                seats,
            };

            const res = await roomService.updateRoom(payload);
            const updated = res.data;
            api.success({
                message: `Update room "${updated.name}" success!`,
                placement: 'topRight',
            });
            onSuccess?.();
            onClose?.();
        } catch (error: any) {
            api.error({ message: 'Update failure!', placement: 'topRight', description: error.response?.data?.message });

        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <Modal
                title="Update room"
                open={open}
                onCancel={onClose}
                footer={null}
                width={1200}
                destroyOnClose
            >
                <Spin spinning={fetching}>
                    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                            Update room information and seating chart. Choose what you want to edit
                            (seat type or seat status), then click a seat to apply it. Sweetboxes are
                            automatically paired (A1 ↔ A2, A3 ↔ A4, …).
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

                                        {totalRows && totalCols && (
                                            <Alert
                                                type="warning"
                                                showIcon
                                                style={{ marginBottom: 16 }}
                                                message="Changing the row/seat numbers may create new seats or remove old ones. Please double-check the floor plan before saving."
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
                                                        disabled={hasErrors || !allFilled || fetching}
                                                        block
                                                    >
                                                        Save changes
                                                    </Button>
                                                );
                                            }}
                                        </Form.Item>
                                    </Form>
                                </Card>
                            </Col>

                            {/* ── Right: seating chart ── */}
                            <Col xs={24} md={13}>
                                <Card
                                    title="Seating chart"
                                    extra={
                                        <Button
                                            size="small"
                                            icon={<ReloadOutlined />}
                                            onClick={handleResetDefaults}
                                            disabled={rows <= 0 || cols <= 0}
                                        >
                                            Reset
                                        </Button>
                                    }
                                >
                                    {rows <= 0 || cols <= 0 ? (
                                        <Text type="secondary">Loading seating chart...</Text>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            {/* Edit mode switch: seat TYPE vs seat STATUS */}
                                            <div style={{ marginBottom: 12 }}>
                                                <Segmented
                                                    value={editMode}
                                                    onChange={(value) => setEditMode(value as EditMode)}
                                                    options={[
                                                        { label: 'Edit seat type', value: 'TYPE' },
                                                        { label: 'Edit seat status', value: 'STATUS' },
                                                    ]}
                                                />
                                            </div>

                                            {editMode === 'TYPE' ? (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                        marginBottom: 16,
                                                    }}
                                                >
                                                    <Text style={{ whiteSpace: 'nowrap' }}>Seat type choosing:</Text>
                                                    <Select
                                                        value={activeType}
                                                        onChange={(value: SeatTypeType) => setActiveType(value)}
                                                        style={{ minWidth: 180 }}
                                                    >
                                                        {Object.entries(SEAT_TYPE_LABELS).map(([key, label]) => (
                                                            <Option key={key} value={key}>
                                                                <Space size={6}>
                                                                <span
                                                                    style={{
                                                                        display: 'inline-block',
                                                                        width: 10,
                                                                        height: 10,
                                                                        borderRadius: 2,
                                                                        background: seatColor[key],
                                                                    }}
                                                                />
                                                                    {label}
                                                                </Space>
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        Click seat for this type
                                                    </Text>
                                                </div>
                                            ) : (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                        marginBottom: 16,
                                                    }}
                                                >
                                                    <Text style={{ whiteSpace: 'nowrap' }}>Set status to:</Text>
                                                    <Select
                                                        value={activeStatus}
                                                        onChange={(value: SeatStatusType) => setActiveStatus(value)}
                                                        style={{ minWidth: 180 }}
                                                    >
                                                        {Object.entries(SEAT_STATUS_LABELS).map(([key, label]) => (
                                                            <Option key={key} value={key}>
                                                                <Space size={6}>
                                                                    {key === 'MAINTENANCE' ? (
                                                                        <ToolOutlined style={{ color: seatStatusColor[key] }} />
                                                                    ) : (
                                                                        <CheckCircleOutlined style={{ color: seatStatusColor[key] }} />
                                                                    )}
                                                                    {label}
                                                                </Space>
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        Click seat to toggle it {SEAT_STATUS_LABELS[activeStatus].toLowerCase()}
                                                    </Text>
                                                </div>
                                            )}

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

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 6,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {rowLetters.map((rowLetter) => (
                                                    <div
                                                        key={rowLetter}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                                    >
                                                        <Text style={{ width: 20, textAlign: 'center', fontWeight: 600 }}>
                                                            {rowLetter}
                                                        </Text>

                                                        {Array.from({ length: cols }).map((_, i) => {
                                                            const seatNo = i + 1;
                                                            const key = seatKey(rowLetter, seatNo);
                                                            const cell = seatTypes[key];
                                                            const cellType =
                                                                cell?.type ?? getDefaultSeatType(rowLetter, seatNo, cols);
                                                            const cellStatus: SeatStatusType = cell?.status ?? 'ACTIVE';
                                                            const isNewSeat = cell?.id == null;
                                                            const isMaintenance = cellStatus === 'MAINTENANCE';

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => handleSeatClick(rowLetter, seatNo)}
                                                                    title={`${rowLetter}${seatNo} - ${SEAT_TYPE_LABELS[cellType]} - ${SEAT_STATUS_LABELS[cellStatus]}${isNewSeat ? ' (new seat)' : ''}`}
                                                                    style={{
                                                                        position: 'relative',
                                                                        width: 24,
                                                                        height: 24,
                                                                        borderRadius: 4,
                                                                        background: seatColor[cellType],
                                                                        opacity: isMaintenance ? 0.4 : 1,
                                                                        fontSize: 9,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        color: '#333',
                                                                        cursor: 'pointer',
                                                                        userSelect: 'none',
                                                                        border: isMaintenance
                                                                            ? '1.5px solid #ff4d4f'
                                                                            : isNewSeat
                                                                                ? '1px dashed #1677ff'
                                                                                : '1px solid rgba(0,0,0,0.15)',
                                                                    }}
                                                                >
                                                                    {seatNo}
                                                                    {isMaintenance && (
                                                                        <ToolOutlined
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: -6,
                                                                                right: -6,
                                                                                fontSize: 10,
                                                                                color: '#ff4d4f',
                                                                                background: '#fff',
                                                                                borderRadius: '50%',
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>

                                            <Divider />

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
                                                <Space size={6}>
                                                    <div
                                                        style={{
                                                            width: 16,
                                                            height: 16,
                                                            borderRadius: 4,
                                                            background: '#d9d9d9',
                                                            opacity: 0.4,
                                                            border: '1.5px solid #ff4d4f',
                                                        }}
                                                    />
                                                    <Text>Maintenance</Text>
                                                </Space>
                                            </Space>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </Spin>
            </Modal>
        </>

    );
};

export default RoomUpdateForm;