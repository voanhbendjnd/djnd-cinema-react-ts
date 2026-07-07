export type TicketSeatType = 'STANDARD' | 'VIP' | 'SWEETBOX' | string;

export interface CustomerTicket {
  id: number;
  movieTitle: string;
  bookingAt: string;
  releaseDate: string;
  seatPosition: string;
  seatType: TicketSeatType;
  startDateTime: string;
  endDateTime: string;
  paymentMethod?: string | null;
  createdBy?: string | null;
  ticketCode?: string | null;
  price?: number | null;
  roomId?: number | null;
  roomName?: string | null;
  roomType?: string | null;
}

export interface TicketListQuery {
  page?: number;
  size?: number;
  sort?: string;
}
