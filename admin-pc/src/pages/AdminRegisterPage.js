/**
 * 管理员注册页
 * 必须填写有效邀请码（由现有管理员生成，一次性使用）
 */
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { authService } from '../services/api';
import './RegisterPage.css';

function AdminRegisterPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const { confirmPassword, ...data } = values;
      const response = await authService.register({
        ...data,
        role: 'admin',
        inviteCode: data.inviteCode?.trim()
      });
      if (response.data.success) {
        message.success('注册成功！请登录');
        navigate('/login');
      } else {
        message.error(response.data.message || '注册失败');
      }
    } catch (err) {
      message.error(err.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrap">
      <Card className="register-card">
        <div className="register-header">
          <h1>管理员注册</h1>
          <p>需有效邀请码，邀请码由现有管理员在后台生成</p>
        </div>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="inviteCode"
            rules={[{ required: true, message: '请输入邀请码' }]}
          >
            <Input
              prefix={<SafetyCertificateOutlined />}
              placeholder="邀请码（必填）"
              size="large"
            />
          </Form.Item>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码至少8位' },
              { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, message: '密码须包含字母和数字' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码（至少8位，含字母和数字）" size="large" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, v) {
                  if (!v || getFieldValue('password') === v) return Promise.resolve();
                  return Promise.reject(new Error('两次密码不一致'));
                }
              })
            ]}
          >
            <Input.Password placeholder="确认密码" size="large" />
          </Form.Item>
          <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="姓名" size="large" />
          </Form.Item>
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确手机号' }
            ]}
          >
            <Input placeholder="手机号" size="large" />
          </Form.Item>
          <Form.Item name="email" rules={[{ pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' }]}>
            <Input placeholder="邮箱（可选）" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              注册管理员
            </Button>
          </Form.Item>
        </Form>
        <div className="register-footer">
          <Link to="/register">
            <ArrowLeftOutlined /> 返回选择
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default AdminRegisterPage;
