/**
 * 用户管理 - 独立主界面
 *
 * 功能：
 * 1. 用户列表（搜索、筛选）
 * 2. 是否有房、最后有房时间
 * 3. 批量删除、单删
 *
 * @component
 */

import React, { useState, useEffect } from 'react';
import { Card, Input, Button, message, Table, Tag, Space, Popconfirm, Checkbox } from 'antd';
import { UserOutlined, DeleteOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { userService, systemService } from '../services/api';

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [hotelZeroOnly, setHotelZeroOnly] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async (overrides = {}) => {
    try {
      setLoading(true);
      const q = overrides.q !== undefined ? overrides.q : userSearch;
      const hz = overrides.hotelZero !== undefined ? overrides.hotelZero : hotelZeroOnly;
      const params = {};
      if (q && String(q).trim()) params.q = String(q).trim();
      if (hz) params.hotelZero = '1';
      const response = await userService.getUsers(params);
      if (response.data.success) {
        let sortedUsers = [...response.data.data].sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          return 0;
        });
        setUsers(sortedUsers);
      }
    } catch (error) {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的用户');
      return;
    }
    const deletable = users.filter(u => selectedRowKeys.includes(u.id) && u.role !== 'admin' && (u.hotelCount || 0) === 0);
    const ids = deletable.map(u => u.id);
    if (ids.length === 0) {
      message.warning('所选用户中无符合删除条件的用户');
      return;
    }
    try {
      setLoading(true);
      const res = await userService.batchDeleteUsers(ids);
      if (res.data.success) {
        message.success(res.data.message || '批量删除成功');
        setSelectedRowKeys([]);
        loadUsers();
        loadLogs();
      } else {
        message.error(res.data.message || '批量删除失败');
      }
    } catch (e) {
      message.error(e.response?.data?.message || '批量删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      const response = await userService.deleteUser(userId);
      if (response.data.success) {
        message.success('用户删除成功');
        loadUsers();
        loadLogs();
      } else {
        message.error(response.data.message || '删除失败');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      await systemService.getLogs(80);
    } catch {
      // ignore
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: (record) => ({ disabled: record.role === 'admin' })
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => getRoleTag(role)
    },
    {
      title: '名下酒店数',
      dataIndex: 'hotelCount',
      key: 'hotelCount',
      width: 100,
      render: (count, record) =>
        record.role === 'merchant' ? (
          <span style={(count || 0) === 0 ? { color: '#fa8c16', fontWeight: 500 } : {}}>{count ?? 0}</span>
        ) : '-'
    },
    {
      title: '是否有房',
      key: 'hasRoom',
      width: 90,
      align: 'center',
      render: (_, record) => {
        if (record.role !== 'merchant') return '-';
        const hasRoom = (record.hotelCount || 0) > 0;
        return hasRoom ? (
          <CheckCircleOutlined style={{ color: '#000', fontSize: 18 }} title="有房" />
        ) : (
          <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} title="无房" />
        );
      }
    },
    {
      title: '最后有房时间',
      dataIndex: 'lastHotelDeletedAt',
      key: 'lastHotelDeletedAt',
      width: 130,
      render: (t, record) => {
        if (record.role !== 'merchant') return '-';
        const hasRoom = (record.hotelCount || 0) > 0;
        if (hasRoom) return '-';
        return t ? new Date(t).toLocaleDateString() : '-';
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {record.role === 'admin' ? (
            <Button size="small" danger disabled>删除</Button>
          ) : (
            <Popconfirm
              title="确定删除该用户吗？"
              description="删除后无法恢复"
              onConfirm={() => handleDeleteUser(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="user-management">
      <div className="page-header">
        <h1 className="page-title">
          <UserOutlined style={{ marginRight: 8 }} />
          用户管理
        </h1>
        <p className="page-subtitle">管理平台用户，支持搜索与筛选</p>
      </div>

      <Card className="content-card fade-in">
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Input
            placeholder="搜索用户名/姓名（模糊匹配）"
            prefix={<SearchOutlined />}
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            onPressEnter={loadUsers}
            style={{ width: 220 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={loadUsers}>
            搜索
          </Button>
          <Checkbox
            checked={hotelZeroOnly}
            onChange={(e) => {
              const v = e.target.checked;
              setHotelZeroOnly(v);
              loadUsers({ hotelZero: v });
            }}
          >
            仅显示名下酒店数为0的商户
          </Checkbox>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title="确定批量删除所选用户吗？"
              description="仅会删除名下无酒店的商户，管理员无法删除"
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />}>
                批量删除 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
        </div>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={users}
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
    </div>
  );
}

export default AdminUserManagement;
