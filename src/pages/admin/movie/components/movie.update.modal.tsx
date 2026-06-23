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
    Alert,
    Form,
    Spin,
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
import { MovieGenre, MovieStatus, HOT_TIME_SLOTS, type MovieStatusType } from '@/types/movie.types';
import type {
    AdminMovieDTO,
    ComplexShowtimeRequestDTO,
    RoomScheduleDTO,
    RoomNameProjection,
} from '@/types/movie.types';
import 'dayjs/locale/en';
import { movieService } from '@/services/movie.service';
import { showtimeService } from '@/services/showtime.service';
import { baseURL } from '@/services/axiosClient';
import dayjs, { Dayjs } from 'dayjs';
import ImgCrop from 'antd-img-crop';
import '@/styles/movie.admin.css';

const { Text, Title } = Typography;

interface MovieUpdateModalProps {
    open: boolean;
    movie: ComplexShowtimeRequestDTO | null;
    onClose: () => void;
    onSuccess: () => void;
}

const STEPS = ['Movie information', 'Room & Schedule', 'Confirm'];

// ── Format LocalTime "HH:mm:ss" → "HH:mm" ──
const fmtTime = (t: string) => t.slice(0, 5);

// ─────────────────────────────────────────────────────────────
// Time / release-date helpers
// ─────────────────────────────────────────────────────────────
const timeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

// Extract "YYYY-MM-DD" from a release ISO datetime string
const getReleaseDateOnly = (releaseDate?: string): string | null => {
    if (!releaseDate) return null;
    return dayjs(releaseDate).format('YYYY-MM-DD');
};

// Extract release time as minutes-since-midnight
const getReleaseTimeMinutes = (releaseDate?: string): number | null => {
    if (!releaseDate) return null;
    const d = dayjs(releaseDate);
    return d.hour() * 60 + d.minute();
};

// True only when the day being scheduled IS the release date AND the slot
// time is earlier than the release time on that same day
const isBeforeReleaseTime = (
    dateStr: string,
    slot: string,
    releaseDateOnly: string | null,
    releaseTimeMinutes: number | null,
): boolean => {
    if (!releaseDateOnly || releaseTimeMinutes === null) return false;
    if (dateStr !== releaseDateOnly) return false;
    return timeToMinutes(slot) < releaseTimeMinutes;
};

const isOverlappingWithSelected = (slot: string, selectedTimes: string[], duration: number): boolean => {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + duration + 15;

    for (const t of selectedTimes) {
        const tFormatted = t.slice(0, 5);
        if (slot === tFormatted) continue;

        const tStart = timeToMinutes(tFormatted);
        const tEnd = tStart + duration + 15;

        if (tStart < slotEnd && slotStart < tEnd) {
            return true;
        }
    }
    return false;
};

// ─────────────────────────────────────────────────────────────
// RoomScheduleEditor
// ─────────────────────────────────────────────────────────────
type TimePickMode = 'manual' | 'preset';

interface RoomScheduleEditorProps {
    room: RoomNameProjection;
    schedule: RoomScheduleDTO;
    onChange: (s: RoomScheduleDTO) => void;
    onRemove: () => void;
    duration: number;
    releaseDate?: string; // ISO datetime string, e.g. "2026-07-01T19:30:00"
    movieId: number | undefined;
}

