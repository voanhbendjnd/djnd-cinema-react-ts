import React, {useRef} from 'react';
import {type ActionType, type ProColumns, ProTable } from '@ant-design/pro-components';
import {notification, Switch} from 'antd';
import { userService } from '@/services/user.service.ts';

const CustomerManagement: React.FC = () => {
    const actionRef = useRef<ActionType | null>(null);
    const [api, contextHolder] = notification.useNotification();
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
                <Switch
                    key="status"
                    checked={record.activated}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                    onChange={async (checked) => {
                        try {
                            await userService.toggleStatus(
                                record.id,
                                checked
                            );

                            api.success({
                                message: 'Status updated',
                                placement: 'topRight'
                            });

                            await actionRef.current?.reload();
                        } catch (error) {
                            api.error({
                                message: 'Failed to update status',
                                placement: 'topRight'
                            });
                        }
                    }}
                />
            ]
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
                            q: params.login || params.name || params.email, // Lấy tạm theo keyword map
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
                search={{
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
        </>

    );
};

export default CustomerManagement;
