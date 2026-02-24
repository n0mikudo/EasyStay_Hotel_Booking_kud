/**
 * 审核列表页面组件
 *
 * 功能：
 * 1. 展示待审核酒店列表
 * 2. 支持搜索和筛选
 * 3. 审核操作（通过/拒绝）
 * 4. 查看酒店详情
 * 5. 批量操作（可选）
 *
 * @component
 */

import React, { useEffect, useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Popconfirm,
  message,
  Card,
  Input,
  Badge,
  Empty,
  Tooltip,
  Modal,
  Descriptions,
  Image
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { hotelService } from '../services/api';
import './AuditList.css';

function AuditList() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        console.error('解析用户信息失败', e);
      }
    }
  }, []);

  // 组件挂载时获取数据
  useEffect(() => {
    fetchHotels();
  }, []);

  /**
   * 获取待审核酒店列表
   */
  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await hotelService.getHotels({ status: 'pending' });
      if (response.data.success) {
        setHotels(response.data.data);
      }
    } catch (error) {
      message.error('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理审核通过
   * @param {string} id - 酒店ID
   */
  const handleApprove = async (id) => {
    try {
      const adminInfo = currentUser ? { id: currentUser.id, username: currentUser.name || currentUser.username } : {};
      const response = await hotelService.updateHotelStatus(id, 'approved', adminInfo);
      if (response.data.success) {
        message.success('✅ 审核通过，酒店已上线');
        fetchHotels();
      } else {
        message.error(response.data.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败，请检查网络连接');
    }
  };

  /**
   * 处理审核拒绝
   * @param {string} id - 酒店ID
   */
  const handleReject = async (id, rejectReason) => {
    try {
      const adminInfo = currentUser ? { id: currentUser.id, username: currentUser.name || currentUser.username } : {};
      const response = await hotelService.updateHotelStatus(id, 'rejected', { ...adminInfo, rejectReason });
      if (response.data.success) {
        message.success('❌ 已拒绝该酒店');
        fetchHotels();
      } else {
        message.error(response.data.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败，请检查网络连接');
    }
  };

  const showRejectModal = (id) => {
    Modal.confirm({
      title: '拒绝酒店',
      content: (
        <Input.TextArea
          id="rejectReasonInput"
          placeholder="请输入拒绝原因（可选）"
          rows={3}
          style={{ marginTop: 8 }}
        />
      ),
      okText: '确认拒绝',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const reason = document.getElementById('rejectReasonInput')?.value || '';
        return handleReject(id, reason);
      }
    });
  };

  /**
   * 查看酒店详情
   * @param {Object} hotel - 酒店数据
   */
  const handleViewDetail = (hotel) => {
    setSelectedHotel(hotel);
    setDetailModalVisible(true);
  };

  /**
   * 过滤酒店数据
   */
  const filteredHotels = hotels.filter(hotel =>
    !searchKeyword ||
    hotel.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    hotel.city.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    hotel.address.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (text, record) => (
        <Tooltip title={text}>
          <span className="hotel-name">{text}</span>
        </Tooltip>
      )
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 100,
      render: (city) => <Tag color="blue">{city}</Tag>
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 250,
      ellipsis: true
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => (
        <span className="price-tag">¥{price}/晚</span>
      )
    },
    {
      title: '设施',
      dataIndex: 'amenities',
      key: 'amenities',
      width: 200,
      render: (amenities) => (
        <div className="amenities-cell">
          {amenities && amenities.length > 0 ? (
            <>
              {amenities.slice(0, 3).map((item, index) => (
                <Tag key={index} color="cyan" className="amenity-tag">
                  {item}
                </Tag>
              ))}
              {amenities.length > 3 && (
                <Tooltip title={amenities.slice(3).join(', ')}>
                  <Tag color="default">+{amenities.length - 3}</Tag>
                </Tooltip>
              )}
            </>
          ) : (
            <span className="empty-text">暂无</span>
          )}
        </div>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => (
        <span className="time-text">
          <ClockCircleOutlined className="time-icon" />
          {new Date(date).toLocaleString('zh-CN')}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" className="action-btns">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Popconfirm
            title="确认通过该酒店？"
            description="通过后酒店将在移动端展示"
            onConfirm={() => handleApprove(record.id)}
            okText="确认"
            cancelText="取消"
            okButtonProps={{ type: 'primary' }}
          >
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              className="approve-btn"
            >
              通过
            </Button>
          </Popconfirm>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            className="reject-btn"
            onClick={() => showRejectModal(record.id)}
          >
            拒绝
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="audit-list-page">
      {/* 页面标题 */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">✅ 审核管理</h1>
            <p className="page-subtitle">
              待审核酒店：<Badge count={hotels.length} showZero color="#fa8c16" />
            </p>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchHotels}
            loading={loading}
          >
            刷新数据
          </Button>
        </div>
      </div>

      {/* 内容卡片 */}
      <Card className="content-card">
        {/* 搜索栏 */}
        <div className="search-bar">
          <Input.Search
            placeholder="搜索酒店名称、城市或地址"
            allowClear
            onSearch={setSearchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 350 }}
            prefix={<SearchOutlined />}
            className="search-input"
          />
        </div>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={filteredHotels}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize })
          }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                description="暂无待审核的酒店"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
          className="audit-table"
        />
      </Card>

      {/* 酒店详情弹窗 */}
      <Modal
        title="🏨 酒店详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button key="reject" danger onClick={() => {
            setDetailModalVisible(false);
            showRejectModal(selectedHotel?.id);
          }}>拒绝</Button>,
          <Popconfirm
            key="approve"
            title="确认通过该酒店？"
            onConfirm={() => {
              handleApprove(selectedHotel?.id);
              setDetailModalVisible(false);
            }}
          >
            <Button type="primary">通过</Button>
          </Popconfirm>
        ]}
        width={700}
        className="detail-modal"
      >
        {selectedHotel && (
          <div className="hotel-detail">
            {/* 图片展示 */}
            {selectedHotel.images && selectedHotel.images.length > 0 && (
              <div className="detail-images">
                <Image.PreviewGroup>
                  {selectedHotel.images.map((img, index) => (
                    <Image
                      key={index}
                      src={img}
                      alt={`酒店图片 ${index + 1}`}
                      width={120}
                      height={80}
                      className="detail-image"
                    />
                  ))}
                </Image.PreviewGroup>
              </div>
            )}

            <Descriptions bordered column={2} className="detail-descriptions">
              <Descriptions.Item label="酒店名称" span={2}>
                {selectedHotel.name}
              </Descriptions.Item>
              <Descriptions.Item label="所在城市">
                {selectedHotel.city}
              </Descriptions.Item>
              <Descriptions.Item label="价格">
                <span className="detail-price">¥{selectedHotel.price}/晚</span>
              </Descriptions.Item>
              <Descriptions.Item label="详细地址" span={2}>
                {selectedHotel.address}
              </Descriptions.Item>
              <Descriptions.Item label="酒店设施" span={2}>
                <div className="detail-amenities">
                  {selectedHotel.amenities?.map((item, index) => (
                    <Tag key={index} color="blue">{item}</Tag>
                  ))}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="酒店介绍" span={2}>
                <div className="detail-description">
                  {selectedHotel.description}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {new Date(selectedHotel.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="酒店ID">
                {selectedHotel.id}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AuditList;
