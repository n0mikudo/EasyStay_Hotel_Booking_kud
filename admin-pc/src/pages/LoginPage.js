/**
 * 登录页面组件
 *
 * 功能：
 * 1. 用户登录表单
 * 2. 自动识别用户角色（商户/管理员）
 * 3. 登录成功后跳转到对应角色首页
 * 4. 注册入口跳转到 /register 选择页
 *
 * @component
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../services/api';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      const response = await authService.login(values);

      if (response.data.success) {
        const user = response.data.data;
        localStorage.setItem('user', JSON.stringify(user));
        message.success('登录成功！');

        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user.role === 'merchant') {
          navigate('/merchant/dashboard');
        }
      } else {
        message.error(response.data.message || '登录失败');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Card className="login-card">
          <div className="login-header">
            <h1>易宿酒店预订平台</h1>
            <p>管理系统</p>
          </div>

          <Form
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                登录
              </Button>
            </Form.Item>

            <div className="login-tips">
              <p>还没有账号？<Link to="/register">去注册</Link></p>
              <p>测试账号：admin / admin123（管理员）</p>
              <p>测试账号：merchant / merchant123（商户）</p>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
