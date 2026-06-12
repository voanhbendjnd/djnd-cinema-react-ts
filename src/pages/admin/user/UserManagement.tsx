import React, {useRef, useState} from 'react';
import {type ActionType, type ProColumns, ProTable } from '@ant-design/pro-components';
import {Button, message, Modal, Popconfirm} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { userService } from '../../../services/user.service.ts';
import AdminCreateUser from "./admin.create.user.tsx";

const UserManagement: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [isOpenCreateUserAdmin, setOpenCreateUserAdmin] = useState<boolean>(false);
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
      title: 'Action',
      valueType: 'option',
      key: 'option',
      render: (_text, record, _, action) => [
        <a
          key="editable"
          onClick={() => {
            action?.startEditable?.(record.id);
          }}
        >
          Edit
        </a>,
        <Popconfirm
          key="delete"
          title="Are you sure to delete this user?"
          onConfirm={async () => {
            try {
              await userService.deleteUser(record.login);
              message.success('Deleted successfully');
              await actionRef.current?.reload();
            } catch (error: unknown) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              //@ts-expect-error
              message.error(error.response?.data?.detail || 'Failed to delete');
            }
          }}
        >
          <a style={{ color: 'red' }}>Delete</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
      <>
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
                const res = await userService.getUsers({
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
                  message.success('Updated successfully');
                } catch (error: unknown) {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  //@ts-expect-error
                  message.error(error.response?.data?.detail || 'Failed to update');
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
              <Button key="button" icon={<PlusOutlined />} type="primary"
                      onClick={()=> {
                        setOpenCreateUserAdmin(true)
                      }}
              >
                New Employee
              </Button>,
            ]

            }


        />
        <Modal
            open={isOpenCreateUserAdmin}
            footer={null}
            onCancel={() => setOpenCreateUserAdmin(false)}
            width={900}
            destroyOnClose
        >
          <AdminCreateUser
              onClose={() => {
                setOpenCreateUserAdmin(false);
                actionRef.current?.reload();
              }}
          />
        </Modal>
      </>

  );
};

export default UserManagement;
