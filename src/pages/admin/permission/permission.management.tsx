import React, { useMemo, useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Popconfirm, Result, Tag, Typography, notification } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PermissionFormModal from '@/pages/admin/permission/components/permission.form.modal';
import { permissionService } from '@/services/permission.service';
import {
  PERMISSION_API_PATHS,
  PERMISSION_METHODS,
  type PermissionDTO,
  type PermissionFilters,
  type PermissionMethod,
  type PermissionPageable,
} from '@/types/permission.types';
import { getApiErrorMessage, getApiErrorStatus } from '@/utils/apiError';
import { hasPermission } from '@/utils/permissionAccess';

const { Text } = Typography;
const MAX_FILTER_FETCH_SIZE = 10;

const METHOD_TAG_COLORS: Record<PermissionMethod, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'gold',
  DELETE: 'red',
  PATCH: 'purple',
  OPTIONS: 'default',
};

const DEFAULT_MODULES = ['permissions', 'users', 'roles', 'movies'];

const methodValueEnum = PERMISSION_METHODS.reduce<Record<string, { text: string }>>((acc, method) => {
  acc[method] = { text: method };
  return acc;
}, {});

const toTextFilter = (value: unknown) => {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const isPermissionMethod = (value: unknown): value is PermissionMethod => {
  return typeof value === 'string' && PERMISSION_METHODS.includes(value as PermissionMethod);
};

const normalizeModule = (module: string) => module.trim().toLowerCase();

const filterPermissions = (rows: PermissionDTO[], filters: PermissionFilters) => {
  return rows.filter((permission) => {
    const matchName =
      !filters.name || permission.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchApiPath =
      !filters.apiPath || permission.apiPath.toLowerCase().includes(filters.apiPath.toLowerCase());
    const matchMethod = !filters.method || permission.method === filters.method;
    const matchModule =
      !filters.module || normalizeModule(permission.module) === normalizeModule(filters.module);

    return matchName && matchApiPath && matchMethod && matchModule;
  });
};

const PermissionManagement: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [permissions, setPermissions] = useState<PermissionDTO[]>([]);
  const [filters, setFilters] = useState<PermissionFilters>({});
  const [pageable, setPageable] = useState<PermissionPageable>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [availableModules, setAvailableModules] = useState<string[]>(DEFAULT_MODULES);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionDTO | null>(null);

  const canRead = hasPermission(PERMISSION_API_PATHS.list, 'GET');
  const canCreate = hasPermission(PERMISSION_API_PATHS.create, 'POST');
  const canUpdate = hasPermission(PERMISSION_API_PATHS.update, 'PUT');
  const canDelete = hasPermission(PERMISSION_API_PATHS.delete, 'DELETE');

  const moduleValueEnum = useMemo(() => {
    return availableModules.reduce<Record<string, { text: string }>>((acc, module) => {
      acc[module] = { text: module.toUpperCase() };
      return acc;
    }, {});
  }, [availableModules]);

  const handleForbidden = () => {
    navigate('/403-unauthorized');
  };

  const openCreateModal = () => {
    setEditingPermission(null);
    setIsModalOpen(true);
  };

  const openUpdateModal = (permission: PermissionDTO) => {
    setEditingPermission(permission);
    setIsModalOpen(true);
  };

  const refreshTable = () => {
    setSelectedPermissions([]);
    actionRef.current?.reload();
  };

  const deletePermissions = async (ids: number[]) => {
    try {
      await Promise.all(ids.map((id) => permissionService.deletePermission(id)));
      setPermissions((currentPermissions) =>
        currentPermissions.filter((permission) => !permission.id || !ids.includes(permission.id))
      );
      setSelectedPermissions((currentSelected) => currentSelected.filter((id) => !ids.includes(id)));
      setPageable((currentPageable) => ({
        ...currentPageable,
        total: Math.max(currentPageable.total - ids.length, 0),
      }));
      api.success({
        message: ids.length > 1 ? 'Permissions deleted' : 'Permission deleted',
        placement: 'topRight',
      });
      refreshTable();
    } catch (error) {
      if (getApiErrorStatus(error) === 403) {
        handleForbidden();
        return;
      }

      api.error({
        message: 'Failed to delete permission',
        description:
          getApiErrorStatus(error) === 500
            ? 'This permission may still be assigned to one or more roles. Remove it from those roles before deleting.'
            : getApiErrorMessage(error, 'Delete request failed'),
        placement: 'topRight',
      });
    }
  };

  const columns: ProColumns<PermissionDTO>[] = [
    {
      title: 'Permission Name',
      dataIndex: 'name',
      width: 240,
      fieldProps: {
        placeholder: 'Search by permission name',
      },
      render: (_, record) => <Text strong>{record.name}</Text>,
    },
    {
      title: 'API Path',
      dataIndex: 'apiPath',
      ellipsis: true,
      fieldProps: {
        placeholder: '/api/v1/admin/permissions',
      },
      render: (_, record) => (
        <Text
          code
          copyable={{
            text: record.apiPath,
            tooltips: ['Copy API path', 'Copied'],
          }}
        >
          {record.apiPath}
        </Text>
      ),
    },
    {
      title: 'HTTP Method',
      dataIndex: 'method',
      valueType: 'select',
      valueEnum: methodValueEnum,
      width: 150,
      render: (_, record) => (
        <Tag color={METHOD_TAG_COLORS[record.method]} style={{ minWidth: 64, textAlign: 'center' }}>
          {record.method}
        </Tag>
      ),
    },
    {
      title: 'Module',
      dataIndex: 'module',
      valueType: 'select',
      valueEnum: moduleValueEnum,
      width: 180,
      fieldProps: {
        showSearch: true,
      },
      render: (_, record) => <Tag>{record.module.toUpperCase()}</Tag>,
    },
    {
      title: 'Actions',
      valueType: 'option',
      key: 'option',
      width: 180,
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          icon={<EditOutlined />}
          disabled={!canUpdate}
          onClick={() => openUpdateModal(record)}
        >
          Edit
        </Button>,
        <Popconfirm
          key="delete"
          title="Delete this permission?"
          description="Linked roles may prevent this permission from being deleted."
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          disabled={!canDelete || !record.id}
          placement="left"
          onConfirm={() => record.id && deletePermissions([record.id])}
        >
          <Button type="link" danger icon={<DeleteOutlined />} disabled={!canDelete || !record.id}>
            Delete
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  if (!canRead) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="You do not have permission to view permission management."
      />
    );
  }

  return (
    <>
      {contextHolder}
      <ProTable<PermissionDTO>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        rowKey="id"
        search={{
          layout: 'vertical',
          defaultCollapsed: false,
          labelWidth: 'auto',
        }}
        request={async (params) => {
          const nextFilters: PermissionFilters = {
            name: toTextFilter(params.name),
            apiPath: toTextFilter(params.apiPath),
            method: isPermissionMethod(params.method) ? params.method : undefined,
            module: toTextFilter(params.module),
          };
          const current = Number(params.current || 1);
          const pageSize = Number(params.pageSize || 10);

          setFilters(nextFilters);
          setPageable((currentPageable) => ({
            ...currentPageable,
            current,
            pageSize,
          }));

          try {
            const res = await permissionService.getPermissions({
              current: 1,
              pageSize: MAX_FILTER_FETCH_SIZE,
            });
            const allRows = res.data.result || [];
            const nextModules = Array.from(
              new Set([...DEFAULT_MODULES, ...allRows.map((row) => normalizeModule(row.module))])
            );
            const filteredRows = filterPermissions(allRows, nextFilters);
            const start = (current - 1) * pageSize;
            const pageRows = filteredRows.slice(start, start + pageSize);

            setAvailableModules(nextModules);
            setPermissions(filteredRows);
            setPageable({ current, pageSize, total: filteredRows.length });

            return {
              data: pageRows,
              success: true,
              total: filteredRows.length,
            };
          } catch (error) {
            if (getApiErrorStatus(error) === 403) {
              handleForbidden();
            } else {
              api.error({
                message: 'Failed to fetch permissions',
                description: getApiErrorMessage(error, 'Cannot load permissions'),
                placement: 'topRight',
              });
            }

            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        rowSelection={{
          selectedRowKeys: selectedPermissions,
          onChange: (selectedRowKeys) => {
            setSelectedPermissions(selectedRowKeys.map((key) => Number(key)));
          },
        }}
        pagination={{
          current: pageable.current,
          pageSize: pageable.pageSize,
          total: pageable.total,
          showSizeChanger: true,
        }}
        options={{
          reload: true,
          setting: {
            listsHeight: 400,
          },
        }}
        dateFormatter="string"
        headerTitle="Permission Management"
        toolBarRender={() => [
          <Button key="reload" icon={<ReloadOutlined />} onClick={refreshTable}>
            Refresh
          </Button>,
          <Popconfirm
            key="bulk-delete"
            title="Delete selected permissions?"
            description="Linked roles may prevent these permissions from being deleted."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            disabled={!selectedPermissions.length || !canDelete}
            placement="bottom"
            onConfirm={() => deletePermissions(selectedPermissions)}
          >
            <Button icon={<DeleteOutlined />} danger disabled={!selectedPermissions.length || !canDelete}>
              Delete Selected
            </Button>
          </Popconfirm>,
          <Button
            key="create"
            icon={<PlusOutlined />}
            type="primary"
            disabled={!canCreate}
            onClick={openCreateModal}
          >
            Create Permission
          </Button>,
        ]}
        tableAlertRender={() => (
          <Text>
            Selected {selectedPermissions.length} permission
            {selectedPermissions.length === 1 ? '' : 's'}
          </Text>
        )}
        tableExtraRender={() => (
          <Text type="secondary">
            Showing {permissions.length} permissions after filters
            {filters.apiPath ? `, API path contains "${filters.apiPath}"` : ''}
            {filters.method ? `, method is ${filters.method}` : ''}
            {filters.module ? `, module is ${filters.module.toUpperCase()}` : ''}
          </Text>
        )}
      />

      <PermissionFormModal
        open={isModalOpen}
        permission={editingPermission}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPermission(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingPermission(null);
          refreshTable();
        }}
        onForbidden={handleForbidden}
      />
    </>
  );
};

export default PermissionManagement;
