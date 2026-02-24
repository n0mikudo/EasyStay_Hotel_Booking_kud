import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Dropdown, List, Typography, Button, Space, message, Tooltip, Tag } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, ClockCircleOutlined, RightOutlined } from '@ant-design/icons';
import messageService from '../services/messageService';
import { resolveUserIdentity } from '../utils/userIdentity';

const { Text, Paragraph } = Typography;

const NotificationDropdown = ({ user }) => {
  const navigate = useNavigate();
  const identity = resolveUserIdentity(user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const loadNotifications = async () => {
    if (!identity.user) return;
    if (identity.role === 'merchant' && !identity.userId) {
      setNotifications([]);
      message.warning('登录信息异常，请重新登录');
      return;
    }
    setLoading(true);
    try {
      const params = { role: identity.role };
      if (identity.role === 'admin') params.adminId = identity.userId;
      else params.userId = identity.userId;
      const res = await messageService.getMessages(params);
      if (res.success) setNotifications(res.data || []);
    } catch {
      message.error('加载通知失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (notification) => {
    if (!notification.read) {
      try {
        const adminId = identity.role === 'admin' ? identity.userId : null;
        await messageService.markAsRead(notification.id, adminId);
        setNotifications(prev =>
          prev.map(m => m.id === notification.id ? { ...m, read: true } : m)
        );
      } catch {}
    }
    if (notification.linkTo) {
      setVisible(false);
      navigate(notification.linkTo);
    }
  };

  const handleMarkAsRead = async (messageId, e) => {
    e?.stopPropagation();
    try {
      const adminId = identity.role === 'admin' ? identity.userId : null;
      await messageService.markAsRead(messageId, adminId);
      setNotifications(prev =>
        prev.map(m => m.id === messageId ? { ...m, read: true } : m)
      );
      message.success('已标记为已读');
    } catch {
      message.error('操作失败');
    }
  };

  const handleDeleteMessage = async (messageId, e) => {
    e?.stopPropagation();
    try {
      await messageService.deleteMessage(messageId);
      setNotifications(prev => prev.filter(m => m.id !== messageId));
      message.success('已删除');
    } catch {
      message.error('操作失败');
    }
  };

  const handleOpenChange = (open) => {
    setVisible(open);
    if (open) loadNotifications();
  };

  const getItemStyle = (n) => {
    let bg = 'transparent';
    if (!n.read) bg = '#fff7e6';
    else if (n.processed) bg = '#fafafa';
    return { padding: '12px 16px', borderBottom: '1px solid #f0f0f0', backgroundColor: bg };
  };

  const renderMenu = () => {
    if (loading) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <ClockCircleOutlined spin /> 加载中...
        </div>
      );
    }
    if (notifications.length === 0) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Text type="secondary">暂无通知</Text>
        </div>
      );
    }
    return (
      <List
        style={{ width: 420, maxHeight: 520, overflow: 'auto' }}
        dataSource={notifications}
        renderItem={(n) => (
          <List.Item
            key={n.id}
            style={getItemStyle(n)}
            onClick={() => handleViewMessage(n)}
            className="notification-item"
          >
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                {!n.read && <span className="unread-dot" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong>{n.title}</Text>
                  {n.needProcess && !n.processed && n.actionType === 'hotel_add' && (
                    <Tooltip title="新酒店待审核：在审核管理执行通过/拒绝后自动标记">
                      <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>待处理</Tag>
                    </Tooltip>
                  )}
                  {n.processedBy && (
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                      已由 {n.processedBy} 处理{n.processedAt ? ` · ${new Date(n.processedAt).toLocaleString()}` : ''}
                    </Text>
                  )}
                  <Paragraph ellipsis={{ rows: 2 }} style={{ margin: '4px 0 0', fontSize: 13 }}>
                    {n.content}
                  </Paragraph>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </Text>
                </div>
                {n.linkTo && <RightOutlined style={{ color: '#bfbfbf' }} />}
              </div>
              <Space size="small" style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                {!n.read && (
                  <Button size="small" type="link" icon={<CheckOutlined />} onClick={(e) => handleMarkAsRead(n.id, e)}>
                    已读
                  </Button>
                )}
                <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={(e) => handleDeleteMessage(n.id, e)}>
                  删除
                </Button>
              </Space>
            </div>
          </List.Item>
        )}
      />
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Dropdown
      dropdownRender={() => (
        <div className="notification-dropdown" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }}>
          {renderMenu()}
        </div>
      )}
      trigger={['click']}
      open={visible}
      onOpenChange={handleOpenChange}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button type="text" icon={<BellOutlined />} style={{ fontSize: 16 }} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;