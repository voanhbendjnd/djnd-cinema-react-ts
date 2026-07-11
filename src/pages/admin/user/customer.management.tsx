import React, {useRef, useState} from 'react';
import {type ActionType, type ProColumns, ProTable } from '@ant-design/pro-components';
import {notification, Popconfirm, Space} from 'antd';
import { userService } from '@/services/user.service.ts';
import UserDetailModal from "@/pages/admin/user/component/user.detail.modal.tsx";
// import {EyeOutlined} from "@ant-design/icons";

const CustomerManagement: React.FC = () => {
    const actionRef = useRef<ActionType | null>(null);
    const [api, contextHolder] = notification.useNotification();
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    const handleViewDetail = (id: number) => {
        setSelectedUserId(id);
        setDetailOpen(true);
    };
    const columns: ProColumns<IUser>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            search: false,
        },
        {
            title: 'Login',
            dataIndex: 'login',
        },
        {
            title: 'Name',
            dataIndex: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            search: false,
        },
        {
            title: 'Gender',
            dataIndex: 'gender',
            valueType: 'select',
            valueEnum: {
                MALE: { text: 'Male' },
                FEMALE: { text: 'Female' },
                OTHER: { text: 'Other' },
            },
            search: false,
        },
        {
            title:"Status",
            dataIndex: 'activated',
            valueEnum:{
                true:{text:'Activated'},
                false:{text:'Deactivated'},
            }
        },
        {
            title: 'Action',
            valueType: 'option',
            key: 'option',
            render: (_, record) => [
                <Space key="actions">
                    {/*<Button*/}
                    {/*    size="small"*/}
                    {/*    icon={<EyeOutlined />}*/}
                    {/*    onClick={() => handleViewDetail(record.id)}*/}
                    {/*>*/}
                    {/*    View*/}
                    {/*</Button>*/}
                    <a
                        style={{color:'blueviolet', fontSize:'medium', fontWeight:'bold'}}
                        key="viewtable"
                        onClick={() => handleViewDetail(record.id)}

                    >
                        View
                    </a>
                    {/*{*/}
                    {/*    record.activated ? (*/}
                    {/*        <Tag color="success">Active</Tag>*/}
                    {/*    ) : (*/}
                    {/*        <Tag color="error">Inactive</Tag>*/}
                    {/*    )*/}
                    {/*}*/}

                    <Popconfirm
                        title={`${
                            record.activated ? 'Deactivate' : 'Activate'
                        } this user?`}
                        onConfirm={async () => {
                            try {
                                await userService.toggleStatus(
                                    record.id,
                                    !record.activated
                                );

                                api.success({
                                    message: 'Status updated',
                                    placement: 'topRight',
                                });

                                actionRef.current?.reload();
                            } catch {
                                api.error({
                                    message: 'Failed to update status',
                                    placement: 'topRight',
                                });
                            }
                        }}
                    >
                        <a
                          style={record.activated ? {color: 'yellow'} : {color:'green'}}
                            // size="small"
                            // danger={record.activated}
                            type={record.activated ? 'default' : 'primary'}
                        >
                            {record.activated ? 'Deactivate' : 'Activate'}
                        </a>
                    </Popconfirm>
                </Space>,
            ],
        },
    ];

    return (
        <>
            {contextHolder}
            <ProTable<IUser>
                columns={columns}
                actionRef={actionRef}
                cardBordered
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-expect-error
                request={async (
                    params
                ) => {
                    try {
                        const res = await userService.getCustomers({
                            current: params.current,
                            pageSize: params.pageSize,
                            q: params.login || params.name || params.email, // Láº¥y táº¡m theo keyword map
                        }) as unknown as IBackendRes<IModelPaginate<IAccount>>;
                        return {
                            data: res.data.result ,
                            success: true,
                            total: res.data.meta.total,
                        };

                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (unknown) {
                        return {
                            data: [],
                            success: false,
                            total: 0,
                        };
                    }
                }}
                editable={{
                    type: 'multiple',
                    onSave: async (_rowKey, data) => {
                        try {
                            await userService.updateUser(data);
                            api.success({
                                message:'Update successfully',
                                placement: 'topRight'
                            })
                        } catch (error: unknown) {
                            api.error({
                                message: 'Failed to update',
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                //@ts-expect-error
                                description: error.response?.data?.message || 'Failed to update',
                                placement: 'topRight'
                            });
                            throw error;
                        }
                    },
                }}
                rowKey="id"
                search={{ searchText: 'Search', resetText: 'Reset',
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-expect-error
                    submitText: 'Submit',
                    labelWidth: 'auto',
                }}
                options={{
                    setting: {
                        listsHeight: 400,
                    },
                }}
                pagination={{
                    pageSize: 10,
                    onChange: (page) => console.log(page),
                }}
                dateFormatter="string"
                headerTitle="User Management"
                toolBarRender={() => [

                ]

                }


            />
            <UserDetailModal
                open={detailOpen}
                userId={selectedUserId}
                onClose={() => {
                    setDetailOpen(false);
                    setSelectedUserId(null);
                }}
            />
        </>

    );
};

export default CustomerManagement;

