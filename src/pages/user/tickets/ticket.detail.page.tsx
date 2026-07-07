import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Result, Spin, Tag, notification } from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  CreditCardOutlined,
  DollarOutlined,
  HomeOutlined,
  QrcodeOutlined,
  TagOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { ticketService } from '@/services/ticket.service';
import type { CustomerTicket } from '@/types/ticket.types';
import './ticket.css';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : value;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : value;
};

const formatTimeRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) return '-';
  return `${start ?? '-'} - ${end ?? '-'}`;
};

const formatMoney = (value?: number | null) => {
  if (value == null) return '-';
  return `${value.toLocaleString('vi-VN')} VND`;
};

const getRoomLabel = (ticket: CustomerTicket) => {
  if (ticket.roomName && ticket.roomType) return `${ticket.roomName} (${ticket.roomType})`;
  if (ticket.roomName) return ticket.roomName;
  if (ticket.roomId) return `Room ${ticket.roomId}`;
  return 'N/A';
};

const DetailCell = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) => (
  <div className="ticket-detail-cell">
    <div className="ticket-field__label">
      {icon}
      {label}
    </div>
    <div className="ticket-field__value">{value}</div>
  </div>
);

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [ticket, setTicket] = useState<CustomerTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Ticket not found');
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    ticketService
      .getTicketDetail(id)
      .then(async (res) => {
        if (!mounted) return;
        const ticketWithRoom = await ticketService.resolveTicketRoom(res.data);
        if (!mounted) return;
        setTicket(ticketWithRoom);
      })
      .catch((requestError) => {
        if (!mounted) return;
        setError(requestError?.response?.data?.message ?? 'Cannot load ticket detail');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const copyTicketCode = async () => {
    if (!ticket?.ticketCode) return;
    await navigator.clipboard.writeText(ticket.ticketCode);
    api.success({ message: 'Ticket code copied', placement: 'topRight' });
  };

  if (loading) {
    return (
      <div className="ticket-page">
        <div className="ticket-shell">
          <div className="ticket-empty">
            <Spin size="large" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="ticket-page">
        <div className="ticket-shell">
          <Result
            status="error"
            title="Ticket unavailable"
            subTitle={error ?? 'Cannot load ticket detail'}
            extra={<Button onClick={() => navigate('/tickets')}>Back to Tickets</Button>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-page">
      {contextHolder}
      <div className="ticket-shell">
        <div className="ticket-heading">
          <div>
            <p className="ticket-eyebrow">TICKET DETAIL</p>
            <h1 className="ticket-title">{ticket.movieTitle}</h1>
            <p className="ticket-subtitle">
              Ticket #{ticket.id} · {formatDate(ticket.releaseDate)}
            </p>
          </div>

          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tickets')}>
            Back
          </Button>
        </div>

        <section className="ticket-detail-panel">
          <div className="ticket-detail-hero">
            <div>
              <Tag color="gold">{ticket.seatType}</Tag>
              <h2 className="ticket-card__movie" style={{ marginTop: 14 }}>
                {ticket.movieTitle}
              </h2>
              <p className="ticket-subtitle">
                {formatTimeRange(ticket.startDateTime, ticket.endDateTime)} · Seat{' '}
                {ticket.seatPosition}
              </p>
            </div>

            <div className="ticket-detail-code">
              <div className="ticket-field__label" style={{ justifyContent: 'center' }}>
                <QrcodeOutlined />
                Ticket Code
              </div>
              <div className="ticket-code-text">{ticket.ticketCode ?? '-'}</div>
              <Button
                icon={<CopyOutlined />}
                onClick={copyTicketCode}
                disabled={!ticket.ticketCode}
                style={{ marginTop: 14 }}
              >
                Copy Code
              </Button>
            </div>
          </div>

          <div className="ticket-detail-grid">
            <DetailCell
              icon={<VideoCameraOutlined />}
              label="Movie"
              value={ticket.movieTitle}
            />
            <DetailCell
              icon={<CalendarOutlined />}
              label="Show Date"
              value={formatDate(ticket.releaseDate)}
            />
            <DetailCell
              icon={<ClockCircleOutlined />}
              label="Showtime"
              value={formatTimeRange(ticket.startDateTime, ticket.endDateTime)}
            />
            <DetailCell icon={<HomeOutlined />} label="Room" value={getRoomLabel(ticket)} />
            <DetailCell icon={<TagOutlined />} label="Seat" value={ticket.seatPosition} />
            <DetailCell icon={<TagOutlined />} label="Seat Type" value={ticket.seatType} />
            <DetailCell
              icon={<CreditCardOutlined />}
              label="Payment"
              value={ticket.paymentMethod ?? '-'}
            />
            <DetailCell icon={<DollarOutlined />} label="Price" value={formatMoney(ticket.price)} />
            <DetailCell
              icon={<ClockCircleOutlined />}
              label="Booked At"
              value={formatDateTime(ticket.bookingAt)}
            />
            <DetailCell icon={<QrcodeOutlined />} label="Created By" value={ticket.createdBy ?? '-'} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default TicketDetailPage;
