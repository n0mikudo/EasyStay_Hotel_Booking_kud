import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd';
import { CheckOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import messageService from '../services/messageService';
import { resolveUserIdentity } from '../utils/userIdentity';
import './HotelManagement.css';

const { Text } = Typography;

const ACTION_TYPE_LABEL = {
  audit_approve: '审核通过',
  audit_reject: '审核拒绝',
  hotel_online: '酒店上线',
  hotel_offline: '酒店下线',
  hotel_delete: '酒店删除',
  booking_created: '新订单'
};

function MerchantMessageCenter() {
  const { role, userId } = resolveUserIdentity();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [actionType, setActionType] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const loadMessages = useCallback(async () => {
    if (role === 'merchant' && !userId) {
      setRecords([]);
      message.warning('登录信息异常，请重新登录');
      return;
    }
    try {
      setLoading(true);
      const res = await messageService.getMessages({ role: 'merchant', userId });
      if (res.success) {
        setRecords(res.data || []);
      } else {
        message.error(res.message || '加载消息失败');
      }
    } catch {
      message.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  }, [role, userId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const filteredRecords = useMemo(() => {
    if (actionType === 'all') return records;
    return records.filter(item => item.actionType === actionType);
  }, [records, actionType]);

  const markAsRead = async (record) => {
    if (record.read) return;
    try {
      const res = await messageService.markAsRead(record.id);
      if (res.success) {
        setRecords(prev => prev.map(item => (item.id === record.id ? { ...item, read: true } : item)));
      }
    } catch {
      message.error('标记已读失败');
    }
  };

  const deleteMessage = async (id) => {
    try {
      const res = await messageService.deleteMessage(id);
      if (res.success) {
        setRecords(prev => prev.filter(item => item.id !== id));
        message.success('已删除');
      } else {
        message.error(res.message || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '状态',
      dataIndex: 'read',
      key: 'read',
      width: 90,
      render: (read) => (read ? <Tag color="default">已读</Tag> : <Tag color="processing">未读</Tag>)
    },
    {
      title: '类型',
      dataIndex: 'actionType',
      key: 'actionType',
      width: 120,
      render: (value) => ACTION_TYPE_LABEL[value] || '系统消息'
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      render: (value) => <Text strong>{value}</Text>
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content'
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value) => (value ? new Date(value).toLocaleString() : '-')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          {!record.read && (
            <Button
              size="small"
              type="link"
              icon={<CheckOutlined />}
              onClick={() => markAsRead(record)}
            >
              已读
            </Button>
          )}
          <Popconfirm
            title="确定删除该消息？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => deleteMessage(record.id)}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="hotel-management">
      <div className="page-header">
        <h1 className="page-title">消息中心</h1>
        <p className="page-subtitle">查看酒店审核、上下线、删除与订单通知</p>
      </div>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Select
            value={actionType}
            onChange={setActionType}
            style={{ width: 220 }}
            options={[
              { label: '全部类型', value: 'all' },
              { label: '审核通过', value: 'audit_approve' },
              { label: '审核拒绝', value: 'audit_reject' },
              { label: '酒店上线', value: 'hotel_online' },
              { label: '酒店下线', value: 'hotel_offline' },
              { label: '酒店删除', value: 'hotel_delete' },
              { label: '新订单', value: 'booking_created' }
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={loadMessages}>
            刷新
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredRecords}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            pageSizeOptions: ['10', '20', '50'],
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (current, pageSize) => setPagination({ current, pageSize })
          }}
        />
      </Card>
    </div>
  );
}

export default MerchantMessageCenter;
