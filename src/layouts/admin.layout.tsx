import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-components';
import { Dropdown } from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    VideoCameraOutlined,
    MedicineBoxOutlined, KeyOutlined, SafetyCertificateOutlined, ScanOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/auth.service';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [pathname, setPathname] = useState(location.pathname);
    const { isAuthenticated, role } = useAuthStore();
    const roleName = (isAuthenticated && role === 'ROLE_ADMIN') ? 'admin' : role === 'ROLE_MANAGER' ? 'manager' : 'customer';
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error(e);
    }
    logout();
    navigate('/login');
  };

  return (
    <div id="test-pro-layout" style={{ height: '100vh', overflow: 'auto' }}>
      <ProLayout
        title="Cinema Admin"
        logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
        layout="mix"
        splitMenus={false}
        fixSiderbar
        route={{
          path: `${roleName}`,
          routes: [
              ...(role === 'ROLE_ADMIN'
                  ? [
                      {
                          path: '/admin/employees',
                          name: 'Employee Management',
                          icon: <UserOutlined />,
                      },
                      {
                          path: '/admin/customers',
                          name: 'Customer Management',
                          icon: <UserOutlined />,
                      },
                      {
                          path: '/admin/roles',
                          name: 'Roles Management',
                          icon: <KeyOutlined />,
                      },
                      {
                          path: '/admin/permissions',
                          name: 'Permission Management',
                          icon: <SafetyCertificateOutlined />,
                      },
                  ]
                  : []),

            {
                path: `/${roleName}/movies`,
              name: 'Movies Management',
              icon: <VideoCameraOutlined />,
            },
            {
                path: `/${roleName}/rooms`,
              name: 'Rooms Management',
              icon: <MedicineBoxOutlined />,
            },

              {
                  path: `/${roleName}/ticket-lookup`,
                  name: 'Ticket Verification',
                  icon: <ScanOutlined />,
              },
          ],
        }}
        location={{
          pathname,
        }}
        menuItemRender={(item, dom) => (
          <div
            onClick={() => {
              setPathname(item.path || '/admin');
              navigate(item.path || '/admin');
            }}
          >
            {dom}
          </div>
        )}
        avatarProps={{
          src: 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
          title: user?.name || user?.login || 'Admin',
          size: 'small',
          render: (_props, dom) => {
            return (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: 'Logout',
                      onClick: handleLogout,
                    },
                  ],
                }}
              >
                {dom}
              </Dropdown>
            );
          },
        }}
      >
        <Outlet />
      </ProLayout>
    </div>
  );
};

export default AdminLayout;
