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
    genre?: MovieGenreType;
    director?: string;
    releaseDate?: string;
    posterUrl?: string;
    status?: MovieStatusType;
}
