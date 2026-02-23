/**
 * 酒店管理页面组件
 *
 * 功能：
 * 1. 展示所有酒店列表
 * 2. 支持搜索和筛选
 * 3. 编辑酒店信息
 * 4. 删除酒店
 * 5. 查看酒店详情
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
  Select,
  Modal,
  Form,
  InputNumber,
  Badge,
  Empty,
  Tooltip,
  Descriptions,
  Image,
  Row,
  Col
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { hotelService } from '../services/api';
import CascadingDatePicker from '../components/CascadingDatePicker';
import './HotelManagement.css';

const { Option } = Select;
const { TextArea } = Input;

/**
 * 预设设施选项
 */
const amenityOptions = [
  '免费WiFi', '免费停车', '游泳池', '健身房', '餐厅',
  '会议室', '24小时前台', '行李寄存', '洗衣服务',
  '空调', '电梯', '无障碍设施', '早餐', '商务中心', 'SPA', '接送服务'
];

function HotelManagement() {
  const [hotels, setHotels] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [editingHotel, setEditingHotel] = useState(null);
  const [viewingHotel, setViewingHotel] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize, searchKeyword, statusFilter]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        brief: 'true'
      };
      if (searchKeyword && searchKeyword.trim()) {
        params.keyword = searchKeyword.trim();
      }
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await hotelService.getHotels(params);
      if (response.data.success) {
        setHotels(response.data.data);
        setTotal(response.data.total || response.data.count || 0);
      }
    } catch (error) {
      message.error('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理删除酒店
   * @param {string} id - 酒店ID
   */
  const handleDelete = async (id) => {
    try {
      const response = await hotelService.deleteHotel(id);
      if (response.data.success) {
        message.success('🗑️ 删除成功');
        fetchHotels();
      } else {
        message.error(response.data.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败，请检查网络连接');
    }
  };

  /**
   * 处理编辑酒店
   * @param {Object} hotel - 酒店数据
   */
  const handleEdit = (hotel) => {
    setEditingHotel(hotel);
    form.setFieldsValue({
      ...hotel,
      images: hotel.images ? hotel.images.join(', ') : ''
    });
    setEditModalVisible(true);
  };

  /**
   * 处理编辑提交
   * @param {Object} values - 表单值
   */
  const handleEditSubmit = async (values) => {
    try {
      // 处理图片URL
      const images = values.images
        ? values.images.split(',').map(url => url.trim()).filter(url => url)
        : [];

      const data = {
        ...values,
        images
      };

      const response = await hotelService.updateHotel(editingHotel.id, data);
      if (response.data.success) {
        message.success('✅ 更新成功');
        setEditModalVisible(false);
        fetchHotels();
      } else {
        message.error(response.data.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败，请检查网络连接');
    }
  };

  /**
   * 查看酒店详情
   * @param {Object} hotel - 酒店数据
   */
  const handleViewDetail = (hotel) => {
    setViewingHotel(hotel);
    setDetailModalVisible(true);
  };

  /**
   * 获取状态标签
   * @param {string} status - 状态值
   * @returns {JSX.Element} 状态标签组件
   */
  const getStatusTag = (status) => {
    const statusMap = {
      'pending': { text: '待审核', color: 'orange' },
      'approved': { text: '已通过', color: 'green' },
      'rejected': { text: '已拒绝', color: 'red' }
    };
    const config = statusMap[status] || { text: status, color: 'default' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const filteredHotels = hotels;

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
      render: (text) => (
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
      render: (price) => <span className="price-tag">¥{price}/晚</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag
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
                <Tag key={index} color="cyan" className="amenity-tag">{item}</Tag>
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
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (date) => (
        <span className="time-text">{new Date(date).toLocaleString('zh-CN')}</span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
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
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该酒店？"
            description="删除后无法恢复，请谨慎操作"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="hotel-management-page">
      {/* 页面标题 */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">🏨 酒店管理</h1>
            <p className="page-subtitle">
              共管理 <Badge count={total} showZero color="#1890ff" /> 家酒店
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
        {/* 搜索和筛选栏 */}
        <div className="filter-bar">
          <Space size="middle" className="filter-space">
            <Input.Search
              placeholder="搜索酒店名称、城市或地址"
              allowClear
              value={searchInput}
              onSearch={(val) => { setSearchKeyword(val); setPagination(prev => ({ ...prev, current: 1 })); }}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => { setSearchInput(''); setSearchKeyword(''); setPagination(prev => ({ ...prev, current: 1 })); }}
              style={{ width: 320 }}
              prefix={<SearchOutlined />}
              className="search-input"
            />
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: 150 }}
              onChange={setStatusFilter}
              prefix={<FilterOutlined />}
              className="status-select"
            >
              <Option value="pending">待审核</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>
          </Space>
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
            total: total,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize })
          }}
          scroll={{ x: 1300 }}
          locale={{
            emptyText: (
              <Empty
                description="暂无酒店数据"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
          className="hotels-table"
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title="✏️ 编辑酒店"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={700}
        className="edit-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          className="edit-form"
        >
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Form.Item
                label="酒店名称"
                name="name"
                rules={[
                  { required: true, message: '请输入酒店名称' },
                  { max: 100, message: '最多100个字符' }
                ]}
              >
                <Input placeholder="请输入酒店名称" maxLength={100} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                label="所在城市"
                name="city"
                rules={[
                  { required: true, message: '请输入所在城市' },
                  { max: 50, message: '最多50个字符' }
                ]}
              >
                <Input placeholder="请输入所在城市" maxLength={50} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="详细地址"
            name="address"
            rules={[
              { required: true, message: '请输入详细地址' },
              { max: 200, message: '最多200个字符' }
            ]}
          >
            <Input placeholder="请输入详细地址" maxLength={200} />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Form.Item
                label="价格（元/晚）"
                name="price"
                rules={[
                  { required: true, message: '请输入价格' },
                  { type: 'number', min: 1, message: '价格必须大于0' }
                ]}
              >
                <InputNumber
                  min={1}
                  max={999999}
                  style={{ width: '100%' }}
                  placeholder="请输入价格"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/[¥\s,]/g, '')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                label="酒店设施"
                name="amenities"
              >
                <Select
                  mode="multiple"
                  placeholder="请选择酒店设施"
                  maxTagCount="responsive"
                  allowClear
                >
                  {amenityOptions.map(option => (
                    <Option key={option} value={option}>{option}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="酒店介绍"
            name="description"
            rules={[
              { required: true, message: '请输入酒店介绍' },
              { max: 1000, message: '最多1000个字符' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请输入酒店介绍"
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="开业时间"
            name="openDate"
          >
            <CascadingDatePicker placeholder="请选择开业时间" />
          </Form.Item>

          <Form.Item
            label="图片URL"
            name="images"
          >
            <TextArea
              rows={2}
              placeholder="请输入图片URL，多个URL用逗号分隔"
            />
          </Form.Item>

          <Form.Item className="form-actions">
            <Space>
              <Button type="primary" htmlType="submit" size="large">
                保存修改
              </Button>
              <Button onClick={() => setEditModalVisible(false)} size="large">
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="🏨 酒店详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setDetailModalVisible(false);
              handleEdit(viewingHotel);
            }}
          >
            编辑
          </Button>
        ]}
        width={700}
        className="detail-modal"
      >
        {viewingHotel && (
          <div className="hotel-detail">
            {/* 图片展示 */}
            {viewingHotel.images && viewingHotel.images.length > 0 && (
              <div className="detail-images">
                <Image.PreviewGroup>
                  {viewingHotel.images.map((img, index) => (
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
                {viewingHotel.name}
              </Descriptions.Item>
              <Descriptions.Item label="所在城市">
                {viewingHotel.city}
              </Descriptions.Item>
              <Descriptions.Item label="价格">
                <span className="detail-price">¥{viewingHotel.price}/晚</span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(viewingHotel.status)}
              </Descriptions.Item>
              <Descriptions.Item label="详细地址" span={2}>
                {viewingHotel.address}
              </Descriptions.Item>
              <Descriptions.Item label="酒店设施" span={2}>
                <div className="detail-amenities">
                  {viewingHotel.amenities?.map((item, index) => (
                    <Tag key={index} color="blue">{item}</Tag>
                  ))}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="酒店介绍" span={2}>
                <div className="detail-description">
                  {viewingHotel.description}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(viewingHotel.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(viewingHotel.updatedAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default HotelManagement;
