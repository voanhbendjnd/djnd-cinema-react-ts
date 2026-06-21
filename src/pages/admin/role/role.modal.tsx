import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, notification, Spin, Checkbox, Row, Col, Card, Collapse } from 'antd';
import { roleService, type IRole, type IPermission } from '@/services/role.service';

interface RoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRole: IRole | null;
    onSuccess: () => void;
}

const RoleModalComponent: React.FC<RoleModalProps> = ({
    isOpen,
    onClose,
    currentRole,
    onSuccess,
}) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [permissions, setPermissions] = useState<IPermission[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loadingPermissions, setLoadingPermissions] = useState<boolean>(false);
    const [api, contextHolder] = notification.useNotification();

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
        const moduleName = permission.module || 'OTHER';
        if (!acc[moduleName]) {
            acc[moduleName] = [];
        }
        acc[moduleName].push(permission);
        return acc;
    }, {} as Record<string, IPermission[]>);

    useEffect(() => {
        if (isOpen) {
            // Reset form fields
            if (currentRole) {
                form.setFieldsValue({
                    name: currentRole.name,
                    description: currentRole.description,
                });
                const initialIds = (currentRole.permissions as IPermission[])?.map((p) => p.id) || [];
                setSelectedIds(initialIds);
            } else {
                form.resetFields();
                setSelectedIds([]);
            }

            // Fetch system permissions if not loaded
            const fetchAllPermissions = async () => {
                setLoadingPermissions(true);
                try {
                    const res = await roleService.getPermissions({ page: 1, size: 1000 });
                    if (res && res.data) {
                        setPermissions(res.data.result);
                    }
                } catch (error: unknown) {
                    console.error(error);
                    api.error({
                        message: 'Error Loading Permissions',
                        description: 'Cannot load system permissions list.',
                        placement: 'topRight',
                    });
                } finally {
                    setLoadingPermissions(false);
                }
            };
            fetchAllPermissions();
        }
    }, [isOpen, currentRole, form]);

    const handleCheckboxChange = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((item) => item !== id));
        }
    };

    const handleModuleCheckAll = (moduleName: string, checked: boolean) => {
        const modulePermissionIds = groupedPermissions[moduleName].map((p) => p.id);
        if (checked) {
            setSelectedIds((prev) => {
                const combined = [...prev, ...modulePermissionIds];
                return Array.from(new Set(combined));
            });
        } else {
            setSelectedIds((prev) => prev.filter((id) => !modulePermissionIds.includes(id)));
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            // Regex validation: standard format ROLE_XYZ
            const namePattern = /^ROLE_[A-Z0-9_]+$/;
            if (!namePattern.test(values.name)) {
                api.error({
                    message: 'Validation Error',
                    description: 'Role code must follow the format ROLE_XYZ (uppercase letters, numbers, and underscores).',
                    placement: 'topRight',
                });
                setSubmitting(false);
                return;
            }

            const payload: IRole = {
                id: currentRole?.id,
                name: values.name.toUpperCase(),
                description: values.description,
                permissions: selectedIds.map((id) => ({ id })),
            };

            if (currentRole && currentRole.id) {
                // Edit (PUT)
                await roleService.updateRole(payload);
                notification.success({
                    message: 'Success',
                    description: 'Role updated and permissions assigned successfully!',
                    placement: 'topRight',
                });
            } else {
                // Create (POST)
                await roleService.createRole(payload);
                notification.success({
                    message: 'Success',
                    description: 'New role created and permissions assigned successfully!',
                    placement: 'topRight',
                });
            }

            onSuccess();
            onClose();
        } catch (error: unknown) {
            console.error(error);
            const errorInfo = error as { response?: { data?: { message?: string } }; message?: string };
            const errorMsg = errorInfo.response?.data?.message || errorInfo.message || 'Operation failed!';
            api.error({
                message: 'System Error',
                description: errorMsg,
                placement: 'topRight',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={isOpen}
            title={
                <span style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', color: '#ffd700' }}>
                    {currentRole ? 'Update Role' : 'Create New Role'}
                </span>
            }
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="back" onClick={onClose} disabled={submitting}>
                    Close
                </Button>,
                <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit} disabled={loadingPermissions}>
                    Save
                </Button>,
            ]}
            destroyOnClose
            style={{ top: 40 }}
            styles={{
                content: {
                    background: '#141414',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                },
                header: {
                    background: 'transparent',
                    borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
                    paddingBottom: '10px',
                },
            }}
        >
            {contextHolder}
            <Form
                form={form}
                layout="vertical"
                style={{ marginTop: '20px' }}
                initialValues={{ name: '', description: '' }}
            >
                <Row gutter={24}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="name"
                            label={<span style={{ color: '#fff' }}>Role Code (Name)</span>}
                            rules={[
                                { required: true, message: 'Please enter the role code!' },
                                {
                                    pattern: /^ROLE_[A-Z0-9_]+$/,
                                    message: 'Expected format: ROLE_XYZ (e.g., ROLE_ADMIN)',
                                },
                            ]}
                        >
                            <Input placeholder="E.g., ROLE_ADMIN, ROLE_MANAGER" style={{ height: '40px' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="description"
                            label={<span style={{ color: '#fff' }}>Description</span>}
                            rules={[{ required: true, message: 'Please enter the role description.!' }]}
                        >
                            <Input placeholder="Enter a role description.." style={{ height: '40px' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <h4 style={{ color: '#ffd700', marginTop: '16px', marginBottom: '12px', fontSize: '15px', fontWeight: 600 }}>
            Permissions Assignment
                </h4>

                {loadingPermissions ? (
                    <div style={{ padding: '30px 0', textAlign: 'center' }}>
                        <Spin size="default" />
                        <p style={{ marginTop: '10px', color: '#ffd700', fontSize: '12px' }}>Loading permissions list...</p>
                    </div>
                ) : (
                    <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '5px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '10px', background: 'rgba(0,0,0,0.15)' }}>
                        <Collapse
                            defaultActiveKey={Object.keys(groupedPermissions).slice(0, 3)}
                            ghost
                            expandIconPosition="right"
                        >
                            {Object.entries(groupedPermissions).map(([moduleName, items]) => {
                                const allChecked = items.every((p) => selectedIds.includes(p.id));
                                const someChecked = items.some((p) => selectedIds.includes(p.id)) && !allChecked;

                                return (
                                    <Collapse.Panel
                                        key={moduleName}
                                        header={
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '92%' }}>
                                                <span style={{ fontWeight: 600, color: '#ffd700', fontSize: '13px' }}>
                                                    Module: {moduleName}
                                                </span>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={allChecked}
                                                        indeterminate={someChecked}
                                                        onChange={(e) => handleModuleCheckAll(moduleName, e.target.checked)}
                                                        style={{ color: '#fff', fontSize: '12px' }}
                                                    >
                                                        Choice All
                                                    </Checkbox>
                                                </div>
                                            </div>
                                        }
                                        style={{
                                            marginBottom: '8px',
                                            background: 'rgba(255,255,255,0.01)',
                                            border: '1px solid rgba(255,215,0,0.05)',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        <Row gutter={[12, 12]}>
                                            {items.map((permission) => (
                                                <Col xs={24} sm={12} key={permission.id}>
                                                    <Card
                                                        size="small"
                                                        style={{
                                                            background: selectedIds.includes(permission.id)
                                                                ? 'rgba(212, 175, 55, 0.05)'
                                                                : 'rgba(0,0,0,0.1)',
                                                            border: selectedIds.includes(permission.id)
                                                                ? '1px solid rgba(255, 215, 0, 0.5)'
                                                                : '1px solid rgba(255,255,255,0.03)',
                                                        }}
                                                        styles={{
                                                            body: { padding: '8px' }
                                                        }}
                                                    >
                                                        <Checkbox
                                                            checked={selectedIds.includes(permission.id)}
                                                            onChange={(e) => handleCheckboxChange(permission.id, e.target.checked)}
                                                            style={{ color: '#fff', width: '100%', fontSize: '12px' }}
                                                        >
                                                            <div style={{ marginLeft: '4px' }}>
                                                                <div style={{ fontWeight: 600, color: '#fff' }}>
                                                                    {permission.name}
                                                                </div>
                                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                                                                    <span style={{
                                                                        color: permission.method === 'GET' ? '#52c41a' :
                                                                               permission.method === 'POST' ? '#1890ff' :
                                                                               permission.method === 'PUT' ? '#faad14' : '#f5222d',
                                                                        fontWeight: 'bold',
                                                                        marginRight: '4px'
                                                                    }}>
                                                                        {permission.method}
                                                                    </span>
                                                                    {permission.apiPath}
                                                                </div>
                                                            </div>
                                                        </Checkbox>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Collapse.Panel>
                                );
                            })}
                        </Collapse>
                    </div>
                )}
            </Form>
        </Modal>
    );
};

export default RoleModalComponent;
