/**
 * 商户酒店列表页面
 *
 * 功能：
 * 1. 展示商户录入的所有酒店
 * 2. 查看酒店状态
 * 3. 编辑酒店信息
 *
 * @component
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Popconfirm,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Cascader
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import { cityData } from '../utils/cityData';
import { useNavigate } from 'react-router-dom';
import { hotelService } from '../services/api';
import CascadingDatePicker from '../components/CascadingDatePicker';
import './HotelManagement.css';

const { TextArea } = Input;
const { Option } = Select;

/** 将房型数组转为后端需要的 roomTypesStr 格式，描述选填 */
function roomTypesToStr(roomTypes) {
  if (!Array.isArray(roomTypes) || roomTypes.length === 0) return '';
  return roomTypes
    .filter(rt => rt && (rt.name || '').trim() && (rt.price || 0) > 0)
    .map(rt => {
      const base = `${String(rt.name).trim()}:${Number(rt.price)}`;
      return (rt.description || '').trim() ? `${base}|${String(rt.description).trim()}` : base;
    })
    .join('\n');
}

function MerchantHotelList({ user: userProp }) {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [form] = Form.useForm();
  let user = null;
  try {
    user = userProp || JSON.parse(localStorage.getItem('user') || 'null');
  } catch (e) {
    console.error('解析用户信息失败:', e);
  }

  const loadHotels = useCallback(async () => {
    if (!user?.id) {
      setHotels([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await hotelService.getHotels({ userId: user.id });
      if (response.data.success) {
        setHotels(response.data.data || []);
      }
    } catch (error) {
      message.error('加载酒店列表失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  const handleDelete = async (id) => {
    try {
      const response = await hotelService.deleteHotel(id, user?.id);
      if (response.data.success) {
        message.success('删除成功');
        loadHotels();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEdit = (hotel) => {
    setEditingHotel(hotel);
    const roomTypes = hotel.roomTypes && hotel.roomTypes.length > 0
      ? hotel.roomTypes.map(rt => ({ name: rt.name, price: rt.price, description: rt.description || '' }))
      : hotel.price ? [{ name: '标准间', price: hotel.price, description: '' }] : [{ name: '', price: undefined, description: '' }];
    form.setFieldsValue({
      ...hotel,
      roomTypes
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async (values) => {
    const roomTypes = (values.roomTypes || []).filter(rt => rt && (rt.name || '').trim() && (rt.price || 0) > 0);
    if (roomTypes.length === 0) {
      message.error('请至少保留一个有效房型（房型名称和价格均需填写）');
      return;
    }
    const roomTypesStr = roomTypesToStr(roomTypes);
    try {
      const cityValue = Array.isArray(values.city) ? values.city[values.city.length - 1] : values.city;
      const minPrice = Math.min(...roomTypes.map(rt => Number(rt.price)));
      const hotelData = {
        ...values,
        city: cityValue,
        userId: user?.id,
        roomTypesStr,
        price: minPrice
      };
      const response = await hotelService.updateHotel(editingHotel.id, hotelData, { userId: user?.id, role: 'merchant' });
      if (response.data.success) {
        message.success('更新成功，已通知管理员');
        setEditModalVisible(false);
        loadHotels();
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  // 处理商户确认管理员修改
  const handleConfirmAdminEdit = async (hotel, confirm) => {
    try {
      if (confirm) {
        // 确认管理员修改
        const response = await hotelService.updateHotel(hotel.id, hotel, { userId: user?.id, role: 'merchant' });
        if (response.data.success) {
          message.success('已确认管理员的修改');
          loadHotels();
        }
      } else {
        // 拒绝管理员修改，恢复原状态
        const { adminEditData, ...originalHotel } = hotel;
        const response = await hotelService.updateHotel(hotel.id, originalHotel, { userId: user?.id, role: 'merchant' });
        if (response.data.success) {
          message.success('已拒绝管理员的修改');
          loadHotels();
        }
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStatusTag = (status, hotel) => {
    const statusMap = {
      'pending': { color: 'warning', text: '审核中' },
      'approved': { color: 'success', text: '已通过' },
      'rejected': { color: 'error', text: '已拒绝' },
      'pending_merchant_confirm': { color: 'processing', text: '待确认' }
    };
    const config = statusMap[status] || { color: 'default', text: status };

    if (status === 'pending_merchant_confirm') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color={config.color}>{config.text}</Tag>
          <Button size="small" type="primary" onClick={() => handleConfirmAdminEdit(hotel, true)}>
            确认
          </Button>
          <Button size="small" danger onClick={() => handleConfirmAdminEdit(hotel, false)}>
            拒绝
          </Button>
        </div>
      );
    }

    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span className="hotel-name">{name}</span>
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
      render: (price) => <span className="price-tag">¥{price}起</span>
    },
    {
      title: '星级',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => '★'.repeat(rating)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, hotel) => getStatusTag(status, hotel)
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            className="btn-edit"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除"
            description="删除后无法恢复，是否继续？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              className="btn-delete"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="hotel-management">
      <div className="page-header fade-in">
        <h1 className="page-title">我的酒店</h1>
        <p className="page-subtitle">管理您录入的所有酒店</p>
      </div>

      <Card className="hotels-card fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="table-toolbar">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="btn-primary"
            onClick={() => navigate('/merchant/entry')}
          >
            录入新酒店
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={hotels}
          rowKey="id"
          loading={loading}
          className="hotels-table"
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

      {/* 编辑弹窗 */}
      <Modal
        title="编辑酒店"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            label="酒店名称"
            name="name"
            rules={[{ required: true, message: '请输入酒店名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="城市"
            name="city"
            rules={[{ required: true, message: '请选择城市' }]}
          >
            <Cascader
              options={cityData}
              placeholder="请选择省市区"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="地址"
            name="address"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="星级"
            name="rating"
            rules={[{ required: true, message: '请选择星级' }]}
          >
            <Select>
              <Option value={5}>豪华型</Option>
              <Option value={4}>高档型</Option>
              <Option value={3}>舒适型</Option>
              <Option value={2}>经济型</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="联系电话"
            name="phone"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="酒店描述"
            name="description"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item label="房型信息" required extra="点击 + 新增房型，至少保留一个。描述选填。">
            <Form.List
              name="roomTypes"
              rules={[
                {
                  validator: async (_, roomTypes) => {
                    const valid = (roomTypes || []).filter(rt => rt && (rt.name || '').trim() && (rt.price || 0) > 0);
                    if (valid.length === 0) return Promise.reject(new Error('请至少保留一个有效房型'));
                  }
                }
              ]}
            >
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <Space align="baseline" style={{ width: '100%' }}>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          rules={[{ required: true, message: '房型' }]}
                          style={{ flex: 1, minWidth: 120 }}
                        >
                          <Input placeholder="房型名称" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          rules={[{ required: true }, { type: 'number', min: 0.01 }]}
                          style={{ width: 110 }}
                        >
                          <InputNumber placeholder="价格" min={0.01} precision={2} addonBefore="¥" style={{ width: '100%' }} />
                        </Form.Item>
                        {fields.length > 1 && (
                          <MinusCircleOutlined
                            onClick={() => remove(name)}
                            style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer' }}
                          />
                        )}
                      </Space>
                      <Form.Item {...restField} name={[name, 'description']} style={{ marginBottom: 0, marginTop: 4 }}>
                        <Input placeholder="房型描述（选填）" />
                      </Form.Item>
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="small">
                      新增房型
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
          <Form.Item label="参考起价" shouldUpdate={(prev, curr) => JSON.stringify(prev?.roomTypes) !== JSON.stringify(curr?.roomTypes)}>
            {({ getFieldValue }) => {
              const roomTypes = (getFieldValue('roomTypes') || []).filter(rt => rt && (rt.name || '').trim() && (rt.price || 0) > 0);
              const min = roomTypes.length > 0 ? Math.min(...roomTypes.map(rt => Number(rt.price))) : null;
              return min != null ? <span style={{ color: '#1890ff' }}>¥{min}起/晚</span> : null;
            }}
          </Form.Item>
          <Form.Item label="开业时间" name="openDate">
            <CascadingDatePicker placeholder="请选择开业时间" />
          </Form.Item>
          <Form.Item
            label="图片URL"
            name="images"
          >
            <TextArea rows={2} placeholder="请输入图片URL，多个URL用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default MerchantHotelList;
