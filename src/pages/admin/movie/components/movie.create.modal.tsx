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
  Space,
  Typography,
  Divider,
  Tooltip,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { MovieGenre, MovieStatus} from '@/types/movie.types';
import type {
  AdminMovieDTO,
  ComplexShowtimeRequestDTO,
  RoomScheduleDTO,
  RoomNameProjection,
} from '@/types/movie.types';
import { movieService } from '@/services/movie.service';
import { baseURL } from '@/services/axiosClient';
import dayjs from 'dayjs';
import ImgCrop from 'antd-img-crop';
import '@/styles/movie.admin.css';
import RoomScheduleEditor from "@/pages/admin/showtime/room.schedule.editor.tsx";

const { Text, Title } = Typography;

interface MovieCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = ['Movie information', 'Choose room & Schedule', 'Confirm'];


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
          .catch(() => message.error('Not found rooms'))
          .finally(() => setRoomsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (error: any) {
      onError(error);
      api.error({
        message: 'Upload poster failure!',
        placement: 'topRight',
        description: error.response?.data?.message,
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

  // ── Submit (SHOWING flow with rooms) ──
  const handleSubmit = async () => {
    if (!imageUrl) {
      message.error('Please upload poster!');
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
      api.success({ message: 'Create movie success', placement: 'topRight' });
      resetAll();
      onSuccess();
    } catch (error: any) {
      api.error({
        message: 'Failure',
        placement: 'topRight',
        description: error.response?.data?.message,
      });

      // If the backend moved the poster from movie-temps to the final
      // folder before throwing the showtime-conflict error, the temp file
      // referenced by `imageUrl` no longer exists. Retrying with the same
      // imageUrl would silently send a dead path and the poster ends up
      // null. Force a re-upload instead of resubmitting a stale reference.
      setImageUrl(undefined);
      message.warning('Please re-upload the poster image before retrying.');
      setCurrentStep(0);
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
                label="Movie title"
                placeholder="Input title"
                rules={[{ required: true, message: 'Title is required' }]}
            />
            <ProFormTextArea
                name="description"
                label="Description"
                placeholder="Input description"
                fieldProps={{ rows: 3 }}
            />
            <ProFormDigit
                name="durationMinutes"
                label="Duration (minutes)"
                placeholder="EX: 120"
                min={1}
                rules={[{ required: true, message: 'Duration is required' }]}
            />
            <ProFormText name="director" label="Director" placeholder="Director" />
          </div>
          <div style={{ flex: 1 }}>
            <ProFormSelect
                name="genre"
                label="Genre"
                options={Object.values(MovieGenre).map((g) => ({ label: g, value: g }))}
                rules={[{ required: true, message: 'Please select genre' }]}
            />
            <ProFormDateTimePicker
                name="releaseDate"
                label="Release date"
                fieldProps={{
                  disabledDate: (current) => current && current < dayjs().startOf('day'),
                }}
                rules={[{ required: true, message: 'Release date is required' }]}
            />
            <ProFormSelect
                name="status"
                label="Status"
                options={Object.values(MovieStatus).map((s) => ({ label: s, value: s }))}
                rules={[{ required: true, message: 'Status is required' }]}
            />
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>Image poster *</label>
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
        <Text strong>Select rooms:</Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0 18px' }}>
          {roomsLoading && <Text type="secondary">Loading...</Text>}
          {!roomsLoading && availableRooms.length === 0 && (
              <Text type="secondary">Not found any room</Text>
          )}
          {availableRooms.map((room) => {
            const checked = roomSchedules.has(room.id);
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
                description="Select 1 or many room for create screenings"
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
                      duration={movieFields.durationMinutes || 0}
                      releaseDate={movieFields.releaseDate as any}
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
          <Title level={5}>Information movie</Title>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={2}>
              <Text>
                🎬 <strong>{movieFields.title}</strong>
              </Text>
              <Text>⏱ {movieFields.durationMinutes} minutes</Text>
              <Text>
                🎭 {movieFields.genre} · {movieFields.status}
              </Text>
              <Text>🎬 Director: {movieFields.director || '-'}</Text>
              <Text>
                📅 Release date:{' '}
                {movieFields.releaseDate
                    ? dayjs(movieFields.releaseDate as any).format('DD/MM/YYYY HH:mm')
                    : '-'}
              </Text>
            </Space>
          </Card>

          <Title level={5}>Schedule({totalShowtimes} screenings)</Title>
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
            title="Create movie"
            open={open}
            onOpenChange={(visible) => {
              if (!visible) handleClose();
            }}
            modalProps={{
              destroyOnClose: true,
              onCancel: handleClose,
              width: 860,
            }}
            submitter={false}
            onFinish={async (values) => {
              setMovieFields({ ...values, releaseDate: values.releaseDate as any });

              if (values.status === MovieStatus.SHOWING) {
                setCurrentStep(1);
              } else {
                try {
                  await movieService.createMovie({
                    ...values,
                    posterUrl: imageUrl,
                    releaseDate: dayjs(values.releaseDate).format('YYYY-MM-DDTHH:mm:ss'),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    rooms: [],
                  });
                  api.success({ message: 'Create movie successfully!', placement: 'topRight' });
                  resetAll();
                  onSuccess();
                  onClose();
                } catch (error) {
                  api.error({
                    message: 'Create movie failure!',
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-expect-error
                    description: error.response?.data?.message || 'Failed to create',
                    placement: 'topRight',
                  });

                  // Same poster-temp-file issue — clear stale imageUrl
                  // and force re-upload before next attempt.
                  setImageUrl(undefined);
                  message.warning('Please re-upload the poster image before retrying.');
                }
              }

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
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            If the film is in showing mode, then the screening schedule for the rooms can be determined.
          </Text>

          {/* Step content */}
          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}

          {/* Navigation buttons outside ProForm submitter */}
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={currentStep === 0 ? handleClose : () => setCurrentStep((s) => s - 1)}>
              {currentStep === 0 ? 'Close' : '← Back'}
            </Button>

            <Space>
              {currentStep === 0 && (
                  <Button type="primary" htmlType="submit">
                    Save or continue →
                  </Button>
              )}

              {currentStep === 1 && (
                  <Tooltip
                      title={
                        !step2Valid()
                            ? 'Each room needs at least one day of screening, and at least one hour of screening per day.'
                            : ''
                      }
                  >
                    <Button type="primary"
                            // disabled={!step2Valid()}
                            onClick={() => setCurrentStep(2)}>
                      View summary →
                    </Button>
                  </Tooltip>
              )}

              {currentStep === 2 && (
                  <Button type="primary" loading={submitting} onClick={handleSubmit}>
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