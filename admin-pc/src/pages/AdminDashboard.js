/**
 * 管理员仪表盘组件
 *
 * 功能：
 * 1. 展示平台整体统计数据
 * 2. 展示待审核酒店数量
 * 3. 快捷操作入口
 * 4. 数据可视化图表
 * 5. 实时状态监控
 *
 * @component
 */

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Button, List, Tag, Progress, Badge, Avatar } from 'antd';
import {
  HomeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  BarChartOutlined,
  SettingOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { statsService, hotelService } from '../services/api';
import './Dashboard.css';

function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [pendingHotels, setPendingHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [todayStats, setTodayStats] = useState({
    newHotels: 0,
    audits: 0
  });

  const isFirstLoad = React.useRef(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      if (isFirstLoad.current) setLoading(true);
      // 获取统计数据
      const statsRes = await statsService.getStats();
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      // 获取待审核酒店
      const hotelsRes = await hotelService.getHotels({ status: 'pending', limit: 5 });
      if (hotelsRes.data.success) {
        setPendingHotels(hotelsRes.data.data);
      }

      // 获取经营风险预警
      const riskRes = await statsService.getRiskAlerts();
      if (riskRes.data.success) {
        setRiskAlerts(riskRes.data.data?.alerts || []);
      }

      // 今日数据已由 stats 接口返回
      if (statsRes.data.success) {
        const s = statsRes.data.data;
        setTodayStats({
          newHotels: s.todayNewHotels || 0,
          audits: s.todayAudits || 0
        });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  };
  const getRiskLevelTag = (level) => {
    const tagMap = {
      danger: <Tag color="error">高风险</Tag>,
      warning: <Tag color="warning">关注</Tag>,
      info: <Tag color="blue">正常</Tag>
    };
    return tagMap[level] || <Tag>未知</Tag>;
  };

  // 计算审核通过率
  const approvalRate = stats.total > 0 ? Math.round((stats.approved / (stats.approved + stats.rejected)) * 100) : 0;

  return (
    <div className="dashboard fade-in">
      <div className="page-header">
        <h1 className="page-title">管理员仪表盘</h1>
        <div className="flex-between" style={{ marginTop: '12px', alignItems: 'center' }}>
          <p className="page-subtitle">欢迎回来，管理员</p>
          <div className="flex gap-md" style={{ alignItems: 'center' }}>
            <Badge count={stats.pending} size="small" offset={[0, 0]}>
              <Button 
                type="primary" 
                icon={<ClockCircleOutlined />}
                onClick={() => navigate('/admin/audit')}
              >
                待审核 ({stats.pending})
              </Button>
            </Badge>
          </div>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card 
            loading={loading}
            className="stat-card fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <Statistic
              title="酒店总数"
              value={stats.total}
              prefix={<HomeOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>家</span>}
            />
            <div style={{ marginTop: '12px' }}>
              <Progress 
                percent={100} 
                size="small" 
                status="active" 
                strokeColor="#1890ff"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            loading={loading}
            className="stat-card fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            <Statistic
              title="待审核"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
              suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>家</span>}
            />
            <div style={{ marginTop: '12px' }}>
              <Progress 
                percent={stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0} 
                size="small" 
                status="warning" 
                strokeColor="#fa8c16"
              />
            </div>
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
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>家</span>}
            />
            <div style={{ marginTop: '12px' }}>
              <Progress 
                percent={stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0} 
                size="small" 
                status="success" 
                strokeColor="#52c41a"
              />
            </div>
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
              prefix={<CloseCircleOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
              suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>家</span>}
            />
            <div style={{ marginTop: '12px' }}>
              <Progress 
                percent={stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0} 
                size="small" 
                status="exception" 
                strokeColor="#f5222d"
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 数据概览 */}
      <Row gutter={[24, 24]}>
        {/* 审核通过率 */}
        <Col xs={24} lg={8}>
          <Card 
            title="审核概览" 
            className="content-card fade-in"
            style={{ animationDelay: '0.5s' }}
          >
            <div style={{ marginBottom: '20px' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#595959' }}>审核通过率</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1890ff' }}>{approvalRate}%</span>
              </div>
              <Progress 
                percent={approvalRate} 
                strokeColor="#1890ff" 
                strokeWidth={12}
              />
            </div>
            <div className="flex gap-md" style={{ justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#52c41a' }}>{stats.approved}</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>通过</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#f5222d' }}>{stats.rejected}</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>拒绝</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#fa8c16' }}>{stats.pending}</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>待审</div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 快捷操作 */}
        <Col xs={24} lg={8}>
          <Card 
            title="快捷操作" 
            className="content-card fade-in"
            style={{ animationDelay: '0.6s' }}
          >
            <div className="flex flex-column gap-md">
              <Button 
                type="primary" 
                icon={<AuditOutlined />}
                block
                onClick={() => navigate('/admin/audit')}
              >
                酒店审核管理
              </Button>
              <Button 
                icon={<HomeOutlined />}
                block
                onClick={() => navigate('/admin/hotels')}
              >
                酒店信息管理
              </Button>
              <Button 
                icon={<BarChartOutlined />}
                block
                onClick={() => navigate('/admin/analytics')}
              >
                数据分析报表
              </Button>
              <Button 
                icon={<SettingOutlined />}
                block
                onClick={() => navigate('/admin/settings')}
              >
                系统设置
              </Button>
            </div>
          </Card>
        </Col>

        {/* 系统状态 */}
        <Col xs={24} lg={8}>
          <Card 
            title="系统状态" 
            className="content-card fade-in"
            style={{ animationDelay: '0.7s' }}
          >
            <div className="flex flex-column gap-md">
              <div className="flex-between" style={{ alignItems: 'center' }}>
                <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#52c41a' }}></div>
                  <span style={{ fontSize: '14px' }}>后端服务</span>
                </div>
                <Tag color="success">运行中</Tag>
              </div>
              <div className="flex-between" style={{ alignItems: 'center' }}>
                <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#52c41a' }}></div>
                  <span style={{ fontSize: '14px' }}>前端应用</span>
                </div>
                <Tag color="success">正常</Tag>
              </div>
              <div className="flex-between" style={{ alignItems: 'center' }}>
                <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#52c41a' }}></div>
                  <span style={{ fontSize: '14px' }}>数据库</span>
                </div>
                <Tag color="success">连接正常</Tag>
              </div>
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
                <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                  <CalendarOutlined style={{ color: '#52c41a' }} />
                  <span style={{ fontSize: '12px', color: '#52c41a' }}>今日数据：新增酒店 {todayStats.newHotels} 家，审核 {todayStats.audits} 次</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 待审核酒店和经营风险预警 */}
      <Row gutter={[24, 24]}>
        {/* 待审核酒店 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex-between" style={{ alignItems: 'center' }}>
                <span>待审核酒店</span>
                <Button
                  type="link"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/admin/audit')}
                >
                  查看全部
                </Button>
              </div>
            }
            className="content-card fade-in"
            style={{ animationDelay: '0.8s' }}
          >
            <List
              loading={loading}
              dataSource={pendingHotels}
              locale={{ emptyText: '暂无待审核酒店' }}
              renderItem={item => (
                <List.Item
                  className="fade-in"
                  actions={[
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckCircleOutlined />}
                      onClick={() => navigate('/admin/audit')}
                    >
                      去审核
                    </Button>
                  ]}
                  style={{ 
                    padding: '16px 0', 
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<HomeOutlined />} />}
                    title={
                      <div className="flex-between" style={{ alignItems: 'center' }}>
                        <span style={{ fontWeight: '500', color: '#262626' }}>{item.name}</span>
                        <Tag color="warning">待审核</Tag>
                      </div>
                    }
                    description={
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                        <div>{item.city} · {item.address}</div>
                        <div>价格：¥{item.price}起/晚</div>
                        <div style={{ marginTop: '4px' }}>提交时间：{new Date(item.createdAt).toLocaleString()}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 经营风险预警 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex-between" style={{ alignItems: 'center' }}>
                <span>经营风险预警</span>
              </div>
            }
            className="content-card fade-in"
            style={{ animationDelay: '0.9s' }}
          >
            <List
              loading={loading}
              dataSource={riskAlerts}
              locale={{ emptyText: '暂无风险预警' }}
              renderItem={item => (
                <List.Item
                  className="fade-in"
                  style={{ 
                    padding: '16px 0', 
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<ExclamationCircleOutlined />} />}
                    title={
                      <div className="flex-between" style={{ fontSize: '14px', color: '#262626' }}>
                        <span style={{ fontWeight: '500' }}>{item.title}</span>
                        {getRiskLevelTag(item.level)}
                      </div>
                    }
                    description={
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                        <div>{item.description}</div>
                        <div style={{ marginTop: 4 }}>风险数量：{item.count}</div>
                        <Button
                          type="link"
                          size="small"
                          style={{ paddingLeft: 0, marginTop: 2 }}
                          onClick={() => item.actionRoute && navigate(item.actionRoute)}
                        >
                          去处理
                        </Button>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AdminDashboard;