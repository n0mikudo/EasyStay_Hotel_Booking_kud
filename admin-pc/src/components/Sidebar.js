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
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  PlusOutlined,
  AuditOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import './Sidebar.css';

const { Sider } = Layout;

/**
 * 侧边栏组件
 * 提供应用的主要导航功能
 */
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  /**
   * 菜单项配置
   * 定义所有可用的导航项
   */
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板'
    },
    {
      key: '/merchant-entry',
      icon: <PlusOutlined />,
      label: '商户录入'
    },
    {
      key: '/audit',
      icon: <AuditOutlined />,
      label: '审核管理'
    },
    {
      key: '/hotels',
      icon: <HomeOutlined />,
      label: '酒店管理'
    }
  ];

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

      {/* 底部信息 */}
      {!collapsed && (
        <div className="sidebar-footer">
          <p className="version">版本 v1.0.0</p>
          <p className="copyright">© 2024 易宿平台</p>
        </div>
      )}
    </Sider>
  );
}

export default Sidebar;
