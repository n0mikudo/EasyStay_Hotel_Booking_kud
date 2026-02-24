/**
 * PC管理端应用主组件
 *
 * 功能：
 * 1. 整体布局管理（侧边栏 + 内容区）
 * 2. 路由配置（支持角色分离）
 * 3. 页面导航
 * 4. 登录状态管理
 *
 * @component
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, message } from 'antd';
import LoginPage from './pages/LoginPage';
import RegisterChoicePage from './pages/RegisterChoicePage';
import MerchantRegisterPage from './pages/MerchantRegisterPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantHotelEntry from './pages/MerchantHotelEntry';
import MerchantHotelList from './pages/MerchantHotelList';
import AdminAuditList from './pages/AdminAuditList';
import AdminHotelManagement from './pages/AdminHotelManagement';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminMessageCenter from './pages/AdminMessageCenter';
import BookingManagement from './pages/BookingManagement';
import MerchantMessageCenter from './pages/MerchantMessageCenter';
import Sidebar from './components/Sidebar';
import NotificationDropdown from './components/NotificationDropdown';
import { getStoredUser } from './utils/userIdentity';
import './App.css';

const { Content } = Layout;

/**
 * 获取当前登录用户
 * @returns {Object|null} 用户信息
 */
const getCurrentUser = () => {
  return getStoredUser();
};

/**
 * 私有路由组件
 * 检查用户是否登录，未登录则重定向到登录页
 */
const PrivateRoute = ({ children, allowedRoles }) => {
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    message.error('您没有权限访问此页面');
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * 应用主组件
 * 定义整体布局和路由配置
 */
function App() {
  const [user, setUser] = useState(getCurrentUser());
  const navigate = useNavigate();

  // 监听localStorage变化
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getCurrentUser());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * 处理登出
   */
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    message.success('已退出登录');
  };

  return (
    <Routes>
      {/* 登录与注册 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterChoicePage />} />
      <Route path="/register/merchant" element={<MerchantRegisterPage />} />
      <Route path="/register/admin" element={<AdminRegisterPage />} />

      {/* 管理员路由 */}
      <Route
        path="/admin/*"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminLayout onLogout={handleLogout} user={user} />
          </PrivateRoute>
        }
      />

      {/* 商户路由 */}
      <Route
        path="/merchant/*"
        element={
          <PrivateRoute allowedRoles={['merchant']}>
            <MerchantLayout onLogout={handleLogout} user={user} />
          </PrivateRoute>
        }
      />

      {/* 默认重定向 */}
      <Route
        path="/"
        element={
          user ? (
            user.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/merchant/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404页面 */}
      <Route path="*" element={<div className="not-found"><h1>404</h1><p>页面不存在</p></div>} />
    </Routes>
  );
}

/**
 * 管理员布局
 */
function AdminLayout({ onLogout, user }) {
  const effectiveUser = user || getStoredUser() || {};
  return (
    <Layout className="app-layout">
      <Sidebar />
      <Layout className="main-layout">
        <div className="layout-header-bar">
          <NotificationDropdown user={effectiveUser} />
        </div>
        <Content className="main-content">
          <Routes>
            <Route path="/dashboard" element={<AdminDashboard user={user} />} />
            <Route path="/audit" element={<AdminAuditList user={user} />} />
            <Route path="/messages" element={<AdminMessageCenter user={user} />} />
            <Route path="/hotels" element={<AdminHotelManagement />} />
            <Route path="/bookings" element={<BookingManagement user={user} />} />
            <Route path="/analytics" element={<AdminAnalytics />} />
            <Route path="/users" element={<AdminUserManagement />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

/**
 * 商户布局
 */
function MerchantLayout({ onLogout, user }) {
  const effectiveUser = user || getStoredUser() || {};
  return (
    <Layout className="app-layout">
      <Sidebar />
      <Layout className="main-layout">
        <div className="layout-header-bar">
          <NotificationDropdown user={effectiveUser} />
        </div>
        <Content className="main-content">
          <Routes>
            <Route path="/dashboard" element={<MerchantDashboard user={user} />} />
            <Route path="/entry" element={<MerchantHotelEntry />} />
            <Route path="/my-hotels" element={<MerchantHotelList user={user} />} />
            <Route path="/messages" element={<MerchantMessageCenter />} />
            <Route path="/bookings" element={<BookingManagement user={user} />} />
            <Route path="/" element={<Navigate to="/merchant/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
