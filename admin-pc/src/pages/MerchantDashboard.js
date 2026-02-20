/**
 * 商户仪表盘组件
 *
 * 功能：
 * 1. 展示商户自己的酒店统计
 * 2. 快捷操作入口
 * 3. 最新状态提醒
 *
 * @component
 */

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Button, List, Tag, Space } from 'antd';
import {
  HomeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { hotelService } from '../services/api';
import './Dashboard.css';

function MerchantDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [recentHotels, setRecentHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 获取用户信息
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch (e) {
        console.error('解析用户信息失败:', e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    } else if (user === null && localStorage.getItem('user') === null) {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await hotelService.getHotels({ userId: user.id });
      if (response.data.success) {
        const hotels = response.data.data || [];
        setRecentHotels(hotels.slice(0, 5));
        
        // 计算统计
        setStats({
          total: hotels.length,
          pending: hotels.filter(h => h.status === 'pending').length,
          approved: hotels.filter(h => h.status === 'approved').length,
          rejected: hotels.filter(h => h.status === 'rejected').length
        });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending': { color: 'warning', text: '审核中' },
      'approved': { color: 'success', text: '已通过' },
      'rejected': { color: 'error', text: '已拒绝' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">商户工作台</h1>
        <div className="flex-between" style={{ marginTop: '12px', alignItems: 'center' }}>
          <p className="page-subtitle">管理您的酒店信息</p>
        </div>
      </div>

      {/* 快捷操作 */}
      <Card className="action-card fade-in" style={{ marginBottom: 24 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/merchant/entry')}
          className="btn-primary"
        >
          录入新酒店
        </Button>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card 
            loading={loading}
            className="stat-card fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <Statistic
              title="我的酒店"
              value={stats.total}
              prefix={<HomeOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>家</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            loading={loading}
            className="stat-card fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            <Statistic
              title="审核中"
              value={stats.pending}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>家</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            loading={loading}
            className="stat-card fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <Statistic
              title="已通过"
              value={stats.approved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>家</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            loading={loading}
            className="stat-card fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <Statistic
              title="已拒绝"
              value={stats.rejected}
              valueStyle={{ color: '#f5222d' }}
              prefix={<BarChartOutlined style={{ color: '#f5222d' }} />}
              suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>家</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* 最近录入的酒店 */}
      <Card
        title="最近录入的酒店"
        className="pending-list-card fade-in"
        style={{ animationDelay: '0.5s' }}
        extra={
          <Button
            type="link"
            onClick={() => navigate('/merchant/my-hotels')}
            className="btn-link"
          >
            查看全部 <ArrowRightOutlined />
          </Button>
        }
      >
        <List
          loading={loading}
          dataSource={recentHotels}
          renderItem={item => (
            <List.Item
              actions={[
                getStatusTag(item.status)
              ]}
              className="list-item-hover"
            >
              <List.Item.Meta
                title={<span className="list-item-title">{item.name}</span>}
                description={`${item.city} · ¥${item.price}起/晚`}
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 操作指南 */}
      <Card
        title="操作指南"
        className="guide-card fade-in"
        style={{ animationDelay: '0.6s', marginTop: 24 }}
      >
        <div className="guide-content">
          <div className="guide-item">
            <h4>1. 录入新酒店</h4>
            <p>点击"录入新酒店"按钮，填写酒店详细信息并提交审核</p>
          </div>
          <div className="guide-item">
            <h4>2. 查看审核状态</h4>
            <p>在"最近录入的酒店"列表中查看酒店的审核状态</p>
          </div>
          <div className="guide-item">
            <h4>3. 管理酒店信息</h4>
            <p>在"我的酒店"页面中查看和管理所有已录入的酒店</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default MerchantDashboard;
