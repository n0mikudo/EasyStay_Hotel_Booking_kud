/**
 * 订单详情页
 * 展示订单完整信息：下单时间、酒店信息、入住/离店、房型、价格等
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  NavBar,
  Card,
  Toast,
  Button,
  Tag,
  Divider,
  Dialog
} from 'antd-mobile';
import {
  CalendarOutline,
  EnvironmentOutline,
  TeamOutline,
  CheckCircleOutline,
  RightOutline
} from 'antd-mobile-icons';
import { bookingService } from '../services/api';
import './OrderDetailPage.css';

const statusMap = {
  pending: { color: 'primary', text: '待入住' },
  completed: { color: 'success', text: '已完成' },
  cancelled: { color: 'default', text: '已取消' }
};

function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getBookingById(id);
      if (res.data.success) {
        setOrder(res.data.data);
      } else {
        Toast.show({ content: '订单不存在', icon: 'fail' });
        navigate('/orders');
      }
    } catch {
      Toast.show({ content: '加载失败', icon: 'fail' });
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Dialog.confirm({
      content: '确定要取消该订单吗？取消后不可恢复。',
      confirmText: '确定取消',
      cancelText: '我再想想',
      onConfirm: async () => {
        try {
          const res = await bookingService.cancelBooking(id);
          if (res.data.success) {
            Toast.show({ content: '订单已取消', icon: 'success' });
            setOrder(prev => ({ ...prev, status: 'cancelled' }));
          } else {
            Toast.show({ content: res.data.message || '取消失败', icon: 'fail' });
          }
        } catch (e) {
          Toast.show({ content: e.response?.data?.message || '取消失败', icon: 'fail' });
        }
      }
    });
  };

  if (loading || !order) {
    return (
      <div className="order-detail-page">
        <NavBar onBack={() => navigate('/orders')}>订单详情</NavBar>
        <div className="order-detail-loading">加载中...</div>
      </div>
    );
  }

  const statusConfig = statusMap[order.status] || { color: 'default', text: order.status };

  return (
    <div className="order-detail-page">
      <NavBar className="order-detail-nav" onBack={() => navigate('/orders')}>
        订单详情
      </NavBar>

      <div className="order-detail-content">
        {/* 订单状态 */}
        <Card className="order-status-card">
          <div className="order-status-row">
            <span className="order-id">订单号：{order.id}</span>
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
          </div>
          <div className="order-time">
            下单时间：{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
          </div>
        </Card>

        {/* 酒店信息 */}
        <Card className="order-section-card" title="酒店信息">
          <div className="order-hotel-name">{order.hotelName}</div>
          <div className="order-room-info">
            <div className="order-room-main">
              <CheckCircleOutline className="order-detail-icon" />
              {order.roomType} · {order.roomCount}间
            </div>
            {order.roomTypeDescription && (
              <div className="order-room-desc">{order.roomTypeDescription}</div>
            )}
          </div>
          <Button
            size="small"
            fill="outline"
            className="view-hotel-btn"
            onClick={() => navigate(`/hotels/${order.hotelId}`)}
          >
            查看酒店 <RightOutline />
          </Button>
        </Card>

        {/* 入住信息 */}
        <Card className="order-section-card" title="入住信息">
          <div className="order-info-row">
            <CalendarOutline className="order-detail-icon" />
            <div>
              <div className="order-info-label">入住日期</div>
              <div className="order-info-value">{order.checkIn}</div>
            </div>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <div className="order-info-row">
            <CalendarOutline className="order-detail-icon" />
            <div>
              <div className="order-info-label">离店日期</div>
              <div className="order-info-value">{order.checkOut}</div>
            </div>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <div className="order-info-row">
            <TeamOutline className="order-detail-icon" />
            <div>
              <div className="order-info-label">入住间夜</div>
              <div className="order-info-value">{order.nights} 晚</div>
            </div>
          </div>
          {order.guestCount && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <div className="order-info-row">
                <TeamOutline className="order-detail-icon" />
                <div>
                  <div className="order-info-label">入住人数</div>
                  <div className="order-info-value">{order.guestCount} 人</div>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* 价格明细 */}
        <Card className="order-section-card" title="价格明细">
          <div className="order-price-row">
            <span>房费（{order.roomType || '标准间'} ¥{order.roomPrice}/晚 × {order.roomCount}间 × {order.nights}晚）</span>
            <span>¥{order.totalPrice}</span>
          </div>
          <div className="order-price-total">
            <span>合计</span>
            <span className="total-amount">¥{order.totalPrice}</span>
          </div>
        </Card>

        {/* 取消订单 - 仅待入住状态可取消 */}
        {order.status === 'pending' && (
          <div className="order-detail-actions">
            <Button block color="danger" fill="outline" onClick={handleCancelOrder}>
              取消订单
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderDetailPage;
