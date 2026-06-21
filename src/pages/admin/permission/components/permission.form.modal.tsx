import React, { useEffect, useState } from 'react';
import { Form, Input, Modal, Select, notification } from 'antd';
import { permissionService } from '@/services/permission.service';
import { PERMISSION_METHODS, type PermissionDTO } from '@/types/permission.types';
import { getApiErrorMessage, getApiErrorStatus } from '@/utils/apiError';

interface PermissionFormModalProps {
  open: boolean;
  permission?: PermissionDTO | null;
  onClose: () => void;
  onSuccess: () => void;
  onForbidden: () => void;
}

const PermissionFormModal: React.FC<PermissionFormModalProps> = ({
  open,
  permission,
  onClose,
  onSuccess,
  onForbidden,
}) => {
  const [form] = Form.useForm<PermissionDTO>();
  const [submitting, setSubmitting] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const isEditing = Boolean(permission?.id);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (permission) {
      form.setFieldsValue(permission);
      return;
    }

    form.resetFields();
  }, [form, open, permission]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload: PermissionDTO = {
      ...values,
      id: permission?.id,
      name: values.name.trim(),
      apiPath: values.apiPath.trim(),
      method: values.method,
      module: values.module.trim(),
    };

    setSubmitting(true);
    try {
      if (isEditing) {
        await permissionService.updatePermission(payload);
      } else {
        await permissionService.createPermission(payload);
      }

      api.success({
        message: isEditing ? 'Permission updated' : 'Permission created',
        placement: 'topRight',
      });
      onSuccess();
    } catch (error) {
      if (getApiErrorStatus(error) === 403) {
        onForbidden();
        return;
      }

      const errorMessage = getApiErrorMessage(error, 'Failed to save permission');
      const normalizedMessage = errorMessage.toLowerCase();

      if (normalizedMessage.includes('api path with method')) {
        form.setFields([
          { name: 'apiPath', errors: ['This API path and method already exist.'] },
          { name: 'method', errors: ['This API path and method already exist.'] },
        ]);
        return;
      }

      if (normalizedMessage.includes('name already')) {
        form.setFields([{ name: 'name', errors: ['Permission name already exists.'] }]);
        return;
      }

      api.error({
        message: 'Failed to save permission',
        description: errorMessage,
        placement: 'topRight',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={isEditing ? 'Update Permission' : 'Create Permission'}
        open={open}
        onCancel={onClose}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnClose
        width={720}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Permission Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter permission name.' },
              { max: 120, message: 'Permission name must be at most 120 characters.' },
            ]}
          >
            <Input placeholder="CREATE_PERMISSION" />
          </Form.Item>

          <Form.Item
            label="API Path"
            name="apiPath"
            rules={[
              { required: true, message: 'Please enter API path.' },
              {
                validator: (_, value: string | undefined) => {
                  if (!value || value.trim().startsWith('/')) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('API path must start with /.'));
                },
              },
            ]}
          >
            <Input placeholder="/api/v1/admin/permissions" />
          </Form.Item>

          <Form.Item
            label="HTTP Method"
            name="method"
            rules={[{ required: true, message: 'Please choose HTTP method.' }]}
          >
            <Select
              placeholder="Select method"
              options={PERMISSION_METHODS.map((method) => ({ label: method, value: method }))}
            />
          </Form.Item>

          <Form.Item
            label="Module"
            name="module"
            rules={[
              { required: true, message: 'Please enter module.' },
              { max: 80, message: 'Module must be at most 80 characters.' },
            ]}
          >
            <Input placeholder="PERMISSIONS" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default PermissionFormModal;
