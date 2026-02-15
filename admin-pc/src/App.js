/**
 * PC管理端应用主组件
 *
 * 功能：
 * 1. 整体布局管理（侧边栏 + 内容区）
 * 2. 路由配置
 * 3. 页面导航
 *
 * @component
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import MerchantEntry from './pages/MerchantEntry';
import AuditList from './pages/AuditList';
import HotelManagement from './pages/HotelManagement';
import './App.css';

const { Content } = Layout;

/**
 * 应用主组件
 * 定义整体布局和路由配置
 */
function App() {
  return (
    <Layout className="app-layout">
      {/* 侧边导航栏 */}
      <Sidebar />
      
      {/* 主内容区域 */}
      <Layout className="main-layout">
        <Content className="main-content">
          <Routes>
            {/* 默认重定向到仪表盘 */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 仪表盘 */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* 商户录入 */}
            <Route path="/merchant-entry" element={<MerchantEntry />} />
            
            {/* 审核管理 */}
            <Route path="/audit" element={<AuditList />} />
            
            {/* 酒店管理 */}
            <Route path="/hotels" element={<HotelManagement />} />
            
            {/* 404页面 */}
            <Route path="*" element={
              <div className="not-found">
                <h1>404</h1>
                <p>页面不存在</p>
              </div>
            } />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
