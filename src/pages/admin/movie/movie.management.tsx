import React, { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {Button, message, Tag} from 'antd';
import {EyeOutlined, PlusOutlined} from '@ant-design/icons';
import { MovieStatus } from '@/types/movie.types';
import type { AdminMovieDTO } from '@/types/movie.types';
import { movieService } from '@/services/movie.service';
// import { baseURL } from '../../../services/axiosClient';
import MovieCreateModal from './components/movie.create.modal.tsx';
import dayjs from 'dayjs';
import MovieUpdateModal from "./components/movie.update.modal.tsx";
import {Link, useNavigate} from "react-router-dom";

const MovieManagement: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const navigate = useNavigate();
  const [selectedMovie, setSelectedMovie] = useState<AdminMovieDTO | null>(null);
  const columns: ProColumns<AdminMovieDTO>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      hideInSearch: true,
      width: 80,
    },
    // {
    //   title: 'Poster',
    //   dataIndex: 'posterUrl',
    //   hideInSearch: true,
    //   render: (_, record) => (
    //     record.posterUrl ? <img src={`${baseURL}/api/v1/files/${record.posterUrl}`} alt={record.title} style={{ width: 50, height: 75, objectFit: 'cover' }} /> : 'No Image'
    //   ),
    //   width: 100,
    // },
      {
          title: 'Title',
          dataIndex: 'title',
          render: (_, record) => (
              <Link to={`/admin/movies/${record.id}`}>{record.title}</Link>
              // <a onClick={() => navigate(`/admin/movies/${record.id}`)}>{record.title}</a>
          ),
      },
    {
      title: 'Genre',
      dataIndex: 'genre',
      hideInSearch: true,
    },
    {
      title: 'Director',
      dataIndex: 'director',
      hideInSearch: true,
    },
    {
      title: 'Duration (m)',
      dataIndex: 'durationMinutes',
      hideInSearch: true,
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      hideInSearch: true,
      render: (_, record) => {
        let color = 'default';
        if (record.status === MovieStatus.SHOWING) color = 'green';
        if (record.status === MovieStatus.UPCOMING) color = 'blue';
        if (record.status === MovieStatus.ENDED) color = 'red';
        return <Tag color={color}>{record.status}</Tag>;
      },
    },
    {
      title: 'Release Date',
      dataIndex: 'releaseDate',
      valueType: 'date',
      hideInSearch: true,
      render: (_, record) => record.releaseDate ? dayjs(record.releaseDate).format('YYYY-MM-DD HH:mm') : '-',
    },
      {
          title: 'Actions',
          valueType: 'option',
          width: 160,
          render: (_, record) => [
              <Button
                  key="view"
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/admin/movies/${record.id}`)}
              >
                  View
              </Button>,
              <Button
                  key="edit"
                  type="link"
                  onClick={() => {
                      setSelectedMovie(record);
                      setIsUpdateModalOpen(true);
                  }}
              >
                  Edit
              </Button>,
              <Button key="delete" type="link" danger>
                  Delete
              </Button>,
          ],
      },
  ];

  return (
      <>
        <ProTable<AdminMovieDTO>
            columns={columns}
            actionRef={actionRef}
            cardBordered
            request={async (params) => {
              const { current, pageSize, title } = params;
              const q = title || '';
              try {
                const res = await movieService.fetchAllMovieWithPagination(q as string, (current || 1), pageSize || 10, 'lastModifiedDate,desc');
                return {
                  data: res.data.result,
                  success: true,
                  total: res.data.meta.total,
                };
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (error) {
                message.error('Failed to fetch movies');
                return {
                  data: [],
                  success: false,
                  total: 0,
                };
              }
            }}
            rowKey="id"
            search={{
              layout: 'vertical',
              defaultCollapsed: false,
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
            dateFormatter="string"
            headerTitle="Movies Management"
            toolBarRender={() => [
              <Button
                  key="button"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateModalOpen(true)}
                  type="primary"
              >
                Create movie
              </Button>,
            ]}
        />

        <MovieCreateModal
            open={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => {
              setIsCreateModalOpen(false);
              actionRef.current?.reload();
            }}
        />

        <MovieUpdateModal
            open={isUpdateModalOpen}
            movie={selectedMovie}
            onClose={() => {
              setIsUpdateModalOpen(false);
              setSelectedMovie(null);
            }}
            onSuccess={() => {
              // Reload table data but keep the modal open so the admin
              // can keep editing / verify the saved values.
              actionRef.current?.reload();
            }}
        />
      </>
  );
};

export default MovieManagement;