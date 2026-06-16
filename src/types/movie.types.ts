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
    status?: MovieStatusType | string;
}

// --- Showtime scheduling ---

export interface DayScheduleDTO {
    date: string;        // 'YYYY-MM-DD'
    startTimes: string[]; // ['HH:mm', ...]
}

export interface RoomScheduleDTO {
    id: number;          // room id
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