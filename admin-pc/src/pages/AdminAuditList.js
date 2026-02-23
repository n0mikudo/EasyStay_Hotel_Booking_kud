import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Modal,
  Descriptions,
  Input,
  Select,
  Row,
  Col,
  Popconfirm
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { hotelService, userService } from '../services/api';
import './AuditList.css';

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' }
];

const SEARCH_FIELDS = [
  { value: 'name', label: '酒店名称' },
  { value: 'owner', label: '酒店所属人' },
  { value: 'auditBy', label: '审核管理员' },
  { value: 'city', label: '所在城市' }
];

function AdminAuditList({ user }) {
  const [hotels, setHotels] = useState([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectHotelId, setRejectHotelId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadHotels = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        excludeAuditArchived: 'true',
        brief: 'true'
      };
      if (statusFilter) params.status = statusFilter;
      if (searchValue && searchValue.trim()) {
        params.searchType = searchType;
        params.searchValue = searchValue.trim();
      }
      const response = await hotelService.getHotels(params);
      if (response.data.success) {
        setHotels(response.data.data);
        setTotal(response.data.total || response.data.count || 0);
      }
    } catch (error) {
      message.error('加载酒店列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, statusFilter, searchType, searchValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  const loadUsers = async () => {
    try {
      const response = await userService.getUsers();
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch { /* ignore */ }
  };

  const handleAudit = async (id, status, reason = '') => {
    try {
      const effectiveUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      const adminInfo = { id: effectiveUser.id, username: effectiveUser.name || effectiveUser.username };
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

  const handleDismiss = async (id) => {
    try {
      const response = await hotelService.auditDismiss(id);
      if (response.data.success) {
        message.success('已从审核列表移除');
        setSelectedRowKeys(prev => prev.filter(k => k !== id));
        loadHotels();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleBatchDismiss = async () => {
    const ids = selectedRowKeys.filter(id => {
      const h = hotels.find(x => x.id === id);
      return h && h.status !== 'pending';
    });
    if (ids.length === 0) {
      message.warning('请选择非待审核状态的条目进行删除');
      return;
    }
    try {
      setLoading(true);
      const response = await hotelService.batchAuditDismiss(ids);
      if (response.data.success) {
        message.success(response.data.message);
        setSelectedRowKeys([]);
        loadHotels();
      }
    } catch (error) {
      message.error('批量操作失败');
    } finally {
      setLoading(false);
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

  const handleSearch = () => {
    setSearchValue(searchInput);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending': { color: 'warning', text: '待审核' },
      'approved': { color: 'success', text: '已通过' },
      'rejected': { color: 'error', text: '已拒绝' },
      'offline': { color: 'default', text: '已下线' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getAuditAdmin = (record) => {
    if (record.status === 'pending') return '-';
    return record.auditBy || '系统管理员';
  };

  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 100
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 90,
      render: (price) => price != null ? `¥${price}起` : '-'
    },
    {
      title: '星级',
      dataIndex: 'rating',
      key: 'rating',
      width: 80,
      render: (rating) => rating ? '★'.repeat(rating) : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => getStatusTag(status)
    },
    {
      title: '审核管理员',
      key: 'auditBy',
      width: 120,
      render: (_, record) => {
        const admin = getAuditAdmin(record);
        return admin === '-' ? <span style={{ color: '#bfbfbf' }}>-</span> : admin;
      }
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} size="small" onClick={() => showDetail(record)}>
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
          {record.status !== 'pending' && (
            <Popconfirm
              title="确定移除此审核条目？"
              description="仅从审核列表中移除，不会删除酒店信息"
              onConfirm={() => handleDismiss(record.id)}
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys)
  };

  const batchDismissCount = selectedRowKeys.filter(id => {
    const h = hotels.find(x => x.id === id);
    return h && h.status !== 'pending';
  }).length;

  return (
    <div className="audit-list">
      <div className="page-header">
        <h1 className="page-title">酒店审核</h1>
        <p className="page-subtitle">审核与跟踪商户提交的酒店</p>
      </div>

      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="middle">
          <Col>
            <Select
              value={statusFilter}
              onChange={handleStatusChange}
              style={{ width: 130 }}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Input.Group compact>
              <Select
                value={searchType}
                onChange={setSearchType}
                style={{ width: 130 }}
                options={SEARCH_FIELDS}
              />
              <Input.Search
                placeholder="输入关键词搜索"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onSearch={handleSearch}
                onClear={() => { setSearchInput(''); setSearchValue(''); setPagination(prev => ({ ...prev, current: 1 })); }}
                allowClear
                style={{ width: 260 }}
                enterButton={<SearchOutlined />}
              />
            </Input.Group>
          </Col>
          <Col flex="auto" />
          {selectedRowKeys.length > 0 && (
            <Col>
              <Popconfirm
                title={`确定批量移除 ${batchDismissCount} 条审核条目？`}
                description="待审核条目将被自动跳过，仅从审核列表移除，不会删除酒店"
                onConfirm={handleBatchDismiss}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />}>
                  批量删除 ({batchDismissCount})
                </Button>
              </Popconfirm>
            </Col>
          )}
        </Row>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={hotels}
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
          scroll={{ x: 1100 }}
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
            <Descriptions.Item label="酒店名称" span={2}>{selectedHotel.name}</Descriptions.Item>
            <Descriptions.Item label="城市">{selectedHotel.city}</Descriptions.Item>
            <Descriptions.Item label="价格">¥{selectedHotel.price}起/晚</Descriptions.Item>
            <Descriptions.Item label="星级">{selectedHotel.rating ? '★'.repeat(selectedHotel.rating) : '未设置'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selectedHotel.phone || '未设置'}</Descriptions.Item>
            <Descriptions.Item label="商户">{users.find(u => u.id === selectedHotel.userId)?.username || '-'}</Descriptions.Item>
            <Descriptions.Item label="商户姓名">{users.find(u => u.id === selectedHotel.userId)?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="审核管理员">{getAuditAdmin(selectedHotel)}</Descriptions.Item>
            <Descriptions.Item label="审核时间">
              {selectedHotel.auditAt ? new Date(selectedHotel.auditAt).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
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
