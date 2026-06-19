import React, {useRef, useState} from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Tag } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { RoomDTO } from '@/types/room.types';
import { ROOM_STATUS_LABELS, ROOM_TYPE_LABELS } from '@/types/room.types';
import {roomService} from "@/services/room.service.ts";
import RoomCreateForm from "@/pages/admin/room/component/room.create.form.tsx";
import RoomUpdateForm from "@/pages/admin/room/component/room.update.modal.tsx";

const statusColor: Record<string, string> = {
    ACTIVE: 'green',
    MAINTENANCE: 'orange',
    INACTIVE: 'default',
};

const RoomManagement: React.FC = () => {
    const navigate = useNavigate();
    const actionRef = useRef<ActionType>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
    const [selectedRoom, setSelectedRoom] = useState<RoomDTO | null>(null);
    const columns: ProColumns<RoomDTO>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            hideInSearch: true,
            width: 80,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            render: (_, record) => (
                <a onClick={() => navigate(`/admin/rooms/${record.id}`)}>{record.name}</a>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            hideInSearch: true,
            render: (_, record) => ROOM_TYPE_LABELS[record.type] ?? record.type,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            hideInSearch: true,
            render: (_, record) => (
                <Tag color={statusColor[record.status] ?? 'default'}>
                    {ROOM_STATUS_LABELS[record.status] ?? record.status}
                </Tag>
            ),
        },
        {
            title: 'Total seats',
            dataIndex: 'totalSeats',
            hideInSearch: true,
            width: 120,
            render: (_, record) => record.totalSeats ?? '-',
        },
        // {
        //     title: 'Row x Col',
        //     hideInSearch: true,
        //     width: 120,
        //     render: (_, record) =>
        //         record.totalRows && record.totalCols ? `${record.totalRows} x ${record.totalCols}` : '-',
        // },
        {
            title: 'Action',
            valueType: 'option',
            width: 140,
            render: (_, record) => [
                <Button
                    key="view"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/admin/rooms/${record.id}`)}
                >
                    View detail
                </Button>,
                <Button
                    key="edit"
                    type="link"
                    onClick={() => {
                        setSelectedRoom(record);
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
            <ProTable<RoomDTO>
                columns={columns}
                actionRef={actionRef}
                cardBordered
                request={async (params) => {
                    const { current, pageSize, name } = params;
                    const q = (name as string) || '';
                    try {
                        const res = await roomService.fetchAllWithPagination(q, (current || 1) - 1, pageSize || 10);
                        return {
                            data: (res as unknown as IBackendRes<IModelPaginate<RoomDTO>>).data.result,
                            success: true,
                            total:(res as unknown as IBackendRes<IModelPaginate<RoomDTO>>).data.meta.total,
                        };
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        message.error('No loading room...');
                        return { data: [], success: false, total: 0 };
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
                headerTitle="Management room"
                toolBarRender={() => [
                    <Button
                        key="create"
                        type="primary"
                        icon={<PlusOutlined />}

                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Create room
                    </Button>,
                ]}
            />
            <RoomCreateForm
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    actionRef.current?.reload();
                }}
            />
            <RoomUpdateForm
                roomId={selectedRoom?.id}
                open={isUpdateModalOpen}
                onClose={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedRoom(null);
                }}
                onSuccess={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedRoom(null);
                    actionRef.current?.reload();
                }}
            />
        </>

    );
};

export default RoomManagement;