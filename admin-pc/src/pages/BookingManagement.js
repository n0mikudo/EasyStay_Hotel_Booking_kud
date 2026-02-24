/**
 * 预订管理页面
 * 管理员：查看平台全部预订订单
 * 商户：仅查看自己名下酒店的预订订单（数据隔离）
 */
import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, message, Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { bookingService } from '../services/api';
import { resolveUserIdentity } from '../utils/userIdentity';
import './HotelManagement.css';

function BookingManagement({ user: userProp }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const { user, role: userRole, userId } = resolveUserIdentity(userProp);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userRole]);

  const loadBookings = async () => {
    if (userRole === 'merchant' && !userId) {
      setBookings([]);
      message.warning('登录信息异常，请重新登录');
      return;
    }
    try {
      setLoading(true);
      const params = {};
      if (userRole) params.role = userRole;
      if (userId) params.userId = userId;
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

  const handleDelete = async (id) => {
    try {
      const res = await bookingService.deleteBooking(id);
      if (res.data.success) {
        message.success('删除成功');
        loadBookings();
      } else {
        message.error(res.data.message || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '订单ID', dataIndex: 'id', key: 'id', ellipsis: true, width: 140 },
    { title: '酒店', dataIndex: 'hotelName', key: 'hotelName', ellipsis: true, render: (v, r) => v || `[已删除] (${r.hotelId})` },
    { title: '房型', dataIndex: 'roomType', key: 'roomType' },
    { title: '入住', dataIndex: 'checkIn', key: 'checkIn' },
    { title: '离店', dataIndex: 'checkOut', key: 'checkOut' },
    { title: '间数', dataIndex: 'roomCount', key: 'roomCount', width: 60 },
    { title: '总价', dataIndex: 'totalPrice', key: 'totalPrice', render: (v) => `¥${v}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: '下单时间', dataIndex: 'createdAt', key: 'createdAt', render: (v) => v ? new Date(v).toLocaleString() : '-' },
    ...(user?.role === 'admin' ? [{
      title: '操作', key: 'action', width: 80,
      render: (_, record) => (
        <Popconfirm title="确定删除该订单？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
          <Button type="link" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      )
    }] : [])
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
