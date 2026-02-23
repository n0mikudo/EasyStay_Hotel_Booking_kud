import React, { useMemo } from 'react';
import { Popup, SwipeAction, Dialog } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { useClientAuth } from '../contexts/ClientAuthContext';
import './ChatHistoryDrawer.css';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const oneDay = 86400000;

  if (diff < oneDay && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 2 * oneDay && d.getDate() === now.getDate() - 1) {
    return '昨天';
  }
  if (diff < 7 * oneDay) {
    return `${Math.floor(diff / oneDay)}天前`;
  }
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function groupByDate(sessions) {
  const groups = { today: [], yesterday: [], earlier: [] };
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;

  sessions.forEach(s => {
    const t = new Date(s.updated_at || s.created_at).getTime();
    if (t >= todayStart) groups.today.push(s);
    else if (t >= yesterdayStart) groups.yesterday.push(s);
    else groups.earlier.push(s);
  });

  return groups;
}

function ChatHistoryDrawer({ visible, onClose, sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession }) {
  const { user } = useClientAuth();

  const groups = useMemo(() => groupByDate(sessions || []), [sessions]);

  const handleDelete = async (sessionId) => {
    const confirmed = await Dialog.confirm({
      content: '确定删除这个对话吗？',
      confirmText: '删除',
      cancelText: '取消',
    });
    if (confirmed) {
      onDeleteSession?.(sessionId);
    }
  };

  const renderSessionItem = (session) => {
    const isActive = session.id === activeSessionId;
    return (
      <SwipeAction
        key={session.id}
        rightActions={[{
          key: 'delete',
          text: '删除',
          color: 'danger',
          onClick: () => handleDelete(session.id),
        }]}
      >
        <div
          className={`drawer-session-item ${isActive ? 'active' : ''}`}
          onClick={() => { onSelectSession?.(session.id); onClose?.(); }}
        >
          <div className="drawer-session-title">{session.title || '新对话'}</div>
          <div className="drawer-session-meta">
            <span className="drawer-session-time">{formatTime(session.updated_at)}</span>
            {session.mode === 'deep' && <span className="drawer-session-mode">深度</span>}
          </div>
        </div>
      </SwipeAction>
    );
  };

  const renderGroup = (label, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="drawer-group">
        <div className="drawer-group-label">{label}</div>
        {items.map(renderSessionItem)}
      </div>
    );
  };

  const maskedPhone = user?.phone
    ? user.phone.slice(0, 3) + '****' + user.phone.slice(7)
    : '';

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="left"
      bodyClassName="chat-drawer-body"
      destroyOnClose={false}
    >
      <div className="chat-drawer">
        <div className="drawer-header">
          <div className="drawer-user-info">
            <div className="drawer-avatar">
              {user?.nickname?.charAt(0) || '游'}
            </div>
            <div className="drawer-user-text">
              <div className="drawer-nickname">{user?.nickname || '未登录'}</div>
              {maskedPhone && <div className="drawer-phone">{maskedPhone}</div>}
            </div>
          </div>
        </div>

        <div
          className="drawer-new-chat-btn"
          onClick={() => { onNewChat?.(); onClose?.(); }}
        >
          <AddOutline /> <span>新建对话</span>
        </div>

        <div className="drawer-divider" />

        <div className="drawer-sessions-list">
          {(!sessions || sessions.length === 0) ? (
            <div className="drawer-empty">暂无对话记录</div>
          ) : (
            <>
              {renderGroup('今天', groups.today)}
              {renderGroup('昨天', groups.yesterday)}
              {renderGroup('更早', groups.earlier)}
            </>
          )}
        </div>
      </div>
    </Popup>
  );
}

export default ChatHistoryDrawer;
