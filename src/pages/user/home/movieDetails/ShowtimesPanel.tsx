import { Button } from "antd";
import { useState, useMemo } from "react";
import type { ShowTimeResponse, RoomType } from "@/types/movie.types.ts";
import { colors } from "@/styles/theme.ts";
import dayjs from "dayjs";

interface ShowtimesPanelProps {
    showtimes: ShowTimeResponse[];
    onSelectSeats?: (showtime: ShowTimeResponse) => void;
}


// ── Helpers ───────────────────────────────────────────────────────────────────
const ROOM_TYPE_CONFIG: Record<string, { label: string; premium: boolean }> = {
    R2D:   { label: "R2D",      premium: false },
    R3D: { label: "R3D",       premium: false },
    RIMAX:    { label: "RIMAX Experience",  premium: true  },
    R4DX: { label: "R4DX Experience", premium: true },
};

function getRoomConfig(roomType: RoomType) {
    return ROOM_TYPE_CONFIG[roomType] ?? { label: roomType, premium: false };
}

function formatTime(iso: string) {
    return dayjs(iso).format("HH:mm");
}

function formatDateLabel(iso: string) {
    return { month: dayjs(iso).format("MMM").toUpperCase(), day: dayjs(iso).date() };
}


// ── Component ─────────────────────────────────────────────────────────────────
export default function ShowtimesPanel({ showtimes, onSelectSeats }: ShowtimesPanelProps) {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Nhóm showtime theo ngày
    const groupedByDate = useMemo(() => {
        const map = new Map<string, ShowTimeResponse[]>();
        showtimes.forEach((st) => {
            const dateKey = dayjs(st.startDateTime).format("YYYY-MM-DD");
            if (!map.has(dateKey)) map.set(dateKey, []);
            map.get(dateKey)!.push(st);
        });
        return map;
    }, [showtimes]);

    const dateKeys = Array.from(groupedByDate.keys()).sort();
    const [selectedDateKey, setSelectedDateKey] = useState<string>(dateKeys[0] ?? "");

    // Nhóm showtime của ngày đang chọn theo roomType
    const groupedByRoom = useMemo(() => {
        const dayShowtimes =
            groupedByDate.get(selectedDateKey) ?? [];

        const map = new Map<string, ShowTimeResponse[]>();

        dayShowtimes.forEach((st) => {
            const roomKey = `${st.roomName} - ${st.roomType}`;

            if (!map.has(roomKey)) {
                map.set(roomKey, []);
            }

            map.get(roomKey)!.push(st);
        });

        return map;
    }, [groupedByDate, selectedDateKey]);

    const selectedShowtime = showtimes.find((s) => s.id === selectedId) ?? null;

    if (showtimes.length === 0) {
        return (
            <div
                style={{
                    backgroundColor: colors.surfaceContainerLow,
                    border: `1px solid ${colors.surfaceVariant}`,
                    borderRadius: 16, padding: 24,
                    color: colors.onSurfaceVariant, textAlign: "center",
                }}
            >
                No Showtime
            </div>
        );
    }

    return (
        <div
            style={{
                backgroundColor: colors.surfaceContainerLow,
                border: `1px solid ${colors.surfaceVariant}`,
                borderRadius: 16, padding: 24,
                display: "flex", flexDirection: "column", gap: 24,
                position: "sticky", top: 96,
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
        >
            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.onSurface }}>
                Showtimes
            </h3>

            {/* ── Date Selector ──────────────────────────────── */}
            <div style={{ display: "flex", flexWrap: "wrap" ,gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                {dateKeys.map((key) => {
                    const { month, day } = formatDateLabel(key);
                    const active = key === selectedDateKey;
                    return (
                        <button
                            key={key}
                            onClick={() => { setSelectedDateKey(key); setSelectedId(null); }}
                            style={{
                                flexShrink: 0, width: 64, height: 80, borderRadius: 12,
                                border: active ? "none" : `1px solid ${colors.outlineVariant}`,
                                backgroundColor: active ? colors.primary : "transparent",
                                color: active ? colors.onPrimary : colors.onSurface,
                                fontWeight: 700, cursor: "pointer",
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                                boxShadow: active ? `0 4px 16px ${colors.statusGoldGlow}` : "none",
                                transition: "border-color 0.2s",
                            }}
                        >
                            <span style={{ fontSize: 11, letterSpacing: "0.05em" }}>{month}</span>
                            <span style={{ fontSize: 24, lineHeight: "32px" }}>{day}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Showtimes grouped by RoomType ──────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {Array.from(groupedByRoom.entries()).map(([roomLabel, times]) => {
                    const roomCfg = getRoomConfig(roomLabel);
                    return (
                        <div key={roomLabel} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {/* Room type label */}
                            <p
                                style={{
                                    margin: 0, fontSize: 12, letterSpacing: "0.1em", fontWeight: 700,
                                    textTransform: "uppercase",
                                    color: roomCfg.premium ? colors.primary : colors.onSurfaceVariant,
                                    display: "flex", alignItems: "center", gap: 8,
                                }}
                            >
                                {roomCfg.label}
                                {roomCfg.premium && (
                                    <span
                                        style={{
                                            width: 6, height: 6, borderRadius: "50%",
                                            backgroundColor: colors.primary, display: "inline-block",
                                            animation: "pulse 2s infinite",
                                        }}
                                    />
                                )}
                            </p>

                            {/* Time buttons */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                                {times.map((st) => {
                                    const isSelected = st.id === selectedId;
                                    const isPremium = roomCfg.premium;
                                    return (

                                            <button
                                                onClick={() => setSelectedId(st.id)}
                                                style={{
                                                    padding: "8px 0", borderRadius: 8,
                                                    fontSize: 13, fontWeight: isPremium ? 700 : 500, cursor: "pointer",
                                                    transition: "background-color 0.2s, color 0.2s",
                                                    backgroundColor: isSelected
                                                        ? colors.primary
                                                        : isPremium ? "transparent" : colors.surfaceVariant,
                                                    border: isSelected
                                                        ? "none"
                                                        : isPremium ? `1px solid ${colors.primary}` : "none",
                                                    color: isSelected
                                                        ? colors.onPrimary
                                                        : isPremium ? colors.primary : colors.onSurface,
                                                }}
                                            >
                                                {formatTime(st.startDateTime)}
                                            </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── CTA ────────────────────────────────────────── */}
            <Button
                block
                onClick={() => selectedShowtime && onSelectSeats?.(selectedShowtime)}
                disabled={!selectedShowtime}
                style={{
                    backgroundColor: colors.primaryContainer,
                    borderColor: "transparent",
                    color: colors.onPrimaryContainer,
                    fontWeight: 800, height: 56, borderRadius: 12, fontSize: 14,
                    letterSpacing: "0.05em", marginTop: 4,
                    opacity: selectedShowtime ? 1 : 0.6,
                    transition: "opacity 0.2s",
                }}
            >
                BOOK NOW
            </Button>

            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
    );
}