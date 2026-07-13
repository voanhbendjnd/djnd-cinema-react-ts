import axiosClient from '@/services/axiosClient';
import type { CustomerTicket, TicketListQuery } from '@/types/ticket.types';

interface PublishedMovie {
  id: number;
  title: string;
}

interface MovieShowtime {
  startDateTime: string;
  endDateTime: string;
  roomId: number;
  roomName: string;
  roomType: string;
}

interface MovieDetailForTicket {
  showtimes?: MovieShowtime[];
}

const unwrapData = <T>(response: unknown): T => {
  const payload = (response as { data?: unknown } | undefined)?.data ?? response;
  return ((payload as { data?: unknown } | undefined)?.data ?? payload) as T;
};

const normalizeTime = (value?: string | null) => {
  if (!value) return '';
  const time = value.includes('T') ? value.split('T')[1] : value;
  return time.length === 5 ? `${time}:00` : time;
};

const isSameTicketShowtime = (ticket: CustomerTicket, showtime: MovieShowtime) => {
  const showDate = showtime.startDateTime.split('T')[0];
  return (
    showDate === ticket.releaseDate &&
    normalizeTime(showtime.startDateTime) === normalizeTime(ticket.startDateTime) &&
    normalizeTime(showtime.endDateTime) === normalizeTime(ticket.endDateTime)
  );
};

export const ticketService = {
  getTickets: async ({
    page = 0,
    size = 10,
    sort = 'createdDate,desc',
  }: TicketListQuery = {}) => {
    const response = await axiosClient.get('/api/v1/tickets', {
      params: { page, size, sort },
    });

    return response as unknown as IBackendRes<IModelPaginate<CustomerTicket>>;
  },
  exchangeTicketToPoints: (ticketId: number) =>
      axiosClient.post(`/api/v1/ticket/${ticketId}/exchange-to-points`),

  getTicketDetail: async (ticketId: number | string) => {
    const response = await axiosClient.get(`/api/v1/tickets/${ticketId}`);

    return response as unknown as IBackendRes<CustomerTicket>;
  },

  resolveTicketRoom: async (ticket: CustomerTicket) => {
    if (ticket.roomId || ticket.roomName || ticket.roomType) {
      return ticket;
    }

    const movieListResponse = await axiosClient.get('/api/v1/home/movies');
    const movies = unwrapData<PublishedMovie[]>(movieListResponse);
    const movie = movies.find(
      (item) => item.title.trim().toLowerCase() === ticket.movieTitle.trim().toLowerCase()
    );

    if (!movie) {
      return ticket;
    }

    const movieDetailResponse = await axiosClient.get(`/api/v1/movies/${movie.id}`);
    const movieDetail = unwrapData<MovieDetailForTicket>(movieDetailResponse);
    const matchedShowtime = movieDetail.showtimes?.find((showtime) =>
      isSameTicketShowtime(ticket, showtime)
    );

    if (!matchedShowtime) {
      return ticket;
    }

    return {
      ...ticket,
      roomId: matchedShowtime.roomId,
      roomName: matchedShowtime.roomName,
      roomType: matchedShowtime.roomType,
    };
  },
};
