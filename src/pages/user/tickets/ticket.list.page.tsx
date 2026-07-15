'use client';

import { useEffect, useState } from 'react';
import { Button, Empty, Pagination, Select, Spin, Tag, Typography, notification } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FieldTimeOutlined,
  TagOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ticketService } from '@/services/ticket.service';
import { useExchangePoints } from '@/hooks/use-exchange-points';
import type { CustomerTicket } from '@/types/ticket.types';
import './ticket.css';
import {ExchangePointsModal} from "@/pages/user/tickets/exchange.points.modal.tsx";

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

  // ✅ Exchange modal state
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<CustomerTicket | null>(null);

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

  // ✅ Handle exchange modal
  const handleOpenExchangeModal = (ticket: CustomerTicket) => {
    setSelectedTicket(ticket);
    setExchangeModalVisible(true);
  };

  const handleExchangeSuccess = () => {
    api.success({
      message: 'Ticket Exchanged',
      description: 'Your ticket has been exchanged for loyalty points!',
      placement: 'topRight',
    });
    // Refresh tickets
    ticketService
        .getTickets({ page: page - 1, size: pageSize, sort })
        .then((res) => {
          setTickets(res.data?.result ?? []);
          setTotal(res.data?.meta?.total ?? 0);
        });
  };

  return (
      <div className="ticket-page">
        {contextHolder}
        <ExchangePointsModal
            visible={exchangeModalVisible}
            ticket={selectedTicket}
            onClose={() => setExchangeModalVisible(false)}
            onSuccess={handleExchangeSuccess}
        />

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
                    description={
                      <Text style={{ color: 'rgba(240,236,227,0.58)' }}>
                        No tickets found
                      </Text>
                    }
                />
              </div>
          ) : (
              <>
                <div className="ticket-grid">
                  {tickets.map((ticket) => {
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    const exchange = useExchangePoints(
                        ticket.releaseDate,
                        ticket.price
                    );

                    return (
                        <article className="ticket-card" key={ticket.id}>
                          <div className="ticket-card__content">
                            <div className="ticket-card__top">
                              <div>
                                <h2 className="ticket-card__movie">
                                  {ticket.movieTitle}
                                </h2>
                                <div className="ticket-card__code">
                                  #{ticket.id}
                                </div>
                              </div>
                              <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                    alignItems: 'flex-end',
                                  }}
                              >
                                <Tag color="gold">{ticket.seatType}</Tag>
                                {exchange.canExchange && (
                                    <Tag
                                        color="green"
                                        icon={<GiftOutlined />}
                                    >
                                      Exchangeable
                                    </Tag>
                                )}
                              </div>
                            </div>

                            <div className="ticket-card__meta">
                              <div className="ticket-field">
                                <div className="ticket-field__label">
                                  <CalendarOutlined /> Date
                                </div>
                                <div className="ticket-field__value">
                                  {formatDate(ticket.releaseDate)}
                                </div>
                              </div>

                              <div className="ticket-field">
                                <div className="ticket-field__label">
                                  <ClockCircleOutlined /> Showtime
                                </div>
                                <div className="ticket-field__value">
                                  {formatTimeRange(
                                      ticket.startDateTime,
                                      ticket.endDateTime
                                  )}
                                </div>
                              </div>

                              <div className="ticket-field">
                                <div className="ticket-field__label">
                                  <TagOutlined /> Seat
                                </div>
                                <div className="ticket-field__value">
                                  {ticket.seatPosition}
                                </div>
                              </div>

                              <div className="ticket-field">
                                <div className="ticket-field__label">
                                  <FieldTimeOutlined /> Booked
                                </div>
                                <div className="ticket-field__value">
                                  {formatDateTime(ticket.bookingAt)}
                                </div>
                              </div>
                            </div>

                            <div className="ticket-card__actions">
                                                <span className="ticket-price">
                                                    {formatMoney(ticket.price)}
                                                </span>
                              <Button
                                  type="primary"
                                  icon={<EyeOutlined />}
                                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                                  style={{
                                    background: '#3b82f6',
                                    border: 'none',
                                  }}
                              >
                                View Detail
                              </Button>
                              {/* ✅ Exchange button */}
                              <Button
                                  icon={<GiftOutlined />}
                                  disabled={!exchange.canExchange}
                                  onClick={() => handleOpenExchangeModal(ticket)}
                                  title={
                                    exchange.canExchange
                                        ? `Exchange for ${exchange.points} points`
                                        : exchange.reason
                                  }
                                  style={{
                                    background: exchange.canExchange
                                        ? '#10b981'
                                        : 'rgba(255,255,255,0.06)',
                                    border: 'none',
                                    color: exchange.canExchange
                                        ? '#fff'
                                        : 'rgba(255,255,255,0.4)',
                                    cursor: exchange.canExchange
                                        ? 'pointer'
                                        : 'not-allowed',
                                  }}
                              >
                                Exchange
                              </Button>
                            </div>
                          </div>
                        </article>
                    );
                  })}
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