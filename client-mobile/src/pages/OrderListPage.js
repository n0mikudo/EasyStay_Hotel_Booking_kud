/**
 * 我的订单页面
 * 展示用户预订的酒店订单，支持状态筛选
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Tabs, Card, Empty, Toast, Tag, Button } from 'antd-mobile';
import { CalendarOutline, EnvironmentOutline, LockOutline } from 'antd-mobile-icons';
import { bookingService } from '../services/api';
import { useClientAuth } from '../contexts/ClientAuthContext';
import LoginSheet from '../components/LoginSheet';
import './OrderListPage.css';

const statusTabs = [
  { key: 'all', title: '全部' },
  { key: 'pending', title: '待入住' },
  { key: 'completed', title: '已完成' },
  { key: 'cancelled', title: '已取消' }
];

function OrderListPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useClientAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadOrders();
    } else {
      setOrders([]);
    }
  }, [isLoggedIn, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBookings({ clientUserId: user.id });
      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (error) {
      Toast.show({ content: '加载失败', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const map = {
      pending: { color: 'primary', text: '待入住' },
      completed: { color: 'success', text: '已完成' },
      cancelled: { color: 'default', text: '已取消' }
    };
    const config = map[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const handleOrderClick = (order) => {
    navigate(`/orders/${order.id}`);
  };

  return (
    <div className="order-list-page">
      <NavBar className="order-nav" back={null}>
        <span className="nav-title">我的订单</span>
      </NavBar>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="order-tabs"
      >
        {statusTabs.map((tab) => (
          <Tabs.Tab key={tab.key} title={tab.title} />
        ))}
      </Tabs>

      <div className="order-content">
        {!isLoggedIn ? (
          <div className="order-login-prompt">
            <LockOutline style={{ fontSize: 48, color: 'var(--color-text-disabled)' }} />
            <p className="login-prompt-text">登录后查看您的订单</p>
            <Button color="primary" shape="rounded" onClick={() => setShowLogin(true)}>
              立即登录
            </Button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="order-empty-wrap">
            <Empty
              className="order-empty"
              description={loading ? '加载中...' : '暂无订单'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            {!loading && (
              <Button color="primary" fill="outline" onClick={() => navigate('/hotels')}>
                去挑选酒店
              </Button>
            )}
          </div>
        ) : (
          <div className="order-list">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="order-card"
                onClick={() => handleOrderClick(order)}
              >
                <div className="order-card-header">
                  <span className="order-hotel-name">{order.hotelName}</span>
                  {getStatusTag(order.status)}
                </div>
                <div className="order-card-body">
                  <div className="order-row">
                    <CalendarOutline className="order-icon" />
                    <span>{order.checkIn} 至 {order.checkOut}</span>
                  </div>
                  <div className="order-row">
                    <EnvironmentOutline className="order-icon" />
                    <span>{order.roomType} · {order.roomCount}间</span>
                  </div>
                </div>
                <div className="order-card-footer">
                  <span className="order-total">¥{order.totalPrice}</span>
                  <Button size="mini" color="primary" fill="outline">
                    查看详情
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <LoginSheet
        visible={showLogin}
        onClose={() => { setShowLogin(false); }}
      />
    </div>
  );
}

export default OrderListPage;
