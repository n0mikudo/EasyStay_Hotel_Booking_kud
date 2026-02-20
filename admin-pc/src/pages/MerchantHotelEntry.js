/**
 * 商户酒店录入页面
 *
 * 功能：
 * 1. 录入新酒店信息
 * 2. 表单验证
 * 3. 提交后等待审核
 *
 * @component
 */

import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Row,
  Col,
  Cascader,
  Space
} from 'antd';
import { SaveOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { hotelService } from '../services/api';
import { cityData } from '../utils/cityData';
import CascadingDatePicker from '../components/CascadingDatePicker';
import './MerchantEntry.css';

const { TextArea } = Input;
const { Option } = Select;

/** 将房型数组转为后端需要的 roomTypesStr 格式，描述选填，格式：房型:价格 或 房型:价格|描述 */
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

function MerchantHotelEntry() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    // 获取用户信息
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  const handleSubmit = async (values) => {
    const roomTypes = (values.roomTypes || []).filter(rt => rt && (rt.name || '').trim() && (rt.price || 0) > 0);
    if (roomTypes.length === 0) {
      message.error('请至少添加一个有效房型（房型名称和价格均需填写）');
      return;
    }
    const roomTypesStr = roomTypesToStr(roomTypes);
    try {
      setLoading(true);
      const cityValue = Array.isArray(values.city) ? values.city[values.city.length - 1] : values.city;
      const minPrice = Math.min(...roomTypes.map(rt => Number(rt.price)));
      const hotelData = {
        ...values,
        city: cityValue,
        userId: user?.id,
        roomTypesStr,
        price: minPrice
      };
      const response = await hotelService.createHotel(hotelData);

      if (response.data.success) {
        message.success('酒店录入成功，等待管理员审核');
        form.resetFields();
      } else {
        message.error(response.data.message || '录入失败');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '录入失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="merchant-entry">
      <div className="page-header fade-in">
        <h1 className="page-title">录入新酒店</h1>
        <p className="page-subtitle">填写酒店信息，提交后等待审核</p>
      </div>

      <Card className="form-card fade-in" style={{ animationDelay: '0.2s' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          className="hotel-form"
          initialValues={{ roomTypes: [{ name: '', price: undefined, description: '' }] }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="酒店名称（中文）"
                name="name"
                rules={[{ required: true, message: '请输入酒店名称' }]}
                className="form-item"
              >
                <Input placeholder="请输入酒店中文名称" className="form-input" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="城市"
                name="city"
                rules={[{ required: true, message: '请选择城市' }]}
                className="form-item"
              >
                <Cascader options={cityData} placeholder="请选择省市区" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="酒店名称（英文）" name="nameEn" className="form-item">
                <Input placeholder="Hotel Name in English（可选）" className="form-input" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Form.Item
                label="地址"
                name="address"
                rules={[{ required: true, message: '请输入详细地址' }]}
                className="form-item"
              >
                <Input
                  placeholder="请输入详细地址"
                  className="form-input"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="星级"
                name="rating"
                rules={[{ required: true, message: '请选择星级' }]}
                className="form-item"
              >
                <Select
                  placeholder="请选择酒店星级"
                  className="form-select"
                >
                  <Option value={5}>五星级</Option>
                  <Option value={4}>四星级</Option>
                  <Option value={3}>三星级</Option>
                  <Option value={2}>二星级</Option>
                  <Option value={1}>经济型</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="联系电话"
                name="phone"
                rules={[{ required: true, message: '请输入联系电话' }]}
                className="form-item"
              >
                <Input
                  placeholder="请输入联系电话"
                  className="form-input"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="酒店描述"
            name="description"
            rules={[{ required: true, message: '请输入酒店描述' }]}
            className="form-item"
          >
            <TextArea
              rows={4}
              placeholder="请描述酒店的特色、设施、服务等信息"
              className="form-textarea"
            />
          </Form.Item>

          <Form.Item
            label="房型信息"
            className="form-item"
            required
            extra="点击 + 新增房型，至少保留一个。房型名称与价格必填，描述选填。"
          >
            <Form.List
              name="roomTypes"
              rules={[
                {
                  validator: async (_, roomTypes) => {
                    const valid = (roomTypes || []).filter(rt => rt && (rt.name || '').trim() && (rt.price || 0) > 0);
                    if (valid.length === 0) return Promise.reject(new Error('请至少添加一个有效房型'));
                  }
                }
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <div className="room-types-editor">
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="room-type-row">
                      <Space align="baseline" style={{ width: '100%', gap: 12 }} wrap>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          rules={[{ required: true, message: '房型名称' }]}
                          style={{ flex: 1, minWidth: 140 }}
                        >
                          <Input placeholder="如：标准间、豪华大床房" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          rules={[
                            { required: true, message: '价格' },
                            { type: 'number', min: 0.01, message: '>0' }
                          ]}
                          style={{ width: 120 }}
                        >
                          <InputNumber placeholder="元/晚" min={0.01} precision={2} style={{ width: '100%' }} addonBefore="¥" />
                        </Form.Item>
                        {fields.length > 1 ? (
                          <MinusCircleOutlined
                            className="room-type-remove"
                            onClick={() => remove(name)}
                            style={{ fontSize: 18, color: '#ff4d4f', cursor: 'pointer' }}
                          />
                        ) : null}
                      </Space>
                      <Form.Item
                        {...restField}
                        name={[name, 'description']}
                        style={{ marginBottom: 0, marginTop: 8 }}
                      >
                        <Input placeholder="房型描述（选填）如：豪华装修、带阳台" />
                      </Form.Item>
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="room-type-add-btn">
                      新增房型
                    </Button>
                  </Form.Item>
                  <Form.ErrorList errors={errors} />
                </div>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item
            label="参考起价"
            className="form-item"
            tooltip="根据房型信息自动计算，显示最低价"
          >
            <Form.Item noStyle shouldUpdate={(prev, curr) => JSON.stringify(prev?.roomTypes) !== JSON.stringify(curr?.roomTypes)}>
              {({ getFieldValue }) => {
                const roomTypes = (getFieldValue('roomTypes') || []).filter(rt => rt && (rt.name || '').trim() && (rt.price || 0) > 0);
                const min = roomTypes.length > 0 ? Math.min(...roomTypes.map(rt => Number(rt.price))) : null;
                return (
                  <div className="price-from-display" style={{ color: '#1890ff', fontWeight: 500 }}>
                    {min != null ? `¥${min}起/晚` : '添加房型后自动显示'}
                  </div>
                );
              }}
            </Form.Item>
          </Form.Item>

          <Form.Item
            label="开业时间"
            name="openDate"
            className="form-item"
          >
            <CascadingDatePicker placeholder="请选择开业时间" />
          </Form.Item>

          <Form.Item
            label="图片URL"
            name="images"
            className="form-item"
          >
            <TextArea
              rows={2}
              placeholder="请输入图片URL，多个URL用逗号分隔"
              className="form-textarea"
            />
          </Form.Item>

          <Form.Item className="form-item">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
              className="btn-submit"
            >
              提交审核
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default MerchantHotelEntry;
