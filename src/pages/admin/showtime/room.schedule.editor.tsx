/**
 * RoomScheduleEditor — shared between MovieCreateModal and MovieUpdateModal.
 * Drop this file next to your modals and import from it.
 *
 * Changes vs previous version:
 *  1. `occupiedTimesMap` now stores `ShowtimeOccupied[]` per date so we can
 *     display the movie title and the blocked time range, not just "Occupied".
 *  2. `isOverlappingWithSelected` fixed: a slot is only blocked by an already-
 *     selected time when the two "films" would genuinely overlap.
 *     - Each screening occupies [start, start + duration + 15) minutes.
 *     - A candidate slot [S, S+duration+15) conflicts with a booked block
 *       [B, B+duration+15) iff S < B+duration+15 AND B < S+duration+15.
 *     - Previously the check was symmetric in the wrong way causing slots
 *       *before* an already-selected time to be flagged even though they
 *       finish before that time begins.
 *  3. Preset tags show the booked movie title in the tooltip when the slot
 *     falls inside an occupied range.
 */

import React, { useEffect, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    DatePicker,
    message,
    notification,
    Radio,
    Space,
    Tag,
    TimePicker,
    Tooltip,
    Typography,
} from 'antd';
import {
    ClockCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en';
import { showtimeService, type ShowtimeOccupied } from '@/services/showtime.service';
import type { RoomNameProjection, RoomScheduleDTO } from '@/types/movie.types';
import { HOT_TIME_SLOTS } from '@/types/movie.types';

const { Text } = Typography;

// ─── helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const fmtTime = (t: string) => t.slice(0, 5);

const timeToMinutes = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
};

const getReleaseDateOnly = (releaseDate?: string): string | null =>
    releaseDate ? dayjs(releaseDate).format('YYYY-MM-DD') : null;

const getReleaseTimeMinutes = (releaseDate?: string): number | null => {
    if (!releaseDate) return null;
    const d = dayjs(releaseDate);
    return d.hour() * 60 + d.minute();
};

/** True when a slot on the release date falls before the release time. */
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

/**
 * True when [slotStart, slotStart+duration+15) overlaps with
 * [bookedStart, bookedStart+duration+15) for ANY already-selected time.
 *
 * FIX: previously the check was checking both directions symmetrically which
 * caused slots *earlier* than a selected time to be incorrectly flagged when
 * they end before the booked block begins.
 */
const isOverlappingWithSelected = (
    slot: string,
    selectedTimes: string[],
    duration: number,
): boolean => {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + duration + 15; // exclusive end of this screening

    for (const t of selectedTimes) {
        const bookedStart = timeToMinutes(fmtTime(t));
        const bookedEnd = bookedStart + duration + 15;

        // Standard interval overlap: [slotStart, slotEnd) ∩ [bookedStart, bookedEnd) ≠ ∅
        if (slotStart < bookedEnd && bookedStart < slotEnd) {
            return true;
        }
    }
    return false;
};

/**
 * Returns the ShowtimeOccupied entry whose time range covers `slot`, or null.
 * Used to show the booked movie's title in the tooltip.
 */
const getOccupiedEntry = (
    slot: string,
    occupied: ShowtimeOccupied[],
    duration: number,
): ShowtimeOccupied | null => {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + duration + 15;

    for (const entry of occupied) {
        const bookedStart = timeToMinutes(dayjs(entry.startDateTime).format('HH:mm'));
        const bookedEnd = timeToMinutes(dayjs(entry.endDateTime).format('HH:mm'));

        if (slotStart < bookedEnd && bookedStart < slotEnd) {
            return entry;
        }
    }
    return null;
};

// ─── component ───────────────────────────────────────────────────────────────

type TimePickMode = 'manual' | 'preset';

export interface RoomScheduleEditorProps {
    room: RoomNameProjection;
    schedule: RoomScheduleDTO;
    onChange: (s: RoomScheduleDTO) => void;
    onRemove: () => void;
    duration: number;
    releaseDate?: string;
    movieId?: number;
}

