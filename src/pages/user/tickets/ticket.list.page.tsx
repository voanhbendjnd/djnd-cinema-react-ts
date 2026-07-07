import { useEffect, useState } from 'react';
import { Button, Empty, Pagination, Select, Spin, Tag, Typography, notification } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FieldTimeOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ticketService } from '@/services/ticket.service';
import type { CustomerTicket } from '@/types/ticket.types';
import './ticket.css';

const { Text } = Typography;

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

const TicketListPage = () => {
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('createdDate,desc');

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    ticketService
      .getTickets({ page: page - 1, size: pageSize, sort })
      .then((res) => {
        if (!mounted) return;
        setTickets(res.data?.result ?? []);
        setTotal(res.data?.meta?.total ?? 0);
      })
      .catch((error) => {
        if (!mounted) return;
        api.error({
          message: 'Cannot load tickets',
          description: error?.response?.data?.message ?? 'Please try again later.',
          placement: 'topRight',
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [api, page, pageSize, sort]);

  return (
    <div className="ticket-page">
      {contextHolder}
      <div className="ticket-shell">
        <div className="ticket-heading">
          <div>
            <p className="ticket-eyebrow">CUSTOMER TICKETS</p>
            <h1 className="ticket-title">My Tickets</h1>
            <p className="ticket-subtitle">
              Confirmed tickets appear here after payment succeeds.
            </p>
          </div>

          <div className="ticket-controls">
            <Select
              value={sort}
              onChange={(value) => {
                setSort(value);
                setPage(1);
              }}
              options={[
                { value: 'createdDate,desc', label: 'Newest first' },
                { value: 'createdDate,asc', label: 'Oldest first' },
              ]}
              style={{ width: 150 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="ticket-empty">
            <Spin size="large" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="ticket-empty">
            <Empty
              description={<Text style={{ color: 'rgba(240,236,227,0.58)' }}>No tickets found</Text>}
            />
          </div>
        ) : (
          <>
            <div className="ticket-grid">
              {tickets.map((ticket) => (
                <article className="ticket-card" key={ticket.id}>
                  <div className="ticket-card__content">
                    <div className="ticket-card__top">
                      <div>
                        <h2 className="ticket-card__movie">{ticket.movieTitle}</h2>
                        <div className="ticket-card__code">#{ticket.id}</div>
                      </div>
                      <Tag color="gold">{ticket.seatType}</Tag>
                    </div>

                    <div className="ticket-card__meta">
                      <div className="ticket-field">
                        <div className="ticket-field__label">
                          <CalendarOutlined /> Date
                        </div>
                        <div className="ticket-field__value">{formatDate(ticket.releaseDate)}</div>
                      </div>

                      <div className="ticket-field">
                        <div className="ticket-field__label">
                          <ClockCircleOutlined /> Showtime
                        </div>
                        <div className="ticket-field__value">
                          {formatTimeRange(ticket.startDateTime, ticket.endDateTime)}
                        </div>
                      </div>

                      <div className="ticket-field">
                        <div className="ticket-field__label">
                          <TagOutlined /> Seat
                        </div>
                        <div className="ticket-field__value">{ticket.seatPosition}</div>
                      </div>

                      <div className="ticket-field">
                        <div className="ticket-field__label">
                          <FieldTimeOutlined /> Booked
                        </div>
                        <div className="ticket-field__value">{formatDateTime(ticket.bookingAt)}</div>
                      </div>
                    </div>

                    <div className="ticket-card__actions">
                      <span className="ticket-price">{formatMoney(ticket.price)}</span>
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        View Detail
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="ticket-pagination">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                onChange={(nextPage, nextSize) => {
                  setPage(nextPage);
                  setPageSize(nextSize);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketListPage;
