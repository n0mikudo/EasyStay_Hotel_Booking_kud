/**
 * 管理员系统设置页面
 *
 * 功能：
 * 1. 系统基本设置（持久化）
 * 2. 权限矩阵可视化
 * 3. 系统日志时间线
 *
 * @component
 */

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Switch, message, Table, Tag, Timeline } from 'antd';
import { SettingOutlined, LockOutlined, SaveOutlined, SafetyCertificateOutlined, CopyOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, HistoryOutlined } from '@ant-design/icons';
import { inviteCodeService, settingsService, systemService } from '../services/api';


const ACTION_LABELS = {
  GENERATE_INVITE_CODE: '生成邀请码',
  DELETE_USER: '删除用户',
  UPDATE_SETTINGS: '更新系统配置',
  LOGIN: '用户登录',
  REGISTER: '用户注册',
  SERVER_START: '服务启动'
};

function AdminSettings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadPermissions();
    loadLogs();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsService.getSettings();
      if (res.data.success && res.data.data) {
        form.setFieldsValue({
          systemName: res.data.data.systemName || '易宿酒店预订平台',
          systemDescription: res.data.data.systemDescription || '专业的酒店预订管理系统',
          enableRegistration: res.data.data.enableRegistration !== false,
          enableAudit: res.data.data.enableAudit !== false
        });
      }
    } catch {
      // 使用默认值
    }
  };

  const loadPermissions = async () => {
    try {
      const res = await systemService.getPermissions();
      if (res.data.success) setPermissions(res.data.data || []);
    } catch {
      setPermissions([]);
    }
  };

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await systemService.getLogs(80);
      if (res.data.success) setLogs(res.data.data || []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleGenerateInviteCode = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
      message.error('请先登录');
      return;
    }
    if (user.role !== 'admin') {
      message.error('仅管理员可生成邀请码');
      return;
    }
    try {
      setInviteCodeLoading(true);
      setNewInviteCode(null);
      const res = await inviteCodeService.create(user.id);
      if (res.data.success) {
        setNewInviteCode(res.data.data.code);
        message.success('邀请码已生成，请复制后发送给待注册的管理员');
        loadLogs();
      } else {
        message.error(res.data.message || '生成失败');
      }
    } catch (err) {
      let msg = err.response?.data?.message || err.response?.data?.error;
      if (!msg) {
        if (err.code === 'ECONNABORTED') msg = '请求超时';
        else if (err.code === 'ERR_NETWORK' || !err.response) msg = '无法连接后端，请确认 server 已启动（node app.js，端口 3000）';
        else msg = '生成失败';
      }
      message.error(msg);
    } finally {
      setInviteCodeLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (newInviteCode && navigator.clipboard) {
      navigator.clipboard.writeText(newInviteCode);
      message.success('已复制到剪贴板');
    }
  };

  const handleSubmit = async (values) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      setLoading(true);
      const res = await settingsService.updateSettings({
        ...values,
        adminUserId: user.id
      });
      if (res.data.success) {
        message.success('系统设置保存成功');
        loadLogs();
      } else {
        message.error(res.data.message || '保存失败');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const getRoleTag = (role) => {
    const roleMap = {
      'admin': { color: 'blue', text: '管理员' },
      'merchant': { color: 'green', text: '商户' }
    };
    const config = roleMap[role] || { color: 'default', text: role };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div className="settings">
      <div className="page-header">
        <h1 className="page-title">系统设置</h1>
        <p className="page-subtitle">管理系统配置和用户权限</p>
      </div>

      {/* 管理员邀请码 */}
      <Card
        title={
          <div className="flex gap-sm" style={{ alignItems: 'center' }}>
            <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
            <span>生成管理员邀请码</span>
          </div>
        }
        className="content-card fade-in"
      >
        <p style={{ color: '#595959', marginBottom: 16 }}>
          邀请码用于新管理员注册，每个邀请码仅可使用一次。生成后请妥善保管并发送给待注册的管理员。
        </p>
        <Button
          type="primary"
          icon={<SafetyCertificateOutlined />}
          loading={inviteCodeLoading}
          onClick={handleGenerateInviteCode}
        >
          生成邀请码
        </Button>
        {newInviteCode && (
          <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>新邀请码：</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input
                readOnly
                value={newInviteCode}
                style={{ fontFamily: 'monospace', maxWidth: 200 }}
              />
              <Button icon={<CopyOutlined />} onClick={copyInviteCode}>
                复制
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 系统基本设置 */}
      <Card
        title={
          <div className="flex gap-sm" style={{ alignItems: 'center' }}>
            <SettingOutlined style={{ color: '#1890ff' }} />
            <span>系统基本设置</span>
          </div>
        }
        className="content-card fade-in"
        style={{ marginTop: '24px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            systemName: '易宿酒店预订平台',
            systemDescription: '专业的酒店预订管理系统',
            enableRegistration: true,
            enableAudit: true
          }}
        >
          <Form.Item
            label="系统名称"
            name="systemName"
            rules={[{ required: true, message: '请输入系统名称' }]}
          >
            <Input placeholder="请输入系统名称" />
          </Form.Item>
          <Form.Item
            label="系统描述"
            name="systemDescription"
          >
            <Input.TextArea rows={3} placeholder="请输入系统描述" />
          </Form.Item>
          <Form.Item
            label="启用用户注册"
            name="enableRegistration"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="启用酒店审核"
            name="enableAudit"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={loading}
            >
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 权限矩阵 - RBAC 可视化 */}
      <Card
        title={
          <div className="flex gap-sm" style={{ alignItems: 'center' }}>
            <LockOutlined style={{ color: '#1890ff' }} />
            <span>权限矩阵</span>
            <Tag color="blue">RBAC</Tag>
          </div>
        }
        className="content-card fade-in"
        style={{ marginTop: '24px' }}
      >
        <p style={{ color: '#8c8c8c', marginBottom: 16 }}>
          管理员与商户的角色权限对照表，基于 RBAC 模型设计。
        </p>
        <Table
          dataSource={permissions}
          rowKey={(r, i) => `${r.module}-${r.permission}-${i}`}
          pagination={false}
          size="small"
          columns={[
            {
              title: '功能模块',
              dataIndex: 'module',
              key: 'module',
              width: 120,
              render: (v, r, i) => {
                const prev = permissions[i - 1];
                return prev && prev.module === v ? '' : <strong>{v}</strong>;
              }
            },
            {
              title: '权限项',
              dataIndex: 'permission',
              key: 'permission'
            },
            {
              title: '管理员',
              dataIndex: 'admin',
              key: 'admin',
              width: 90,
              align: 'center',
              render: (v) => v ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} /> : <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />
            },
            {
              title: '商户',
              dataIndex: 'merchant',
              key: 'merchant',
              width: 90,
              align: 'center',
              render: (v) => v ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} /> : <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />
            },
            {
              title: '说明',
              dataIndex: 'desc',
              key: 'desc',
              ellipsis: true,
              render: (v) => <span style={{ color: '#8c8c8c', fontSize: 12 }}>{v}</span>
            }
          ]}
        />
      </Card>

      {/* 系统日志 - 时间线展示 */}
      <Card
        title={
          <div className="flex gap-sm" style={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>
              <HistoryOutlined style={{ color: '#1890ff', marginRight: 8 }} />
              系统日志
            </span>
            <Button type="link" icon={<ReloadOutlined />} onClick={loadLogs} loading={logsLoading}>
              刷新
            </Button>
          </div>
        }
        className="content-card fade-in"
        style={{ marginTop: '24px' }}
      >
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>暂无日志</div>
          ) : (
            <Timeline
              items={logs.map((log, i) => ({
                color: i === 0 ? 'blue' : 'gray',
                children: (
                  <div key={log.id}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {ACTION_LABELS[log.action] || log.action}
                      {log.detail && <span style={{ color: '#8c8c8c', fontWeight: 400, marginLeft: 8 }}>{log.detail}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {log.userId} · {log.userRole} · {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                )
              }))}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

export default AdminSettings;
