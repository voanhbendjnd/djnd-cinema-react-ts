import React, { useEffect, useState } from 'react';
import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProFormDigit,
  ProFormDateTimePicker,
} from '@ant-design/pro-components';
import {
  Upload,
  message,
  notification,
  Steps,
  Button,
  Card,
  Tag,
  DatePicker,
  TimePicker,
  Space,
  Typography,
  Divider,
  Tooltip,
  Empty,
  Badge,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  LoadingOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { MovieGenre, MovieStatus, HOT_TIME_SLOTS } from '@/types/movie.types';
import type {
  AdminMovieDTO,
  ComplexShowtimeRequestDTO,
  RoomScheduleDTO,
  RoomNameProjection,
} from '@/types/movie.types';
import { movieService } from '@/services/movie.service';
import { baseURL } from '@/services/axiosClient';
import dayjs, { Dayjs } from 'dayjs';
import ImgCrop from 'antd-img-crop';
import '@/styles/movie.admin.css';

const { Text, Title } = Typography;

interface MovieCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = ['Thông tin phim', 'Chọn phòng & Lịch chiếu', 'Xác nhận'];

// ─────────────────────────────────────────────────────────────
// Sub-component: Lịch chiếu cho 1 phòng
// ─────────────────────────────────────────────────────────────
interface RoomScheduleEditorProps {
  room: RoomNameProjection;
  schedule: RoomScheduleDTO;
  onChange: (schedule: RoomScheduleDTO) => void;
  onRemove: () => void;
}

type TimePickMode = 'manual' | 'preset';

const RoomScheduleEditor: React.FC<RoomScheduleEditorProps> = ({
                                                                 room,
                                                                 schedule,
                                                                 onChange,
                                                                 onRemove,
                                                               }) => {
  const [mode, setMode] = useState<TimePickMode>('preset');

  const addDay = (date: Dayjs | null) => {
    if (!date) return;
    const dateStr = date.format('YYYY-MM-DD');
    if (schedule.days.find((d) => d.date === dateStr)) {
      message.warning('Ngày này đã được thêm!');
      return;
    }
    onChange({
      ...schedule,
      days: [...schedule.days, { date: dateStr, startTimes: [] }],
    });
  };

  const removeDay = (dateStr: string) => {
    onChange({
      ...schedule,
      days: schedule.days.filter((d) => d.date !== dateStr),
    });
  };

  const updateTimes = (dateStr: string, times: string[]) => {
    onChange({
      ...schedule,
      days: schedule.days.map((d) =>
          d.date === dateStr ? { ...d, startTimes: [...times].sort() } : d
      ),
    });
  };

  const togglePresetTime = (dateStr: string, time: string, checked: boolean) => {
    const day = schedule.days.find((d) => d.date === dateStr)!;
    const newTimes = checked
        ? [...day.startTimes, time].sort()
        : day.startTimes.filter((t) => t !== time);
    updateTimes(dateStr, newTimes);
  };

  const addManualTime = (dateStr: string, time: Dayjs | null) => {
    if (!time) return;
    const timeStr = time.format('HH:mm');
    const day = schedule.days.find((d) => d.date === dateStr)!;
    if (day.startTimes.includes(timeStr)) {
      message.warning('Giờ này đã có!');
      return;
    }
    updateTimes(dateStr, [...day.startTimes, timeStr]);
  };

  const removeManualTime = (dateStr: string, time: string) => {
    const day = schedule.days.find((d) => d.date === dateStr)!;
    updateTimes(dateStr, day.startTimes.filter((t) => t !== time));
  };

  return (
      <Card
          size="small"
          title={
            <Space>
              <Text strong>{room.name}</Text>
              <Badge count={schedule.days.length} style={{ backgroundColor: '#1677ff' }} />
            </Space>
          }
          extra={
            <Button size="small" danger icon={<DeleteOutlined />} onClick={onRemove}>
              Bỏ chọn
            </Button>
          }
          style={{ marginBottom: 12 }}
      >
        {/* Mode toggle */}
        <Radio.Group
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            size="small"
            style={{ marginBottom: 12 }}
        >
          <Radio.Button value="preset">
            <ThunderboltOutlined /> Chọn khung giờ hot
          </Radio.Button>
          <Radio.Button value="manual">
            <EditOutlined /> Nhập tay
          </Radio.Button>
        </Radio.Group>

        {/* Add date picker */}
        <div style={{ marginBottom: 12 }}>
          <DatePicker
              size="small"
              placeholder="Thêm ngày chiếu"
              disabledDate={(d) => d && d < dayjs().startOf('day')}
              onChange={addDay}
              value={null}
              style={{ width: 180 }}
          />
        </div>

        {/* Days */}
        {schedule.days.length === 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Chưa có ngày chiếu. Chọn ngày bên trên để thêm.
            </Text>
        )}

        {schedule.days
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((day) => (
                <div
                    key={day.date}
                    style={{
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      marginBottom: 8,
                    }}
                >
                  <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                  >
                    <Text strong style={{ fontSize: 13 }}>
                      📅 {dayjs(day.date).format('DD/MM/YYYY (ddd)')}
                    </Text>
                    <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeDay(day.date)}
                    />
                  </div>

                  {/* Selected times display */}
                  <Space wrap style={{ marginBottom: 8 }}>
                    {day.startTimes.length === 0 && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Chưa chọn giờ nào
                        </Text>
                    )}
                    {day.startTimes.map((t) => (
                        <Tag
                            key={t}
                            closable={mode === 'manual'}
                            onClose={() => removeManualTime(day.date, t)}
                            icon={<ClockCircleOutlined />}
                            color="blue"
                            style={{ fontSize: 12 }}
                        >
                          {t}
                        </Tag>
                    ))}
                  </Space>

                  {/* Preset mode */}
                  {mode === 'preset' && (
                      <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 6,
                          }}
                      >
                        {HOT_TIME_SLOTS.map((slot) => {
                          const checked = day.startTimes.includes(slot);
                          return (
                              <Tooltip key={slot} title={checked ? 'Bỏ chọn' : 'Chọn'}>
                                <Tag
                                    style={{
                                      cursor: 'pointer',
                                      userSelect: 'none',
                                      borderStyle: checked ? 'solid' : 'dashed',
                                      fontSize: 12,
                                      margin: 0,
                                    }}
                                    color={checked ? 'blue' : undefined}
                                    onClick={() =>
                                        togglePresetTime(day.date, slot, !checked)
                                    }
                                >
                                  {slot}
                                </Tag>
                              </Tooltip>
                          );
                        })}
                      </div>
                  )}

                  {/* Manual mode */}
                  {mode === 'manual' && (
                      <TimePicker
                          size="small"
                          format="HH:mm"
                          placeholder="Chọn giờ rồi Enter"
                          minuteStep={5}
                          onSelect={(time) => addManualTime(day.date, time)}
                          value={null}
                          style={{ width: 140 }}
                      />
                  )}
                </div>
            ))}
      </Card>
  );
};