const RoomScheduleEditor: React.FC<RoomScheduleEditorProps> = ({
                                                                   room,
                                                                   schedule,
                                                                   onChange,
                                                                   onRemove,
                                                                   duration,
                                                                   releaseDate,
    movieId
                                                               }) => {
    const [mode, setMode] = useState<TimePickMode>('preset');
    const [occupiedTimesMap, setOccupiedTimesMap] = useState<Record<string, string[]>>({});
    const [api, contextHolder] = notification.useNotification();

    const releaseDateOnly = getReleaseDateOnly(releaseDate);
    const releaseTimeMinutes = getReleaseTimeMinutes(releaseDate);

    dayjs.locale('en');

    useEffect(() => {
        const fetchOccupiedTimes = async () => {
            const newMap = { ...occupiedTimesMap };
            let updated = false;

            for (const day of schedule.days) {
                const dateStr = day.date;
                if (!newMap[dateStr]) {
                    try {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        const res = await showtimeService.getAllTimeAtDateByRoom(room.id, dateStr, movieId);
                        const times = (res.data || []).map((dt: string) => dayjs(dt).format('HH:mm'));
                        newMap[dateStr] = times;
                        updated = true;
                    } catch (error) {
                        console.error('Failed to fetch occupied times:', error);
                    }
                }
            }

            if (updated) {
                setOccupiedTimesMap(newMap);
            }
        };

        if (schedule.days.length > 0) {
            fetchOccupiedTimes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schedule.days, room.id]);

    const addDay = (date: Dayjs | null) => {
        if (!date) return;
        const dateStr = date.format('YYYY-MM-DD');

        // Block any date strictly before the movie's release date
        if (releaseDateOnly && dateStr < releaseDateOnly) {
            message.warning(
                `Cannot schedule before release date (${dayjs(releaseDateOnly).format('DD/MM/YYYY')})!`
            );
            return;
        }

        if (schedule.days.find((d) => d.date === dateStr)) {
            message.warning('This date already added!');
            return;
        }
        onChange({
            ...schedule,
            days: [...schedule.days, { date: dateStr, startTimes: [] }],
        });
    };

    const removeDay = (dateStr: string) =>
        onChange({ ...schedule, days: schedule.days.filter((d) => d.date !== dateStr) });

    const updateTimes = (dateStr: string, times: string[]) =>
        onChange({
            ...schedule,
            days: schedule.days.map((d) => (d.date === dateStr ? { ...d, startTimes: [...times].sort() } : d)),
        });

    const handlePresetClick = async (dateStr: string, slot: string, checked: boolean) => {
        if (checked) {
            if (isBeforeReleaseTime(dateStr, slot, releaseDateOnly, releaseTimeMinutes)) {
                message.warning(
                    `Showtime cannot be before release time (${dayjs(releaseDate).format('HH:mm')})!`
                );
                return;
            }
            try {
                await showtimeService.checkConflict({
                    duration,
                    date: dateStr,
                    time: slot + ':00',
                    roomName: room.name,
                    roomId: room.id,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-expect-error
                    movieId: movieId,
                });
                const day = schedule.days.find((d) => d.date === dateStr)!;
                updateTimes(dateStr, [...day.startTimes.map(fmtTime), slot].sort());
            } catch (error: any) {
                const errMsg = error.response?.data?.message || 'Time conflict detected!';
                api.error({ message: `Showtime conflict`, placement: 'topRight', description: errMsg });
            }
        } else {
            const day = schedule.days.find((d) => d.date === dateStr)!;
            updateTimes(dateStr, day.startTimes.map(fmtTime).filter((t) => t !== slot));
        }
    };

    const addManual = async (dateStr: string, time: Dayjs | null) => {
        if (!time) return;
        const t = time.format('HH:mm');
        const day = schedule.days.find((d) => d.date === dateStr)!;

        if (day.startTimes.map(fmtTime).includes(t)) {
            message.warning('This time already exists!');
            return;
        }

        if (isBeforeReleaseTime(dateStr, t, releaseDateOnly, releaseTimeMinutes)) {
            message.error(`Showtime cannot be before release time (${dayjs(releaseDate).format('HH:mm')})!`);
            return;
        }

        const occupied = occupiedTimesMap[dateStr] || [];
        if (occupied.includes(t)) {
            message.error('This time is already occupied in this room!');
            return;
        }

        try {
            await showtimeService.checkConflict({
                duration,
                date: dateStr,
                time: t + ':00',
                roomName: room.name,
                roomId: room.id,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-expect-error
                movieId: movieId,
            });
            updateTimes(dateStr, [...day.startTimes.map(fmtTime), t].sort());
        } catch (error: any) {
            const errMsg = error.response?.data?.message || 'Time conflict detected!';
            message.error(errMsg);
        }
    };

    const removeManual = (dateStr: string, t: string) => {
        const day = schedule.days.find((d) => d.date === dateStr)!;
        updateTimes(dateStr, day.startTimes.map(fmtTime).filter((x) => x !== t));
    };

    return (
        <>
            {contextHolder}
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
                        Deselect
                    </Button>
                }
                style={{ marginBottom: 12 }}
            >
                <Radio.Group
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    size="small"
                    style={{ marginBottom: 12 }}
                >
                    <Radio.Button value="preset">
                        <ThunderboltOutlined /> Hot time
                    </Radio.Button>
                    <Radio.Button value="manual">
                        <EditOutlined /> Input
                    </Radio.Button>
                </Radio.Group>

                <div style={{ marginBottom: 12 }}>
                    <DatePicker
                        size="small"
                        placeholder="Add date time"
                        disabledDate={(d) =>
                            !!d &&
                            (d < dayjs().startOf('day') ||
                                (releaseDateOnly ? d < dayjs(releaseDateOnly).startOf('day') : false))
                        }
                        onChange={addDay}
                        value={null}
                        style={{ width: 180 }}
                    />
                </div>

                {schedule.days.length === 0 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Not found schedule.
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

                            <Space wrap style={{ marginBottom: 8 }}>
                                {day.startTimes.length === 0 && (
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        Time not yet selected
                                    </Text>
                                )}
                                {day.startTimes.map((t) => (
                                    <Tag
                                        key={t}
                                        closable={mode === 'manual'}
                                        onClose={() => removeManual(day.date, t)}
                                        icon={<ClockCircleOutlined />}
                                        color="blue"
                                        style={{ fontSize: 12 }}
                                    >
                                        {fmtTime(t)}
                                    </Tag>
                                ))}
                            </Space>

                            {/* Occupied times display */}
                            {(occupiedTimesMap[day.date] || []).length > 0 && (
                                <div style={{ marginTop: 4, marginBottom: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                                        Occupied times in this room:
                                    </Text>
                                    <Space wrap>
                                        {(occupiedTimesMap[day.date] || []).map((t) => (
                                            <Tag
                                                key={t}
                                                color="error"
                                                style={{ fontSize: 11, cursor: 'not-allowed', opacity: 0.8 }}
                                                icon={<ClockCircleOutlined />}
                                            >
                                                {t} (Occupied)
                                            </Tag>
                                        ))}
                                    </Space>
                                </div>
                            )}

                            {mode === 'preset' && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {HOT_TIME_SLOTS.map((slot) => {
                                        const checked = day.startTimes.map(fmtTime).includes(slot);
                                        const isOccupied = (occupiedTimesMap[day.date] || []).includes(slot);
                                        const isOverlappingSelected = isOverlappingWithSelected(
                                            slot,
                                            day.startTimes.filter((t) => fmtTime(t) !== slot),
                                            duration
                                        );
                                        const isBeforeRelease = isBeforeReleaseTime(
                                            day.date,
                                            slot,
                                            releaseDateOnly,
                                            releaseTimeMinutes
                                        );
                                        const isDisabled = isOccupied || isOverlappingSelected || isBeforeRelease;

                                        return (
                                            <Tooltip
                                                key={slot}
                                                title={
                                                    isOccupied
                                                        ? 'Occupied (Cannot choose)'
                                                        : isOverlappingSelected
                                                            ? 'Overlaps with selected time'
                                                            : isBeforeRelease
                                                                ? 'Before release time'
                                                                : checked
                                                                    ? 'Deselect'
                                                                    : 'Choose'
                                                }
                                            >
                                                <Tag
                                                    style={{
                                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                        userSelect: 'none',
                                                        borderStyle: checked ? 'solid' : 'dashed',
                                                        fontSize: 12,
                                                        margin: 0,
                                                        opacity: isDisabled ? 0.5 : 1,
                                                        textDecoration: isDisabled ? 'line-through' : 'none',
                                                    }}
                                                    color={
                                                        isOccupied
                                                            ? 'error'
                                                            : isOverlappingSelected
                                                                ? 'warning'
                                                                : isBeforeRelease
                                                                    ? 'default'
                                                                    : checked
                                                                        ? 'blue'
                                                                        : undefined
                                                    }
                                                    onClick={() => {
                                                        if (isDisabled) return;
                                                        handlePresetClick(day.date, slot, !checked);
                                                    }}
                                                >
                                                    {slot}
                                                </Tag>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            )}

                            {mode === 'manual' && (
                                <TimePicker
                                    size="small"
                                    format="HH:mm"
                                    placeholder="Select hour"
                                    minuteStep={5}
                                    onSelect={(t) => addManual(day.date, t)}
                                    value={null}
                                    style={{ width: 140 }}
                                />
                            )}
                        </div>
                    ))}
            </Card>
        </>
    );
};

// ─────────────────────────────────────────────────────────────
// Main Update Modal
// ─────────────────────────────────────────────────────────────
const MovieUpdateModal: React.FC<MovieUpdateModalProps> = ({ open, movie, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const [imageLoading, setImageLoading] = useState(false);
    // null = keep original poster, string = new temp upload
    const [newPosterUrl, setNewPosterUrl] = useState<string | null>(null);
    const [api, contextHolder] = notification.useNotification();

    const getAvailableStatuses = (currentStatus: MovieStatusType) => {
        switch (currentStatus) {
            case MovieStatus.UPCOMING:
                return [MovieStatus.UPCOMING, MovieStatus.SHOWING];
            case MovieStatus.SHOWING:
                return [MovieStatus.SHOWING, MovieStatus.ENDED];
            case MovieStatus.ENDED:
                return [MovieStatus.ENDED];
            default:
                return Object.values(MovieStatus);
        }
    };

    const [movieFields, setMovieFields] = useState<Partial<AdminMovieDTO>>({});
    const [availableRooms, setAvailableRooms] = useState<RoomNameProjection[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [roomSchedules, setRoomSchedules] = useState<Map<number, RoomScheduleDTO>>(new Map());
    const [submitting, setSubmitting] = useState(false);

    const [fetchedMovie, setFetchedMovie] = useState<ComplexShowtimeRequestDTO | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchMovieDetail = async (movieId: number) => {
        setDetailLoading(true);
        try {
            const res = await movieService.fetchMovieById(movieId);
            const fullMovieData = (res.data ?? res) as unknown as ComplexShowtimeRequestDTO;
            setFetchedMovie(fullMovieData);
        } catch (error) {
            message.error('Failed to fetch movie details');
        } finally {
            setDetailLoading(false);
        }
    };

    const currentMovie = fetchedMovie || movie;

    // Whether this movie already has screenings (backend blocks durationMinutes & releaseDate)
    const hasScreenings = Boolean(
        currentMovie?.rooms &&
        currentMovie.rooms.length > 0 &&
        currentMovie.rooms.some((r) => r.days && r.days.length > 0)
    );

    const [currentStatus, setCurrentStatus] = useState<string>('');

    const submitDirectly = async (values: AdminMovieDTO) => {
        setSubmitting(true);
        try {
            const payload: ComplexShowtimeRequestDTO = {
                ...values,
                id: currentMovie?.id,
                posterUrl: newPosterUrl ?? currentMovie?.posterUrl,
                releaseDate: values.releaseDate
                    ? dayjs(values.releaseDate as any).format('YYYY-MM-DDTHH:mm:ss')
                    : undefined,
                rooms: [],
            };

            await movieService.updateMovie(payload);

            api.success({ message: 'Update movie successfully!', placement: 'topRight' });
            onSuccess();
            handleClose();
        } catch (error: any) {
            api.error({
                message: 'Update failure!',
                placement: 'topRight',
                description: error.response?.data?.message,
            });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Fetch movie details when open or movie.id changes ──
    useEffect(() => {
        if (!open || !movie?.id) {
            setFetchedMovie(null);
            return;
        }
        fetchMovieDetail(movie.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, movie?.id]);

    // ── Seed form when movie changes ──
    useEffect(() => {
        if (!open || !movie) return;

        form.setFieldsValue({
            title: movie.title,
            description: movie.description,
            durationMinutes: movie.durationMinutes,
            director: movie.director,
            genre: movie.genre,
            status: movie.status,
            releaseDate: movie.releaseDate ? dayjs(movie.releaseDate) : undefined,
        });

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentStatus(movie.status ?? '');
        setNewPosterUrl(null);
        setCurrentStep(0);
        setRoomSchedules(new Map());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, movie]);

    // ── Seed room schedules when details are fetched ──
    useEffect(() => {
        if (!open || !fetchedMovie) return;

        const seedMap = new Map<number, RoomScheduleDTO>();
        (fetchedMovie.rooms ?? []).forEach((r) => {
            seedMap.set(r.id, {
                id: r.id,
                name: r.name,
                days: (r.days ?? []).map((d) => ({
                    date: typeof d.date === 'string' ? d.date : dayjs(d.date as any).format('YYYY-MM-DD'),
                    startTimes: (d.startTimes ?? []).map(fmtTime),
                })),
            });
        });
        setRoomSchedules(seedMap);
    }, [open, fetchedMovie]);

    // ── Fetch available rooms on step 2 ──
    useEffect(() => {
        if (open && currentStep === 1 && availableRooms.length === 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRoomsLoading(true);
            movieService
                .getRoomsForMovie()
                .then((res: any) => setAvailableRooms(res?.data ?? res ?? []))
                .catch(() => message.error('Cannot loading rooms'))
                .finally(() => setRoomsLoading(false));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, currentStep]);

    const resetAll = () => {
        setCurrentStep(0);
        setNewPosterUrl(null);
        setMovieFields({});
        setRoomSchedules(new Map());
        setAvailableRooms([]);
        setFetchedMovie(null);
        form.resetFields();
    };

    const handleClose = () => {
        resetAll();
        onClose();
    };

    // ── Upload ──
    const handleUploadChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
        if (info.file.status === 'uploading') setImageLoading(true);
    };

    const customUpload = async (options: any) => {
        const { file, onSuccess: uploadSuccess } = options;
        try {
            setImageLoading(true);
            const tempUrl = await movieService.uploadTempFile(file as File);
            setNewPosterUrl(tempUrl);
            uploadSuccess(tempUrl);
        } catch (error: any) {
            api.error({
                message: 'Upload image failure!',
                placement: 'topRight',
                description: error.response?.data?.message,
            });
        } finally {
            setImageLoading(false);
        }
    };

    // ── Room helpers ──
    const toggleRoom = (room: RoomNameProjection, checked: boolean) => {
        const next = new Map(roomSchedules);
        if (checked) next.set(room.id, { id: room.id, name: room.name, days: [] });
        else next.delete(room.id);
        setRoomSchedules(next);
    };

    const updateRoomSchedule = (roomId: number, schedule: RoomScheduleDTO) => {
        const next = new Map(roomSchedules);
        next.set(roomId, schedule);
        setRoomSchedules(next);
    };

    const step2Valid = (): boolean => {
        if (currentStatus !== MovieStatus.SHOWING) return true;
        if (roomSchedules.size === 0) return true;
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
        setSubmitting(true);
        try {
            const posterUrl = newPosterUrl ?? currentMovie?.posterUrl;
            const payload: ComplexShowtimeRequestDTO = {
                ...(movieFields as AdminMovieDTO),
                id: currentMovie?.id,
                posterUrl: posterUrl ?? undefined,
                releaseDate: movieFields.releaseDate
                    ? dayjs(movieFields.releaseDate as any).format('YYYY-MM-DDTHH:mm:ss')
                    : undefined,
                rooms: roomSchedules.size > 0 ? Array.from(roomSchedules.values()) : [],
            };

            const res: any = await movieService.updateMovie(payload as any);
            const updated: AdminMovieDTO = res?.data ?? res;

            form.setFieldsValue({
                ...updated,
                releaseDate: updated.releaseDate ? dayjs(updated.releaseDate) : undefined,
            });
            setNewPosterUrl(null);

            api.success({ message: 'Update successfully!', placement: 'topRight' });
            onSuccess();
            setCurrentStep(0);
            if (currentMovie?.id) {
                await fetchMovieDetail(currentMovie.id);
            }
        } catch (error: any) {
            api.error({
                message: 'Update failure!',
                placement: 'topRight',
                description: error.response?.data?.message,
            });

            // If the poster was already moved server-side before the conflict
            // was thrown (e.g. showtime overlap check happens after the file
            // move), the temp file no longer exists. Re-fetch the movie so
            // posterUrl, and any other server-side state, is back in sync
            // before retrying — and clear any stale temp-upload reference.
            if (currentMovie?.id) {
                await fetchMovieDetail(currentMovie.id);
                setNewPosterUrl(null);
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ── Poster preview src ──
    const posterSrc = newPosterUrl
        ? `${baseURL}/api/v1/files/movie-temps/${newPosterUrl}`
        : currentMovie?.posterUrl
            ? `${baseURL}/api/v1/files/${currentMovie.posterUrl}`
            : undefined;
    const isLocked = currentStatus !== MovieStatus.UPCOMING;
    // ── Step 0: Movie info form ──
    const renderStep0 = () => (
        <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
                <ProFormText
                    name="title"
                    label="Movie title"
                    placeholder="Input title movie"
                    rules={[{ required: true, message: 'Title is required' }]}
                />
                <ProFormTextArea name="description" label="Description" placeholder="Description" fieldProps={{ rows: 3 }} />
                <Tooltip
                    title={
                        isLocked
                            ? 'Cannot change duration while the movie is showing.'
                            : ''
                    }
                >
                    <div>
                        <ProFormDigit
                            name="durationMinutes"
                            label="Duration (Minutes)"
                            min={1}
                            rules={[{ required: true, message: 'Duration is required!' }]}
                            fieldProps={{ disabled: isLocked, style: { width: '100%' } }}
                        />
                    </div>
                </Tooltip>
                <ProFormText name="director" label="Director" placeholder="Director name" />
            </div>
            <div style={{ flex: 1 }}>
                <ProFormSelect
                    name="genre"
                    label="Genre"
                    options={Object.values(MovieGenre).map((g) => ({ label: g, value: g }))}
                    rules={[{ required: true, message: 'Genre is required' }]}
                />
                <Tooltip
                    title={
                        isLocked
                            ? 'Cannot change release date while the movie is showing.'
                            : ''
                    }
                >
                    <div>
                        <ProFormDateTimePicker
                            name="releaseDate"
                            label="Release date"
                            fieldProps={{
                                disabled: isLocked,
                                disabledDate: (c) => c && c < dayjs().startOf('day'),
                            }}
                            rules={[{ required: true, message: 'Release date is required!' }]}
                        />
                    </div>
                </Tooltip>
                <ProFormSelect
                    name="status"
                    label="Status"
                    fieldProps={{ onChange: (v: string) => setCurrentStatus(v) }}
                    options={getAvailableStatuses((currentMovie?.status ?? 'UPCOMING') as MovieStatusType).map(
                        (status) => ({ value: status, label: status })
                    )}
                    rules={[{ required: true, message: 'Status is required!' }]}
                />

                {isLocked && (
                    <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 12 }}
                        message="Duration and release date are locked while the movie status is SHOWING."
                    />
                )}

                <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', marginBottom: 8 }}>Image poster</label>
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
                            {posterSrc ? (
                                <img
                                    src={posterSrc}
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
                    {!newPosterUrl && currentMovie?.posterUrl && (
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                            Keep current poster or change
                        </Text>
                    )}
                </div>
            </div>
        </div>
    );

    // ── Step 1: Room & showtime ──
    const renderStep1 = () => {
        const availableIds = new Set(availableRooms.map((r) => r.id));
        const seededRoomsNotInAvailable: RoomNameProjection[] = [];
        roomSchedules.forEach((sched, roomId) => {
            if (!availableIds.has(roomId)) {
                seededRoomsNotInAvailable.push({
                    id: roomId,
                    name: sched.name ?? `Room ${roomId}`,
                });
            }
        });
        const allDisplayRooms: RoomNameProjection[] = [...availableRooms, ...seededRoomsNotInAvailable];

        // Current effective release date — prefer the value being edited in
        // step 0, fall back to whatever was already fetched for this movie
        const effectiveReleaseDate = (movieFields.releaseDate ?? currentMovie?.releaseDate) as
            | string
            | undefined;

        return (
            <div>
                {currentStatus !== MovieStatus.SHOWING && (
                    <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message={`Room and showtime information is only valid when status = SHOWING. Current status: ${currentStatus}.`}
                    />
                )}

                <Text strong>Select rooms:</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0 18px' }}>
                    {roomsLoading && <Text type="secondary">Loading...</Text>}
                    {!roomsLoading && allDisplayRooms.length === 0 && (
                        <Text type="secondary">No rooms found</Text>
                    )}
                    {allDisplayRooms.map((room) => {
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

                {roomSchedules.size === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Select a room to configure the screening schedule."
                    />
                ) : (
                    Array.from(roomSchedules.entries()).map(([roomId, schedule]) => {
                        const room = allDisplayRooms.find((r) => r.id === roomId) ?? {
                            id: roomId,
                            name: schedule.name ?? `Room ${roomId}`,
                        };
                        return (
                            <RoomScheduleEditor
                                key={roomId}
                                room={room}
                                schedule={schedule}
                                onChange={(s) => updateRoomSchedule(roomId, s)}
                                onRemove={() => toggleRoom(room, false)}
                                duration={movieFields.durationMinutes ?? currentMovie?.durationMinutes ?? 0}
                                releaseDate={effectiveReleaseDate}
                                movieId={currentMovie?.id}
                            />
                        );
                    })
                )}
            </div>
        );
    };

    // ── Step 2: Summary ──
    const renderStep2 = () => {
        const totalShowtimes = Array.from(roomSchedules.values()).reduce(
            (acc, s) => acc + s.days.reduce((a, d) => a + d.startTimes.length, 0),
            0
        );
        const posterPreview = newPosterUrl
            ? `${baseURL}/api/v1/files/movie-temps/${newPosterUrl}`
            : currentMovie?.posterUrl
                ? `${baseURL}/api/v1/files/${currentMovie.posterUrl}`
                : undefined;

        return (
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                {posterPreview && (
                    <div style={{ flex: '0 0 120px' }}>
                        <img
                            src={posterPreview}
                            alt="poster"
                            style={{
                                width: 120,
                                aspectRatio: '2/3',
                                objectFit: 'cover',
                                borderRadius: 8,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            }}
                        />
                    </div>
                )}

                <div style={{ flex: 1 }}>
                    <Title level={5} style={{ marginBottom: 8 }}>
                        Movie information
                    </Title>
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Space direction="vertical" size={2}>
                            <Text>
                                🎬 <strong>{movieFields.title}</strong>
                            </Text>
                            <Text>⏱ {movieFields.durationMinutes} minutes</Text>
                            <Text>
                                🎭 {movieFields.genre} ·{' '}
                                <Tag
                                    color={
                                        movieFields.status === 'SHOWING'
                                            ? 'green'
                                            : movieFields.status === 'UPCOMING'
                                                ? 'blue'
                                                : 'red'
                                    }
                                >
                                    {movieFields.status}
                                </Tag>
                            </Text>
                            <Text>👤 Director: {movieFields.director || '-'}</Text>
                            <Text>
                                📅 Release date:{' '}
                                {movieFields.releaseDate
                                    ? dayjs(movieFields.releaseDate as any).format('DD/MM/YYYY HH:mm')
                                    : '-'}
                            </Text>
                            {hasScreenings && (
                                <Tag color="orange">
                                    The screening schedule has been released — the duration and dates remain
                                    unchanged.
                                </Tag>
                            )}
                        </Space>
                    </Card>

                    {roomSchedules.size > 0 && (
                        <>
                            <Title level={5} style={{ marginBottom: 8 }}>
                                Schedule ({totalShowtimes} screenings)
                            </Title>
                            {Array.from(roomSchedules.entries()).map(([roomId, schedule]) => {
                                const rName =
                                    availableRooms.find((r) => r.id === roomId)?.name ??
                                    schedule.name ??
                                    `Room ${roomId}`;
                                return (
                                    <Card key={roomId} size="small" title={rName} style={{ marginBottom: 8 }}>
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
                                                                {fmtTime(t)}
                                                            </Tag>
                                                        ))}
                                                    </Space>
                                                </div>
                                            ))}
                                    </Card>
                                );
                            })}
                        </>
                    )}

                    {roomSchedules.size === 0 && currentStatus === MovieStatus.SHOWING && (
                        <Alert type="info" showIcon message="No new showtimes were added in this update." />
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {contextHolder}
            <ModalForm<AdminMovieDTO>
                form={form}
                title={`Update movie${currentMovie?.title ? ` — ${currentMovie.title}` : ''}`}
                open={open}
                onOpenChange={(visible) => {
                    if (!visible) handleClose();
                }}
                modalProps={{ destroyOnClose: true, onCancel: handleClose, width: 900 }}
                submitter={false}
                onFinish={async (values) => {
                    setMovieFields({
                        ...values,
                        releaseDate: values.releaseDate as any,
                    });

                    if (values.status === MovieStatus.SHOWING) {
                        setCurrentStep(1);
                    } else {
                        await submitDirectly(values);
                    }

                    return false;
                }}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    If the film is in showing mode, then the screening schedule for the rooms can be determined.
                </Text>
                <Steps current={currentStep} size="small" items={STEPS.map((title) => ({ title }))} style={{ marginBottom: 24 }} />

                <Spin spinning={detailLoading}>
                    {currentStep === 0 && renderStep0()}
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                </Spin>

                <Divider />

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={currentStep === 0 ? handleClose : () => setCurrentStep((s) => s - 1)}>
                        {currentStep === 0 ? 'Close' : '← Back'}
                    </Button>
                    <Space>
                        {currentStep === 0 && (
                            <Button type="primary" htmlType="submit">
                                Done →
                            </Button>
                        )}
                        {currentStep === 1 && (
                            <Tooltip
                                title={
                                    !step2Valid()
                                        ? 'Each selected room must have at least 1 day and 1 hour of availability.'
                                        : ''
                                }
                            >
                                <Button type="primary" disabled={!step2Valid()} onClick={() => setCurrentStep(2)}>
                                    View summary →
                                </Button>
                            </Tooltip>
                        )}
                        {currentStep === 2 && (
                            <Button type="primary" loading={submitting} onClick={handleSubmit}>
                                Update
                            </Button>
                        )}
                    </Space>
                </div>
            </ModalForm>
        </>
    );
};

export default MovieUpdateModal;