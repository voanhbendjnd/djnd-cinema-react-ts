// ====== Enums - MUST match backend enum values exactly ======
// Adjust these if your backend RoomStatus / RoomType / SeatType / SeatStatus enums differ
export const RoomStatus = {
    ACTIVE: 'ACTIVE',
    MAINTENANCE: 'MAINTENANCE',
    INACTIVE: 'INACTIVE',
} as const;
export type RoomStatusType = keyof typeof RoomStatus;

export const RoomType = {
    R2D:'R2D',
    R3D:'R3D',
    RIMAX: 'RIMAX',
    R4DX: 'R4DX',
} as const;
export type RoomTypeType = keyof typeof RoomType;

export const SeatType = {
    STANDARD: 'STANDARD',
    VIP: 'VIP',
    SWEETBOX: 'SWEETBOX',
} as const;
export type SeatTypeType = keyof typeof SeatType;

// NEW: per-seat status (matches backend `SeatStatus { ACTIVE, MAINTENANCE }`)
export const SeatStatus = {
    ACTIVE: 'ACTIVE',
    MAINTENANCE: 'MAINTENANCE',
} as const;
export type SeatStatusType = keyof typeof SeatStatus;

export const ROOM_STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Active',
    MAINTENANCE: 'Maintenance',
    INACTIVE: 'Inactive',
};

export const ROOM_TYPE_LABELS: Record<string, string> = {
    R2D:'R2D',
    R3D:'R3D',
    RIMAX: 'RIMAX',
    R4DX: 'R4DX',
};

export const SEAT_TYPE_LABELS: Record<string, string> = {
    STANDARD: 'Standard',
    VIP: 'VIP',
    SWEETBOX: 'Sweetbox (Couple)',
};

// NEW: labels for seat status
export const SEAT_STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Active',
    MAINTENANCE: 'Maintenance',
};

// ====== DTOs ======

export interface RoomDTO {
    id?: number;
    name: string;
    status: RoomStatusType | string;
    type: RoomTypeType | string;
    totalRows?: number;
    totalCols?: number;
    totalSeats?: number;
}

export interface SeatDTO {
    id?: number;
    seatRow: string;
    seatNo: number;
    type: SeatTypeType | string;
    // NEW: seat status, sent to server on update. Defaults to ACTIVE when omitted.
    status?: SeatStatusType | string;
}

export interface RoomDetailDTO extends RoomDTO {
    seats: SeatDTO[];
}