import React, {useRef, useState} from 'react';
import {type ActionType, type ProColumns, ProTable } from '@ant-design/pro-components';
import {Button, Modal, notification, Popconfirm} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { userService } from '@/services/user.service.ts';
import AdminCreateUser from "./admin.create.user.tsx";
import UserDetailModal from "@/pages/admin/user/component/user.detail.modal.tsx";

const EmployeeManagement: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [isOpenCreateUserAdmin, setOpenCreateUserAdmin] = useState<boolean>(false);
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
      render: (_text, record, _, action) => [
        <a
            style={{color:'blueviolet', fontSize:'medium', fontWeight:'bold'}}
            key="viewtable"
            onClick={() => handleViewDetail(record.id)}

        >
          View
        </a>,
        <a
            style={{color:'yellow', fontSize:'medium', fontWeight:'bold'}}
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
              api.success({
                message:'Delete successfully',
                placement: 'topRight'
              })
              await actionRef.current?.reload();
            } catch (error: unknown) {
              api.error({
                message: 'Failed to update',
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-expect-error
                description: error.response?.data?.message || 'Failed to delete',
                placement: 'topRight'
              });
            }
          }}
        >
          <a style={{ color: 'red',fontSize:'medium', fontWeight:'bold' }}>Delete</a>
        </Popconfirm>,
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
                const res = await userService.getEmployees({
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
            search={{ searchText: 'Search', resetText: 'Reset', submitText: 'Submit',
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

export default EmployeeManagement;

