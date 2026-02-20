/**
 * 预订管理页面
 * 管理员：查看平台全部预订订单
 * 商户：仅查看自己名下酒店的预订订单（数据隔离）
 */
import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, message } from 'antd';
import { bookingService } from '../services/api';
import './HotelManagement.css';

function BookingManagement({ user: userProp }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const user = userProp || (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {});

  useEffect(() => {
    loadBookings();
  }, [user?.id, user?.role]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (user?.role) params.role = user.role;
      if (user?.id) params.userId = user.id;
      const response = await bookingService.getBookings(params);
      if (response.data.success) {
        setBookings(response.data.data || []);
      }
    } catch {
      message.error('加载预订列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const map = {
      pending: { color: 'processing', text: '待入住' },
      completed: { color: 'success', text: '已完成' },
      cancelled: { color: 'default', text: '已取消' }
    };
    const config = map[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    { title: '订单ID', dataIndex: 'id', key: 'id', ellipsis: true, width: 140 },
    { title: '酒店', dataIndex: 'hotelName', key: 'hotelName', ellipsis: true },
    { title: '房型', dataIndex: 'roomType', key: 'roomType' },
    { title: '入住', dataIndex: 'checkIn', key: 'checkIn' },
    { title: '离店', dataIndex: 'checkOut', key: 'checkOut' },
    { title: '间数', dataIndex: 'roomCount', key: 'roomCount', width: 60 },
    { title: '总价', dataIndex: 'totalPrice', key: 'totalPrice', render: (v) => `¥${v}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: '下单时间', dataIndex: 'createdAt', key: 'createdAt', render: (v) => v ? new Date(v).toLocaleString() : '-' }
  ];

  return (
    <div className="hotel-management">
      <div className="page-header">
        <h1 className="page-title">预订管理</h1>
        <p className="page-subtitle">
          {user?.role === 'admin' ? '查看平台所有预订订单' : '查看您名下酒店的预订订单'}
        </p>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize })
          }}
        />
      </Card>
    </div>
  );
}

export default BookingManagement;
