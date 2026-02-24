/**
 * 管理员酒店管理页面
 *
 * 功能：
 * 1. 管理所有已审核通过的酒店
 * 2. 上线/下线酒店
 * 3. 编辑酒店信息
 *
 * @component
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Popconfirm,
  Input,
  Row,
  Col
} from 'antd';
import {
  StopOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';
import { hotelService, userService } from '../services/api';
import { getHotelRatingLabel } from '../utils/hotelRating';
import { resolveUserIdentity } from '../utils/userIdentity';
import './HotelManagement.css';

function AdminHotelManagement() {
  const [hotels, setHotels] = useState([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [currentUser, setCurrentUser] = useState(null);
  const [showOnline, setShowOnline] = useState(true);
  const [showOffline, setShowOffline] = useState(true);

  useEffect(() => {
    const { user } = resolveUserIdentity();
    setCurrentUser(user || null);
    loadUsers();
  }, []);

  useEffect(() => {
    loadHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchKeyword, showOnline, showOffline]);

  const loadUsers = async () => {
    try {
      const response = await userService.getUsers();
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch { /* ignore */ }
  };

  const loadHotels = async () => {
    if (!showOnline && !showOffline) {
      setHotels([]);
      setTotal(0);
      setSelectedRowKeys([]);
      return;
    }
    try {
      setLoading(true);
      const statusList = [];
      if (showOnline) statusList.push('approved');
      if (showOffline) statusList.push('offline');
      statusList.push('pending_merchant_confirm');
      const params = {
        status: statusList.join(','),
        page: pagination.current,
        limit: pagination.pageSize,
        brief: 'true'
      };
      if (searchKeyword && searchKeyword.trim()) {
        params.keyword = searchKeyword.trim();
      }
      const response = await hotelService.getHotels(params);
      if (response.data.success) {
        setHotels(response.data.data);
        setTotal(response.data.total || response.data.count || 0);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'approved' ? 'offline' : 'approved';
      const adminInfo = currentUser ? { id: currentUser.id, username: currentUser.name || currentUser.username } : {};
      const response = await hotelService.updateHotelStatus(id, newStatus, adminInfo);
      if (response.data.success) {
        message.success(newStatus === 'approved' ? '酒店已上线' : '酒店已下线');
        loadHotels();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDeleteHotel = async (id) => {
    try {
      const response = await hotelService.deleteHotel(id, { role: 'admin' });
      if (response.data.success) {
        message.success('酒店已删除');
        loadHotels();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleBatchOffline = async () => {
    const ids = selectedRowKeys.filter(id => {
      const h = visibleHotels.find(x => x.id === id);
      return h && h.status === 'approved';
    });
    if (ids.length === 0) {
      message.warning('请选择已上线的酒店进行批量下线');
      return;
    }
    try {
      setLoading(true);
      await hotelService.batchUpdateHotelStatus(ids, 'offline');
      message.success(`已批量下线 ${ids.length} 家酒店`);
      setSelectedRowKeys([]);
      loadHotels();
    } catch (e) {
      message.error(e.response?.data?.message || '批量下线失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchOnline = async () => {
    const ids = selectedRowKeys.filter(id => {
      const h = visibleHotels.find(x => x.id === id);
      return h && h.status === 'offline';
    });
    if (ids.length === 0) {
      message.warning('请选择已下线的酒店进行批量上线');
      return;
    }
    try {
      setLoading(true);
      await hotelService.batchUpdateHotelStatus(ids, 'approved');
      message.success(`已批量上线 ${ids.length} 家酒店`);
      setSelectedRowKeys([]);
      loadHotels();
    } catch (e) {
      message.error(e.response?.data?.message || '批量上线失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    const ids = selectedRowKeys.filter(id => {
      const h = visibleHotels.find(x => x.id === id);
      return h && h.status === 'offline';
    });
    if (ids.length === 0) {
      message.warning('请选择已下线的酒店进行批量删除');
      return;
    }
    try {
      setLoading(true);
      await hotelService.batchDeleteHotels(ids);
      message.success(`已批量删除 ${ids.length} 家酒店`);
      setSelectedRowKeys([]);
      loadHotels();
    } catch (e) {
      message.error(e.response?.data?.message || '批量删除失败');
    } finally {
      setLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys)
  };

  const visibleHotels = hotels;

  const getStatusTag = (status) => {
    const statusMap = {
      'approved': { color: 'success', text: '已上线' },
      'offline': { color: 'default', text: '已下线' },
      'pending_merchant_confirm': { color: 'processing', text: '待商户确认' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '酒店名称',
      width: 140,
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
      render: (rating) => getHotelRatingLabel(rating)
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '未设置'
    },
    {
      title: '所属用户',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) => {
        if (!userId) return '-';
        const user = users.find(u => u.id === userId);
        return user ? user.username : '未知';
      }
    },
    {
      title: '所属人姓名',
      dataIndex: 'userId',
      key: 'ownerName',
      render: (userId) => {
        if (!userId) return '默认用户';
        const user = users.find(u => u.id === userId);
        return user ? user.name : '未知';
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'approved' ? (
            <Popconfirm
              title="确定下线"
              description="下线后用户将无法预订，是否继续？"
              onConfirm={() => handleToggleStatus(record.id, record.status)}
              okText="确定"
              cancelText="取消"
            >
              <Button danger icon={<StopOutlined />} size="small">下线</Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="确定上线"
              description="上线后用户可以预订该酒店，是否继续？"
              onConfirm={() => handleToggleStatus(record.id, record.status)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="primary" icon={<CheckCircleOutlined />} size="small">上线</Button>
            </Popconfirm>
          )}
          {record.status === 'offline' && (
            <Popconfirm
              title="确定删除"
              description="删除后不可恢复，是否继续？"
              onConfirm={() => handleDeleteHotel(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />} size="small">删除</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="hotel-management">
      <div className="page-header">
        <h1 className="page-title">酒店管理</h1>
        <p className="page-subtitle">管理所有已审核通过的酒店</p>
      </div>

      <Card>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }} align="middle" className="hotel-filter-toolbar">
          <Col>
            <Space.Compact className="hotel-search-compact">
              <Input
                placeholder="搜索酒店名、所属用户、所属人姓名（支持模糊匹配）"
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onPressEnter={() => { setSearchKeyword(searchInput); setPagination(prev => ({ ...prev, current: 1 })); }}
                allowClear
                onClear={() => { setSearchInput(''); setSearchKeyword(''); setPagination(prev => ({ ...prev, current: 1 })); }}
                style={{ width: 360 }}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => { setSearchKeyword(searchInput); setPagination(prev => ({ ...prev, current: 1 })); }}
              >
                搜索
              </Button>
            </Space.Compact>
          </Col>
          <Col flex="auto" className="hotel-status-toggle-wrap">
            <Space size="small">
              <Button
                className={`hotel-status-toggle-btn ${showOnline ? 'is-active' : 'is-inactive'}`}
                onClick={() => {
                  setShowOnline(prev => !prev);
                  setPagination(prev => ({ ...prev, current: 1 }));
                  setSelectedRowKeys([]);
                }}
              >
                上线酒店
              </Button>
              <Button
                className={`hotel-status-toggle-btn ${showOffline ? 'is-active' : 'is-inactive'}`}
                onClick={() => {
                  setShowOffline(prev => !prev);
                  setPagination(prev => ({ ...prev, current: 1 }));
                  setSelectedRowKeys([]);
                }}
              >
                下线酒店
              </Button>
            </Space>
          </Col>
          <Col flex="auto" />
          {selectedRowKeys.length > 0 && (
            <>
              <Col>
                <Popconfirm
                  title="确定批量下线所选酒店吗？"
                  description="下线后用户将无法预订"
                  onConfirm={handleBatchOffline}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button icon={<DownOutlined />}>
                    批量下线 ({selectedRowKeys.filter(id => visibleHotels.find(x => x.id === id)?.status === 'approved').length})
                  </Button>
                </Popconfirm>
              </Col>
              <Col>
                <Popconfirm
                  title="确定批量上线所选酒店吗？"
                  description="上线后用户可以预订"
                  onConfirm={handleBatchOnline}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="primary" icon={<UpOutlined />}>
                    批量上线 ({selectedRowKeys.filter(id => visibleHotels.find(x => x.id === id)?.status === 'offline').length})
                  </Button>
                </Popconfirm>
              </Col>
              <Col>
                <Popconfirm
                  title="确定批量删除所选酒店吗？"
                  description="仅已下线的酒店可删除，删除后不可恢复"
                  onConfirm={handleBatchDelete}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    批量删除 ({selectedRowKeys.filter(id => visibleHotels.find(x => x.id === id)?.status === 'offline').length})
                  </Button>
                </Popconfirm>
              </Col>
            </>
          )}
        </Row>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={visibleHotels}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
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

export default AdminHotelManagement;
