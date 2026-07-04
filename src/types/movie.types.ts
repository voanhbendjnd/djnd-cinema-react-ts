// ==================
export const MovieGenre = {
    ACTION: 'ACTION',
    CARTOON: 'CARTOON',
    HORROR: 'HORROR',
    FAMILY: 'FAMILY',
    TRAGEDY: 'TRAGEDY',
    HISTORICAL: 'HISTORICAL',
    DRAMA: 'DRAMA',
    COMEDY: 'COMEDY',
    MUSICAL: 'MUSICAL',
    ROMANCE: 'ROMANCE'
} as const;
export type MovieGenreType = keyof typeof MovieGenre;
export interface RoomScheduleEditorProps {
    room: RoomNameProjection;
    schedule: RoomScheduleDTO;
    onChange: (schedule: RoomScheduleDTO) => void;
    onRemove: () => void;
    duration: number;
    releaseDate?: string; // ★ ADD: ISO datetime string from step 0, e.g. "2026-07-01T19:30:00"
}
export const MovieStatus = {
    SHOWING: 'SHOWING',
    UPCOMING: 'UPCOMING',
    ENDED: 'ENDED'
} as const;
export type MovieStatusType = keyof typeof MovieStatus;

export interface AdminMovieDTO {
    id?: number;
    title: string;
    description?: string;
    durationMinutes: number;
    genre?: MovieGenreType | string;
    director?: string;
    releaseDate?: string;
    posterUrl?: string;
    status: MovieStatusType | string;
}

// --- Showtime scheduling ---

export interface DayScheduleDTO {
    date: string;        // 'YYYY-MM-DD'
    startTimes: string[]; // ['HH:mm', ...]
}

export interface RoomScheduleDTO {
    id: number;          // room id
    name?: string;
    days: DayScheduleDTO[];
}

export interface ComplexShowtimeRequestDTO extends AdminMovieDTO {
    rooms: RoomScheduleDTO[];
}

// Projection returned from GET /api/v1/admin/movies/rooms
export interface RoomNameProjection {
    id: number;
    name: string;
}

// Preset time slots for quick-pick mode
export const HOT_TIME_SLOTS: string[] = [
    '08:00', '09:00', '09:30',
    '10:00', '10:30', '11:00',
    '13:00', '13:30', '14:00',
    '15:00', '15:30', '16:00',
    '17:00', '17:30', '18:00',
    '19:00', '19:30', '20:00',
    '20:30', '21:00', '21:30',
    '22:00', '22:30',
];

// ── Enums (khớp với Java enum) ────────────────────────────────────────────────
export type MovieGenre =
    | "ACTION"
    | "COMEDY"
    | "DRAMA"
    | "HORROR"
    | "ROMANCE"
    | "FAMILY"
    | "TRAGEDY"
    | "HISTORICAL"
    | "MUSICAL"
    | "CARTOON"
    | string;

export type MovieStatus = "UPCOMING" | "SHOWING" | "ENDED" | string;

export type RoomType = "R2D" | "R3D" | "RIMAX" | "R4DX" | string;

// ── Showtime ──────────────────────────────────────────────────────────────────
export interface ShowTimeResponse {
    id: number;
    startDateTime: string;  // ISO 8601: "2025-09-14T10:30:00"
    endDateTime: string;
    roomId: number;
    roomName: string,
    roomType: RoomType;
}

// ── Movie Details ─────────────────────────────────────────────────────────────
export interface MovieDetails {
    id: number;
    title: string;
    description: string;
    durationMunutes: number; // typo từ BE — giữ nguyên để map đúng
    genre: MovieGenre;
    releaseDate: string;     // ISO 8601
    posterUrl: string;
    director: string;
    movieStatus: MovieStatus;
    showtimes: ShowTimeResponse[];
}