// ─────────────────────────────────────────────────────────────
// Main modal
// ─────────────────────────────────────────────────────────────
const MovieCreateModal: React.FC<MovieCreateModalProps> = ({ open, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [api, contextHolder] = notification.useNotification();

  // Step 1 form values snapshot
  const [movieFields, setMovieFields] = useState<Partial<AdminMovieDTO>>({});

  // Step 2: available rooms from backend
  const [availableRooms, setAvailableRooms] = useState<RoomNameProjection[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Step 2: selected schedules, keyed by roomId
  const [roomSchedules, setRoomSchedules] = useState<Map<number, RoomScheduleDTO>>(new Map());

  const [submitting, setSubmitting] = useState(false);

  // Fetch rooms when modal opens or reaching step 2
  useEffect(() => {
    if (open && currentStep === 1 && availableRooms.length === 0) {
      setRoomsLoading(true);
      movieService
          .getRoomsForMovie()
          .then((res: any) => setAvailableRooms(res?.data ?? res ?? []))
          .catch(() => message.error('Không thể tải danh sách phòng'))
          .finally(() => setRoomsLoading(false));
    }
  }, [open, currentStep]);

  const resetAll = () => {
    setCurrentStep(0);
    setImageUrl(undefined);
    setMovieFields({});
    setRoomSchedules(new Map());
    setAvailableRooms([]);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // ── Upload poster ──
  const handleUploadChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') setImageLoading(true);
  };

  const customUpload = async (options: any) => {
    const { file, onSuccess: uploadSuccess, onError } = options;
    try {
      setImageLoading(true);
      const tempUrl = await movieService.uploadTempFile(file as File);
      setImageUrl(tempUrl);
      uploadSuccess(tempUrl);
      api.success({ message: 'Upload ảnh thành công!', placement: 'topRight' });
    } catch (error: any) {
      onError(error);
      api.error({
        message: 'Upload thất bại!',
        placement: 'topRight',
        description: error.response?.data?.message || 'Lỗi không xác định',
      });
    } finally {
      setImageLoading(false);
    }
  };

  // ── Room selection ──
  const toggleRoom = (room: RoomNameProjection, checked: boolean) => {
    const next = new Map(roomSchedules);
    if (checked) {
      next.set(room.id, { id: room.id, days: [] });
    } else {
      next.delete(room.id);
    }
    setRoomSchedules(next);
  };

  const updateRoomSchedule = (roomId: number, schedule: RoomScheduleDTO) => {
    const next = new Map(roomSchedules);
    next.set(roomId, schedule);
    setRoomSchedules(next);
  };

  // ── Validation helpers ──
  const step2Valid = (): boolean => {
    if (roomSchedules.size === 0) return false;
    for (const sched of roomSchedules.values()) {
      if (sched.days.length === 0) return false;
      for (const day of sched.days) {
        if (day.startTimes.length === 0) return false;
      }
    }
    return true;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!imageUrl) {
      message.error('Vui lòng upload ảnh poster!');
      setCurrentStep(0);
      return;
    }
    setSubmitting(true);
    try {
      const payload: ComplexShowtimeRequestDTO = {
        ...(movieFields as AdminMovieDTO),
        posterUrl: imageUrl,
        releaseDate: movieFields.releaseDate
            ? dayjs(movieFields.releaseDate as any).format('YYYY-MM-DDTHH:mm:ss')
            : undefined,
        rooms: Array.from(roomSchedules.values()),
      };

      await movieService.createMovie(payload as any);
      api.success({ message: 'Tạo phim & lịch chiếu thành công!', placement: 'topRight' });
      resetAll();
      onSuccess();
    } catch (error: any) {
      api.error({
        message: 'Tạo phim thất bại!',
        placement: 'topRight',
        description: error.response?.data?.message || 'Lỗi không xác định',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render step content ──
  const renderStep0 = () => (
      <>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <ProFormText
                name="title"
                label="Tên phim"
                placeholder="Nhập tên phim"
                rules={[{ required: true, message: 'Tên phim không được trống!' }]}
            />
            <ProFormTextArea
                name="description"
                label="Mô tả"
                placeholder="Nhập mô tả phim"
                fieldProps={{ rows: 3 }}
            />
            <ProFormDigit
                name="durationMinutes"
                label="Thời lượng (phút)"
                placeholder="VD: 120"
                min={1}
                rules={[{ required: true, message: 'Thời lượng không được trống!' }]}
            />
            <ProFormText name="director" label="Đạo diễn" placeholder="Tên đạo diễn" />
          </div>
          <div style={{ flex: 1 }}>
            <ProFormSelect
                name="genre"
                label="Thể loại"
                options={Object.values(MovieGenre).map((g) => ({ label: g, value: g }))}
                rules={[{ required: true, message: 'Vui lòng chọn thể loại!' }]}
            />
            <ProFormDateTimePicker
                name="releaseDate"
                label="Ngày khởi chiếu"
                fieldProps={{
                  disabledDate: (current) => current && current < dayjs().startOf('day'),
                }}
                rules={[{ required: true, message: 'Vui lòng chọn ngày khởi chiếu!' }]}
            />
            <ProFormSelect
                name="status"
                label="Trạng thái"
                options={Object.values(MovieStatus).map((s) => ({ label: s, value: s }))}
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
            />
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>Ảnh poster *</label>
              <ImgCrop rotationSlider aspect={2 / 3}>
                <Upload
                    name="file"
                    listType="picture-card"
                    className="avatar-uploader-poster"
                    showUploadList={false}
                    customRequest={customUpload}
                    onChange={handleUploadChange}
                    accept=".png,.jpeg,.jpg,.webp"
                >
                  {imageUrl ? (
                      <img
                          src={`${baseURL}/api/v1/files/movie-temps/${imageUrl}`}
                          alt="poster"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                  ) : (
                      <div>
                        {imageLoading ? <LoadingOutlined /> : <PlusOutlined />}
                        <div style={{ marginTop: 8 }}>Upload</div>
                      </div>
                  )}
                </Upload>
              </ImgCrop>
            </div>
          </div>
        </div>
      </>
  );

  const renderStep1 = () => (
      <div>
        {/* Room checkboxes */}
        <Text strong>Chọn phòng chiếu:</Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0 18px' }}>
          {roomsLoading && <Text type="secondary">Đang tải danh sách phòng...</Text>}
          {!roomsLoading && availableRooms.length === 0 && (
              <Text type="secondary">Không có phòng nào khả dụng</Text>
          )}
          {availableRooms.map((room) => {
            const checked = roomSchedules.has(room.id);
            console.log("Check Room Object:", room)
            return (
                <Tag.CheckableTag
                    key={room.id}
                    checked={checked}
                    onChange={(c) => toggleRoom(room, c)}
                    style={{
                      padding: '4px 14px',
                      fontSize: 13,
                      borderRadius: 20,
                      border: '1px dashed',
                      cursor: 'pointer',
                    }}
                >
                  {room.name}
                </Tag.CheckableTag>
            );
          })}
        </div>

        <Divider />

        {/* Schedule editors */}
        {roomSchedules.size === 0 ? (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chọn ít nhất 1 phòng để cấu hình lịch chiếu"
            />
        ) : (
            Array.from(roomSchedules.entries()).map(([roomId, schedule]) => {
              const room = availableRooms.find((r) => r.id === roomId)!;
              return (
                  <RoomScheduleEditor
                      key={roomId}
                      room={room}
                      schedule={schedule}
                      onChange={(s) => updateRoomSchedule(roomId, s)}
                      onRemove={() => toggleRoom(room, false)}
                  />
              );
            })
        )}
      </div>
  );

  const renderStep2 = () => {
    const totalShowtimes = Array.from(roomSchedules.values()).reduce(
        (acc, s) => acc + s.days.reduce((a, d) => a + d.startTimes.length, 0),
        0
    );
    return (
        <div>
          <Title level={5}>Thông tin phim</Title>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={2}>
              <Text>🎬 <strong>{movieFields.title}</strong></Text>
              <Text>⏱ {movieFields.durationMinutes} phút</Text>
              <Text>🎭 {movieFields.genre} · {movieFields.status}</Text>
              <Text>🎬 Đạo diễn: {movieFields.director || '-'}</Text>
              <Text>📅 Khởi chiếu: {movieFields.releaseDate ? dayjs(movieFields.releaseDate as any).format('DD/MM/YYYY HH:mm') : '-'}</Text>
            </Space>
          </Card>

          <Title level={5}>Lịch chiếu ({totalShowtimes} suất)</Title>
          {Array.from(roomSchedules.entries()).map(([roomId, schedule]) => {
            const room = availableRooms.find((r) => r.id === roomId)!;
            return (
                <Card key={roomId} size="small" title={room?.name} style={{ marginBottom: 8 }}>
                  {schedule.days
                      .slice()
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((day) => (
                          <div key={day.date} style={{ marginBottom: 6 }}>
                            <Text type="secondary" style={{ marginRight: 8 }}>
                              {dayjs(day.date).format('DD/MM/YYYY')}:
                            </Text>
                            <Space wrap>
                              {day.startTimes.map((t) => (
                                  <Tag key={t} color="blue" icon={<ClockCircleOutlined />}>
                                    {t}
                                  </Tag>
                              ))}
                            </Space>
                          </div>
                      ))}
                </Card>
            );
          })}
        </div>
    );
  };

  return (
      <>
        {contextHolder}
        <ModalForm<AdminMovieDTO>
            title="Tạo phim mới"
            open={open}
            onOpenChange={(visible) => { if (!visible) handleClose(); }}
            modalProps={{
              destroyOnClose: true,
              onCancel: handleClose,
              width: 860,
            }}
            submitter={false}
            onFinish={async (values) => {
              // Step 0 -> 1: snapshot form values and move to next step
              setMovieFields({ ...values, releaseDate: values.releaseDate as any });
              setCurrentStep(1);
              return false;
            }}
        >
          {/* Step indicator */}
          <Steps
              current={currentStep}
              size="small"
              items={STEPS.map((title) => ({ title }))}
              style={{ marginBottom: 24 }}
          />

          {/* Step content */}
          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}

          {/* Navigation buttons outside ProForm submitter */}
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={currentStep === 0 ? handleClose : () => setCurrentStep((s) => s - 1)}>
              {currentStep === 0 ? 'Đóng' : '← Quay lại'}
            </Button>

            <Space>
              {currentStep === 0 && (
                  <Button
                      type="primary"
                      htmlType="submit"
                  >
                    Tiếp theo →
                  </Button>
              )}

              {currentStep === 1 && (
                  <Tooltip title={!step2Valid() ? 'Mỗi phòng cần có ít nhất 1 ngày và mỗi ngày ít nhất 1 giờ chiếu' : ''}>
                    <Button
                        type="primary"
                        disabled={!step2Valid()}
                        onClick={() => setCurrentStep(2)}
                    >
                      Xem tóm tắt →
                    </Button>
                  </Tooltip>
              )}

              {currentStep === 2 && (
                  <Button
                      type="primary"
                      loading={submitting}
                      onClick={handleSubmit}
                  >
                    Confirm & Create movie
                  </Button>
              )}
            </Space>
          </div>
        </ModalForm>
      </>
  );
};

export default MovieCreateModal;