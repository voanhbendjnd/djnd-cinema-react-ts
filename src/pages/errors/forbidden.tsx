import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="403"
      subTitle="You do not have permission to perform this action."
      extra={
        <Button type="primary" onClick={() => navigate('/admin/users')}>
          Back to Admin
        </Button>
      }
    />
  );
};

export default ForbiddenPage;
