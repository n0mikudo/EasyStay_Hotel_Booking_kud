/**
 * 数据看板页面组件
 *
 * 功能：
 * 1. 展示平台核心数据统计
 * 2. 实时数据更新
 * 3. 可视化统计卡片
 * 4. 快捷操作入口
 *
 * @component
 */

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Divider, Progress } from 'antd';
import {
  HomeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  AuditOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { statsService } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  // 组件挂载时获取统计数据
  useEffect(() => {
    fetchStats();
    // 设置定时刷新（每30秒）
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * 获取统计数据
   */
  const fetchStats = async () => {
    try {
      const response = await statsService.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 计算审核通过率
   * @returns {number} 通过率百分比
   */
  const calculateApprovalRate = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.approved / stats.total) * 100);
  };

  /**
   * 快捷操作配置
   */
  const quickActions = [
    {
      title: '录入酒店',
      icon: <PlusOutlined />,
      description: '添加新的酒店信息',
      path: '/merchant-entry',
      color: '#1890ff'
    },
    {
      title: '审核管理',
      icon: <AuditOutlined />,
      description: `待审核酒店: ${stats.pending} 家`,
      path: '/audit',
      color: '#fa8c16',
      badge: stats.pending > 0 ? stats.pending : null
    },
    {
      title: '酒店管理',
      icon: <BarChartOutlined />,
      description: '管理所有酒店信息',
      path: '/hotels',
      color: '#52c41a'
    }
  ];

  return (
    <div className="dashboard-page">
      {/* 页面标题 */}
      <div className="page-header">
        <h1 className="page-title">📊 数据看板</h1>
        <p className="page-subtitle">实时监控平台运营数据</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card total-card" loading={loading}>
            <Statistic
              title="酒店总数"
              value={stats.total}
              prefix={<HomeOutlined className="stat-icon" />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="stat-footer">
              <span className="stat-label">累计录入</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card pending-card" loading={loading}>
            <Statistic
              title="待审核"
              value={stats.pending}
              prefix={<ClockCircleOutlined className="stat-icon" />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div className="stat-footer">
              <span className="stat-label">需要处理</span>
              {stats.pending > 0 && (
                <span className="stat-badge">待处理</span>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card approved-card" loading={loading}>
            <Statistic
              title="已通过"
              value={stats.approved}
              prefix={<CheckCircleOutlined className="stat-icon" />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="stat-footer">
              <span className="stat-label">已上线</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card rejected-card" loading={loading}>
            <Statistic
              title="已拒绝"
              value={stats.rejected}
              prefix={<CloseCircleOutlined className="stat-icon" />}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <div className="stat-footer">
              <span className="stat-label">未通过</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 审核通过率 */}
      <Row gutter={[24, 24]} className="progress-row">
        <Col xs={24} lg={12}>
          <Card title="📈 审核通过率" className="progress-card">
            <div className="progress-content">
              <Progress
                type="circle"
                percent={calculateApprovalRate()}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                size={120}
              />
              <div className="progress-info">
                <p className="progress-title">审核通过率</p>
                <p className="progress-desc">
                  已审核 {stats.approved + stats.rejected} 家酒店，
                  其中 {stats.approved} 家通过审核
                </p>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="🚀 快捷操作" className="quick-actions-card">
            <div className="quick-actions">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  className="quick-action-item"
                  onClick={() => navigate(action.path)}
                >
                  <div
                    className="action-icon"
                    style={{ backgroundColor: `${action.color}20`, color: action.color }}
                  >
                    {action.icon}
                    {action.badge && (
                      <span className="action-badge">{action.badge}</span>
                    )}
                  </div>
                  <div className="action-info">
                    <h4 className="action-title">{action.title}</h4>
                    <p className="action-desc">{action.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 平台说明 */}
      <Card title="ℹ️ 平台说明" className="info-card">
        <p className="info-text">
          <strong>易宿酒店预订平台</strong> 是一个完整的酒店管理系统，包含：
        </p>
        <ul className="info-list">
          <li>酒店录入：录入新酒店信息，提交审核</li>
          <li>审核管理：管理员审核酒店信息，决定是否上线</li>
          <li>酒店管理：管理所有酒店信息，支持编辑和删除</li>
          <li>移动端展示：用户可通过移动端浏览和搜索酒店</li>
        </ul>
        <Divider />
        <p className="info-footer">
          前端训练营第五期大作业 | © 2026 易宿平台
        </p>
      </Card>
    </div>
  );
}

export default Dashboard;
