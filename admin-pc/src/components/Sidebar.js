/**
 * 侧边栏导航组件
 *
 * 功能：
 * 1. 显示平台Logo和名称
 * 2. 提供主导航菜单
 * 3. 高亮当前选中项
 * 4. 响应式折叠（可选）
 *
 * @component
 */

import React, { useState } from 'react';
import { Layout, Menu, Button, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  PlusOutlined,
  AuditOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  BarChartOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  MessageOutlined,
  UserOutlined
} from '@ant-design/icons';
import { getStoredUser } from '../utils/userIdentity';
import './Sidebar.css';

const { Sider } = Layout;

/**
 * 获取当前登录用户
 * @returns {Object|null} 用户信息
 */
const getCurrentUser = () => {
  return getStoredUser();
};

/**
 * 侧边栏组件
 * 提供应用的主要导航功能
 */
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const user = getCurrentUser();
  const role = user?.role || 'merchant'; // 默认商户角色

  /**
   * 菜单项配置
   * 根据用户角色定义可用的导航项
   */
  const getMenuItems = () => {
    const basePath = role === 'admin' ? '/admin' : '/merchant';
    
    if (role === 'admin') {
      // 管理员菜单
      return [
        {
          key: `${basePath}/dashboard`,
          icon: <DashboardOutlined />,
          label: '数据看板'
        },
        {
          key: `${basePath}/audit`,
          icon: <AuditOutlined />,
          label: '审核管理'
        },
        {
          key: `${basePath}/messages`,
          icon: <MessageOutlined />,
          label: '消息中心'
        },
        {
          key: `${basePath}/hotels`,
          icon: <HomeOutlined />,
          label: '酒店管理'
        },
        {
          key: `${basePath}/bookings`,
          icon: <UnorderedListOutlined />,
          label: '预订管理'
        },
        {
          key: `${basePath}/analytics`,
          icon: <BarChartOutlined />,
          label: '数据分析'
        },
        {
          key: `${basePath}/users`,
          icon: <UserOutlined />,
          label: '用户管理'
        },
        {
          key: `${basePath}/settings`,
          icon: <SettingOutlined />,
          label: '系统设置'
        }
      ];
    } else {
      // 商户菜单
      return [
        {
          key: `${basePath}/dashboard`,
          icon: <DashboardOutlined />,
          label: '数据看板'
        },
        {
          key: `${basePath}/entry`,
          icon: <PlusOutlined />,
          label: '酒店录入'
        },
        {
          key: `${basePath}/my-hotels`,
          icon: <HomeOutlined />,
          label: '酒店管理'
        },
        {
          key: `${basePath}/messages`,
          icon: <MessageOutlined />,
          label: '消息中心'
        },
        {
          key: `${basePath}/bookings`,
          icon: <UnorderedListOutlined />,
          label: '预订管理'
        }
      ];
    }
  };

  const menuItems = getMenuItems();

  /**
   * 处理菜单点击事件
   * @param {Object} param - 点击的菜单项
   * @param {string} param.key - 菜单项的key（即路由路径）
   */
  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  /**
   * 切换侧边栏折叠状态
   */
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  /**
   * 处理退出登录
   */
  const handleLogout = () => {
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/login');
  };

  return (
    <Sider
      width={240}
      theme="dark"
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      className="sidebar"
      trigger={null}
    >
      {/* Logo区域 */}
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🏨</span>
          {!collapsed && <span className="logo-text">易宿管理平台</span>}
        </div>
        {/* 折叠按钮 */}
        <button className="collapse-btn" onClick={toggleCollapsed}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      {/* 导航菜单 */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        className="sidebar-menu"
      />

      {/* 底部区域 */}
      {!collapsed && (
        <div className="sidebar-footer">
          {/* 退出登录按钮 */}
          <Button
            type="default"
            danger
            icon={<LogoutOutlined />}
            block
            onClick={handleLogout}
            style={{ marginBottom: '16px' }}
          >
            退出登录
          </Button>
          {/* 版本信息 */}
          <p className="version">版本 v1.0.0</p>
          <p className="copyright">© 2026 易宿平台</p>
        </div>
      )}
    </Sider>
  );
}

export default Sidebar;