const RoomScheduleEditor: React.FC<RoomScheduleEditorProps> = ({
                                                                   room,
                                                                   schedule,
                                                                   onChange,
                                                                   onRemove,
                                                                   duration,
                                                                   releaseDate,
                                                                   movieId,
                                                               }) => {
    const [mode, setMode] = useState<TimePickMode>('preset');
    // date → list of occupied showtime entries (from other movies)
    const [occupiedMap, setOccupiedMap] = useState<Record<string, ShowtimeOccupied[]>>({});
    const [api, contextHolder] = notification.useNotification();

    dayjs.locale('en');

    const releaseDateOnly = getReleaseDateOnly(releaseDate);
    const releaseTimeMinutes = getReleaseTimeMinutes(releaseDate);

    // Fetch occupied slots for every date that doesn't have data yet
    useEffect(() => {
        const fetchOccupied = async () => {
            const newMap = { ...occupiedMap };
            let updated = false;

            for (const day of schedule.days) {
                if (!newMap[day.date]) {
                    try {
                        const res = await showtimeService.getAllTimeAtDateByRoom(
                            room.id,
                            day.date,
                            movieId ?? 0,
                        );
                        newMap[day.date] = res.data ?? [];
                        updated = true;
                    } catch (err) {
                        console.error('Failed to fetch occupied times for', day.date, err);
                    }
                }
            }

            if (updated) setOccupiedMap(newMap);
        };

        if (schedule.days.length > 0) fetchOccupied();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schedule.days, room.id, movieId]);

    // ── day helpers ─────────────────────────────────────────────────────────────

    const addDay = (date: Dayjs | null) => {
        if (!date) return;
        const dateStr = date.format('YYYY-MM-DD');

        if (releaseDateOnly && dateStr < releaseDateOnly) {
            message.warning(
                `Cannot schedule before release date (${dayjs(releaseDateOnly).format('DD/MM/YYYY')})!`,
            );
            return;
        }

        if (schedule.days.find((d) => d.date === dateStr)) {
            message.warning('This date is already added!');
            return;
        }

        onChange({ ...schedule, days: [...schedule.days, { date: dateStr, startTimes: [] }] });
    };

    const removeDay = (dateStr: string) =>
        onChange({ ...schedule, days: schedule.days.filter((d) => d.date !== dateStr) });

    const updateTimes = (dateStr: string, times: string[]) =>
        onChange({
            ...schedule,
            days: schedule.days.map((d) =>
                d.date === dateStr ? { ...d, startTimes: [...times].sort() } : d,
            ),
        });

    // ── time helpers ────────────────────────────────────────────────────────────

    const handlePresetClick = async (dateStr: string, slot: string, checked: boolean) => {
        if (!checked) {
            const day = schedule.days.find((d) => d.date === dateStr)!;
            updateTimes(dateStr, day.startTimes.map(fmtTime).filter((t) => t !== slot));
            return;
        }

        if (isBeforeReleaseTime(dateStr, slot, releaseDateOnly, releaseTimeMinutes)) {
            message.warning(
                `Showtime cannot be before release time (${dayjs(releaseDate).format('HH:mm')})!`,
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
                movieId: movieId ?? 0,
            });
            const day = schedule.days.find((d) => d.date === dateStr)!;
            updateTimes(dateStr, [...day.startTimes.map(fmtTime), slot].sort());
        } catch (error: any) {
            api.error({
                message: 'Showtime conflict',
                placement: 'topRight',
                description: error.response?.data?.message || 'Time conflict detected!',
            });
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
            message.error(
                `Showtime cannot be before release time (${dayjs(releaseDate).format('HH:mm')})!`,
            );
            return;
        }

        const occupied = occupiedMap[dateStr] ?? [];
        if (getOccupiedEntry(t, occupied, duration)) {
            message.error('This time conflicts with an existing showtime in this room!');
            return;
        }

        try {
            await showtimeService.checkConflict({
                duration,
                date: dateStr,
                time: t + ':00',
                roomName: room.name,
                roomId: room.id,
                movieId: movieId ?? 0,
            });
            updateTimes(dateStr, [...day.startTimes.map(fmtTime), t].sort());
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Time conflict detected!');
        }
    };

    const removeManual = (dateStr: string, t: string) => {
        const day = schedule.days.find((d) => d.date === dateStr)!;
        updateTimes(dateStr, day.startTimes.map(fmtTime).filter((x) => x !== t));
    };

    // ── render ──────────────────────────────────────────────────────────────────

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
                {/* Mode toggle */}
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

                {/* Date picker */}
                <div style={{ marginBottom: 12 }}>
                    <DatePicker
                        size="small"
                        placeholder="Add screening date"
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
                        No dates added yet — pick a date above.
                    </Text>
                )}

                {schedule.days
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((day) => {
                        const occupied: ShowtimeOccupied[] = occupiedMap[day.date] ?? [];

                        return (
                            <div
                                key={day.date}
                                style={{
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 6,
                                    padding: '8px 10px',
                                    marginBottom: 8,
                                }}
                            >
                                {/* Day header */}
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

                                {/* Selected times */}
                                <Space wrap style={{ marginBottom: 8 }}>
                                    {day.startTimes.length === 0 && (
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            No times selected yet
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

                                {/* Occupied times from other movies */}
                                {occupied.length > 0 && (
                                    <div style={{ marginTop: 4, marginBottom: 8 }}>
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: 11, display: 'block', marginBottom: 4 }}
                                        >
                                            Booked in this room:
                                        </Text>
                                        <Space wrap>
                                            {occupied.map((entry) => {
                                                const start = dayjs(entry.startDateTime).format('HH:mm');
                                                const end = dayjs(entry.endDateTime).format('HH:mm');
                                                return (
                                                    <Tooltip
                                                        key={entry.startDateTime}
                                                        title={`${entry.title} · ${start} – ${end}`}
                                                    >
                                                        <Tag
                                                            color="error"
                                                            style={{ fontSize: 11, cursor: 'not-allowed', opacity: 0.85 }}
                                                            icon={<ClockCircleOutlined />}
                                                        >
                                                            {start} – {end} · {entry.title}
                                                        </Tag>
                                                    </Tooltip>
                                                );
                                            })}
                                        </Space>
                                    </div>
                                )}

                                {/* Preset grid */}
                                {mode === 'preset' && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {HOT_TIME_SLOTS.map((slot) => {
                                            const checked = day.startTimes.map(fmtTime).includes(slot);
                                            const occupiedEntry = getOccupiedEntry(slot, occupied, duration);
                                            const isOccupied = !!occupiedEntry;
                                            const isOverlapping = isOverlappingWithSelected(
                                                slot,
                                                day.startTimes.filter((t) => fmtTime(t) !== slot),
                                                duration,
                                            );
                                            const isBeforeRelease = isBeforeReleaseTime(
                                                day.date,
                                                slot,
                                                releaseDateOnly,
                                                releaseTimeMinutes,
                                            );
                                            const isDisabled = isOccupied || isOverlapping || isBeforeRelease;

                                            const tooltipTitle = isOccupied
                                                ? `Booked: ${occupiedEntry!.title} (${dayjs(occupiedEntry!.startDateTime).format('HH:mm')} – ${dayjs(occupiedEntry!.endDateTime).format('HH:mm')})`
                                                : isOverlapping
                                                    ? 'Overlaps with a selected showtime'
                                                    : isBeforeRelease
                                                        ? 'Before release time'
                                                        : checked
                                                            ? 'Deselect'
                                                            : 'Select';

                                            return (
                                                <Tooltip key={slot} title={tooltipTitle}>
                                                    <Tag
                                                        style={{
                                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                            userSelect: 'none',
                                                            borderStyle: checked ? 'solid' : 'dashed',
                                                            fontSize: 12,
                                                            margin: 0,
                                                            opacity: isDisabled ? 0.45 : 1,
                                                            textDecoration: isDisabled ? 'line-through' : 'none',
                                                        }}
                                                        color={
                                                            isOccupied
                                                                ? 'error'
                                                                : isOverlapping
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

                                {/* Manual input */}
                                {mode === 'manual' && (
                                    <TimePicker
                                        size="small"
                                        format="HH:mm"
                                        placeholder="Pick a time"
                                        minuteStep={5}
                                        onSelect={(t) => addManual(day.date, t)}
                                        value={null}
                                        style={{ width: 140 }}
                                    />
                                )}
                            </div>
                        );
                    })}
            </Card>
        </>
    );
};

export default RoomScheduleEditor;