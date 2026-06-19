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
    Modal, notification,
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import {
    RoomStatus,
    RoomType,
    ROOM_STATUS_LABELS,
    ROOM_TYPE_LABELS,
    SEAT_TYPE_LABELS,
} from '@/types/room.types.ts';
import type { RoomDetailDTO, SeatDTO, SeatTypeType } from '@/types/room.types.ts';
import { roomService } from '@/services/room.service.ts';

const { Text } = Typography;
const { Option } = Select;

const MAX_ROWS = 10;
const MAX_COLS = 30;

/**
 * Default seat-type rule (mirrors the intended backend behaviour):
 *   rows D–H                              → VIP
 *   row J, last seat when totalCols odd   → STANDARD (no pair partner)
 *   row J, everything else                → SWEETBOX
 *   everything else                       → STANDARD
 */
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

const seatKey = (row: string, no: number) => `${row}-${no}`;

/** Returns the paired seat number for sweetbox seating (1↔2, 3↔4, ...) */
const pairSeatNo = (seatNo: number): number => (seatNo % 2 === 1 ? seatNo + 1 : seatNo - 1);

interface RoomCreateModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const RoomCreateForm: React.FC<RoomCreateModalProps> = ({ open, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [api, contextHolder] = notification.useNotification();

    const totalRows = Form.useWatch('totalRows', form);
    const totalCols = Form.useWatch('totalCols', form);

    // working type used when clicking a seat in the grid
    const [activeType, setActiveType] = useState<SeatTypeType>('STANDARD');

    // explicit per-seat overrides, keyed by "row-no"
    const [seatTypes, setSeatTypes] = useState<Record<string, SeatTypeType>>({});

    const rows = Number(totalRows) || 0;
    const cols = Number(totalCols) || 0;

    const rowLetters = useMemo(
        () => Array.from({ length: rows }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i)),
        [rows],
    );

    // (Re)generate the default seat map whenever grid dimensions change.
    // Existing manual overrides for seats that still exist in the new grid are kept.
    useEffect(() => {
        if (rows <= 0 || cols <= 0) {
            setSeatTypes({});
            return;
        }
        setSeatTypes((prev) => {
            const next: Record<string, SeatTypeType> = {};
            rowLetters.forEach((rowLetter) => {
                for (let no = 1; no <= cols; no++) {
                    const key = seatKey(rowLetter, no);
                    next[key] = prev[key] ?? getDefaultSeatType(rowLetter, no, cols);
                }
            });
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, cols]);

    const totalSeats = rows * cols;

    const handleSeatClick = (rowLetter: string, seatNo: number) => {
        const key = seatKey(rowLetter, seatNo);
        const currentType = seatTypes[key] ?? getDefaultSeatType(rowLetter, seatNo, cols);

        // Ràng buộc 2: ghế cuối của hàng lẻ không thể là couple (không có ghế cặp)
        const isLastSeatOfOddRow = cols % 2 !== 0 && seatNo === cols;
        if (activeType === 'SWEETBOX' && isLastSeatOfOddRow) {
            message.warning(
                `Seat ${rowLetter}${seatNo} It's the last seat in the row, so it's not possible to order a Sweetbox (Couple) seat.`,
            );
            return;
        }

        setSeatTypes((prev) => {
            const next = { ...prev };
            const partnerNo = pairSeatNo(seatNo);
            const hasValidPartner = partnerNo >= 1 && partnerNo <= cols;
            const partnerKey = hasValidPartner ? seatKey(rowLetter, partnerNo) : null;
            const partnerCurrentType = partnerKey
                ? prev[partnerKey] ?? getDefaultSeatType(rowLetter, partnerNo, cols)
                : null;

            next[key] = activeType;

            if (activeType === 'SWEETBOX') {
                // Chọn couple: gán luôn ghế cặp thành sweetbox
                if (partnerKey) {
                    next[partnerKey] = activeType;
                }
            } else if (currentType === 'SWEETBOX' && partnerKey && partnerCurrentType === 'SWEETBOX') {
                // Ràng buộc 1: đang là couple mà đổi sang loại khác → ghế cặp cũng reset theo loại mới
                next[partnerKey] = activeType;
            }

            return next;
        });
    };

    const handleResetDefaults = () => {
        const next: Record<string, SeatTypeType> = {};
        rowLetters.forEach((rowLetter) => {
            for (let no = 1; no <= cols; no++) {
                next[seatKey(rowLetter, no)] = getDefaultSeatType(rowLetter, no, cols);
            }
        });
        setSeatTypes(next);
        message.success('Reset all seats successfully.');
    };

    const onFinish = async (values: any) => {
        if (rows <= 0 || cols <= 0) {
            message.error('Please input number of row and seat!');
            return;
        }

        const seats: SeatDTO[] = [];
        rowLetters.forEach((rowLetter) => {
            for (let no = 1; no <= cols; no++) {
                seats.push({
                    seatRow: rowLetter,
                    seatNo: no,
                    type: seatTypes[seatKey(rowLetter, no)] ?? getDefaultSeatType(rowLetter, no, cols),
                });
            }
        });

        setLoading(true);
        try {
            const payload: RoomDetailDTO = {
                name: values.name.trim(),
                status: values.status,
                type: values.type,
                totalRows: values.totalRows,
                totalCols: values.totalCols,
                seats,
            };

            const res = await roomService.createRoom(payload);
            const created = res.data;
            api.success({ message:`Create new room with name "${created.name}" successfully!`, placement: 'topRight'});

            form.resetFields();
            setSeatTypes({});
            onSuccess?.();
            onClose?.();
        } catch (error: any) {
            api.error({ message:`Create new room failure`, placement: 'topRight', description: error.response?.data?.message });
        } finally {
            setLoading(false);
        }
    };

    return (
      <>
          {contextHolder}
          <Modal
              title="New room"
              open={open}
              onCancel={onClose}
              footer={null}
              width={1200}
              destroyOnClose
          >
              <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                      Configure room name, room type, and seating chart. Click a seat to assign it the
                      selected seat type below. Sweetbox seats are paired automatically (A1 ↔ A2, A3 ↔ A4, …).
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
                                  <Text type="secondary">Input row and row/seat</Text>
                              ) : (
                                  <div style={{ overflowX: 'auto' }}>
                                      {/* type picker */}
                                      <div
                                          style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 10,
                                              marginBottom: 16,
                                          }}
                                      >
                                          <Text style={{ whiteSpace: 'nowrap' }}>Loại ghế đang chọn:</Text>
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
                                              Slect seat for this type
                                          </Text>
                                      </div>

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
                                                      const cellType =
                                                          seatTypes[key] ??
                                                          getDefaultSeatType(rowLetter, seatNo, cols);

                                                      return (
                                                          <div
                                                              key={i}
                                                              onClick={() => handleSeatClick(rowLetter, seatNo)}
                                                              title={`${rowLetter}${seatNo} - ${SEAT_TYPE_LABELS[cellType]} (click to set ${SEAT_TYPE_LABELS[activeType]})`}
                                                              style={{
                                                                  width: 24,
                                                                  height: 24,
                                                                  borderRadius: 4,
                                                                  background: seatColor[cellType],
                                                                  fontSize: 9,
                                                                  display: 'flex',
                                                                  alignItems: 'center',
                                                                  justifyContent: 'center',
                                                                  color: '#333',
                                                                  cursor: 'pointer',
                                                                  userSelect: 'none',
                                                                  border: '1px solid rgba(0,0,0,0.15)',
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
      </>
    );
};

export default RoomCreateForm;