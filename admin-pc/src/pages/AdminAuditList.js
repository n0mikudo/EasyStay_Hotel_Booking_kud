/**
 * 管理员审核列表页面
 *
 * 功能：
 * 1. 展示所有待审核的酒店
 * 2. 查看酒店详情
 * 3. 审核通过/拒绝
 *
 * @component
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Modal,
  Descriptions,
  Input
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { hotelService, userService } from '../services/api';
import './AuditList.css';

function AdminAuditList({ user }) {
  const [hotels, setHotels] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectHotelId, setRejectHotelId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadHotels();
    loadUsers();
  }, []);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const response = await hotelService.getHotels();
      if (response.data.success) {
        setHotels(response.data.data);
      }
    } catch (error) {
      message.error('加载酒店列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getUsers();
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch { /* 忽略 */ }
  };

  const handleAudit = async (id, status, reason = '') => {
    try {
      const effectiveUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      const adminInfo = { id: effectiveUser.id, username: effectiveUser.username };
      const response = await hotelService.auditHotel(id, status, reason, adminInfo);
      if (response.data.success) {
        message.success(status === 'approved' ? '审核通过' : '已拒绝');
        setRejectModalVisible(false);
        setRejectHotelId(null);
        setRejectReason('');
        loadHotels();
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const openRejectModal = (hotel) => {
    setRejectHotelId(hotel.id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      message.warning('请填写拒绝原因');
      return;
    }
    handleAudit(rejectHotelId, 'rejected', rejectReason.trim());
  };

  const showDetail = (hotel) => {
    setSelectedHotel(hotel);
    setDetailModalVisible(true);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending': { color: 'warning', text: '待审核' },
      'approved': { color: 'success', text: '已通过' },
      'rejected': { color: 'error', text: '已拒绝' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city'
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price) => price != null ? `¥${price}起` : '-'
    },
    {
      title: '星级',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => '★'.repeat(rating)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => showDetail(record)}
          >
            查看
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                onClick={() => handleAudit(record.id, 'approved')}
              >
                通过
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                size="small"
                onClick={() => openRejectModal(record)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="audit-list">
      <div className="page-header">
        <h1 className="page-title">酒店审核</h1>
        <p className="page-subtitle">审核商户提交的新酒店</p>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={hotels}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize })
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="酒店详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedHotel && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="酒店名称" span={2}>
              {selectedHotel.name}
            </Descriptions.Item>
            <Descriptions.Item label="城市">{selectedHotel.city}</Descriptions.Item>
            <Descriptions.Item label="价格">¥{selectedHotel.price}起/晚</Descriptions.Item>
            <Descriptions.Item label="星级">{selectedHotel.rating ? '★'.repeat(selectedHotel.rating) : '未设置'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selectedHotel.phone || '未设置'}</Descriptions.Item>
            <Descriptions.Item label="商户">{users.find(u => u.id === selectedHotel.userId)?.username || '-'}</Descriptions.Item>
            <Descriptions.Item label="商户所有人姓名">{users.find(u => u.id === selectedHotel.userId)?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="地址" span={2}>{selectedHotel.address}</Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>{selectedHotel.description}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(selectedHotel.status)}</Descriptions.Item>
            {selectedHotel.status === 'rejected' && selectedHotel.rejectReason && (
              <Descriptions.Item label="拒绝原因" span={2}>
                <span style={{ color: '#ff4d4f' }}>{selectedHotel.rejectReason}</span>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 拒绝原因弹窗 */}
      <Modal
        title="填写拒绝原因"
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectHotelId(null);
          setRejectReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
      >
        <Input.TextArea
          rows={4}
          placeholder="请输入拒绝原因（必填）"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          maxLength={200}
          showCount
        />
      </Modal>
    </div>
  );
}

export default AdminAuditList;
