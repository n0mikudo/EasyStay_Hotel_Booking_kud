/**
 * 管理员消息中心
 *
 * 功能：
 * 1. 展示所有需处理消息（待处理/已处理）
 * 2. 显示处理人、处理时间（系统自动记录）
 * 3. 快捷跳转至审核管理
 *
 * @component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  List,
  Tag,
  Empty,
  Spin,
  Typography,
  Button,
  Popconfirm,
  message
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  RightOutlined,
  UserOutlined,
  AuditOutlined,
  ReloadOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import messageService from '../services/messageService';
import { resolveUserIdentity } from '../utils/userIdentity';
import './AdminMessageCenter.css';

const { Text } = Typography;

const actionTypeMap = {
  hotel_add: { text: '新酒店待审核', color: 'blue' },
  hotel_approved: { text: '审核通过', color: 'green' },
  hotel_rejected: { text: '审核拒绝', color: 'red' },
  hotel_edit: { text: '酒店信息修改', color: 'orange' },
  hotel_edit_inform: { text: '信息变更', color: 'default' }
};

function AdminMessageCenter({ user }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const { user: storedUser } = resolveUserIdentity();
  const effectiveUser = user || storedUser || {};

  const loadMessages = useCallback(async () => {
    if (!effectiveUser?.id || effectiveUser?.role !== 'admin') return;
    setLoading(true);
    try {
      const res = await messageService.getMessages({ role: 'admin', adminId: effectiveUser.id });
      if (res.success) setMessages(res.data || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveUser?.id, effectiveUser?.role]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // hotel_add：待审核；hotel_approved/hotel_rejected：已处理
  const needProcessMessages = messages.filter(m => m.needProcess &&
    (m.actionType === 'hotel_add' || m.actionType === 'hotel_approved' || m.actionType === 'hotel_rejected'));
  const pendingMessages = needProcessMessages.filter(m => !m.processed);
  const processedMessages = needProcessMessages.filter(m => m.processed);

  const displayList = activeTab === 'pending' ? pendingMessages : activeTab === 'processed' ? processedMessages : needProcessMessages;

  const emptyDescriptions = {
    pending: '暂无待处理消息',
    processed: '暂无已处理记录',
    all: '暂无消息'
  };

  const handleGoToAudit = (msg) => {
    if (msg.linkTo) {
      navigate(msg.linkTo);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      const res = await messageService.deleteMessage(msgId);
      if (res.success) {
        message.success('消息已删除');
        loadMessages();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败，请稍后重试');
    }
  };

  const renderMessageCard = (msg) => (
    <Card
      key={msg.id}
      className={`message-card ${msg.processed ? 'message-card-processed' : 'message-card-pending'}`}
      size="small"
      extra={
        <Popconfirm
          title="确定要删除这条消息吗？"
          onConfirm={() => handleDeleteMessage(msg.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
          />
        </Popconfirm>
      }
    >
      <div className="message-card-header">
        <Text strong>{msg.title}</Text>
        {actionTypeMap[msg.actionType] && (
          <Tag color={actionTypeMap[msg.actionType].color}>{actionTypeMap[msg.actionType].text}</Tag>
        )}
      </div>
      <Text type="secondary" className="message-content">{msg.content}</Text>
      <div className="message-meta">
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(msg.createdAt).toLocaleString()}
        </Text>
        {msg.processed && (
          <div className="message-processed-info">
            <UserOutlined style={{ marginRight: 4 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              处理人：{msg.processedBy}
              {msg.processedAt && ` · ${new Date(msg.processedAt).toLocaleString()}`}
            </Text>
          </div>
        )}
      </div>
      {!msg.processed && msg.linkTo && (
        <Button
          type="primary"
          size="small"
          icon={<AuditOutlined />}
          onClick={() => handleGoToAudit(msg)}
          className="message-action-btn"
        >
          前往审核 <RightOutlined />
        </Button>
      )}
    </Card>
  );

  return (
    <div className="admin-message-center">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">消息中心</h1>
          <p className="page-subtitle">仅「新酒店待审核」需处理，在审核管理执行通过/拒绝后自动标记；商户编辑酒店仅作告知，无需审核</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadMessages} loading={loading}>刷新</Button>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane
            key="pending"
            tab={
              <span>
                <ClockCircleOutlined /> 待处理
                {pendingMessages.length > 0 && (
                  <Tag color="red" style={{ marginLeft: 6 }}>{pendingMessages.length}</Tag>
                )}
              </span>
            }
          />
          <Tabs.TabPane key="processed" tab={<span><CheckCircleOutlined /> 已处理</span>} />
          <Tabs.TabPane key="all" tab="全部" />
        </Tabs>
        {loading ? (
          <div className="message-loading">
            <Spin size="large" />
          </div>
        ) : displayList.length === 0 ? (
          <Empty
            description={emptyDescriptions[activeTab] || '暂无消息'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={displayList}
            renderItem={renderMessageCard}
            className="message-list"
          />
        )}
      </Card>
    </div>
  );
}

export default AdminMessageCenter;
