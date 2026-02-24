/**
 * 酒店录入页面组件
 *
 * 功能：
 * 1. 酒店信息录入表单
 * 2. 表单验证
 * 3. 设施选择
 * 4. 图片URL管理
 * 5. 提交审核
 *
 * @component
 */

import React, { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Card,
  Select,
  Space,
  Divider,
  Tooltip,
  Alert,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { hotelService } from '../services/api';
import './MerchantEntry.css';

const { TextArea } = Input;
const { Option } = Select;

/**
 * 预设设施选项
 */
const amenityOptions = [
  '免费WiFi',
  '免费停车',
  '游泳池',
  '健身房',
  '餐厅',
  '会议室',
  '24小时前台',
  '行李寄存',
  '洗衣服务',
  '空调',
  '电梯',
  '无障碍设施',
  '早餐',
  '商务中心',
  'SPA',
  '接送服务'
];

/**
 * 预设城市选项
 */
const cityOptions = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '杭州',
  '成都',
  '西安',
  '南京',
  '武汉',
  '重庆'
];

function MerchantEntry() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [amenities, setAmenities] = useState([]);
  const [imageUrls, setImageUrls] = useState('');

  /**
   * 处理表单提交
   * @param {Object} values - 表单值
   */
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // 处理图片URL
      const images = imageUrls
        ? imageUrls.split(',').map(url => url.trim()).filter(url => url)
        : [];

      const data = {
        ...values,
        amenities: amenities,
        images: images
      };

      const response = await hotelService.createHotel(data);

      if (response.data.success) {
        message.success({
          content: '酒店添加成功，等待审核！',
          duration: 3
        });
        // 重置表单
        form.resetFields();
        setAmenities([]);
        setImageUrls('');
      } else {
        message.error(response.data.message || '添加失败');
      }
    } catch (error) {
      console.error('添加酒店失败:', error);
      message.error(error.response?.data?.message || '添加失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理设施选择变化
   * @param {Array} value - 选中的设施
   */
  const handleAmenityChange = (value) => {
    setAmenities(value);
  };

  /**
   * 处理图片URL变化
   * @param {Object} e - 事件对象
   */
  const handleImageChange = (e) => {
    setImageUrls(e.target.value);
  };

  /**
   * 填充示例数据（用于测试）
   */
  const fillExampleData = () => {
    form.setFieldsValue({
      name: '示例豪华酒店',
      city: '北京',
      address: '朝阳区建国路88号',
      price: 599,
      description: '这是一家位于市中心的豪华酒店，交通便利，设施齐全。酒店拥有舒适的客房、完善的餐饮服务和休闲娱乐设施，是您商务出行和休闲度假的理想选择。'
    });
    setAmenities(['免费WiFi', '免费停车', '健身房', '餐厅']);
    setImageUrls('https://example.com/hotel1.jpg, https://example.com/hotel2.jpg');
    message.info('已填充示例数据');
  };

  return (
    <div className="merchant-entry-page">
      {/* 页面标题 */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">🏨 酒店录入</h1>
            <p className="page-subtitle">录入酒店信息并提交审核</p>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={fillExampleData}
            className="example-btn"
          >
            填充示例数据
          </Button>
        </div>
      </div>

      {/* 提示信息 */}
      <Alert
        message="录入说明"
        description="请填写完整的酒店信息，提交后将进入审核流程。审核通过后酒店将在移动端展示。"
        type="info"
        showIcon
        className="info-alert"
        icon={<InfoCircleOutlined />}
      />

      {/* 表单卡片 */}
      <Card className="form-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          className="hotel-form"
        >
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              {/* 酒店名称 */}
              <Form.Item
                label={
                  <span>
                    <HomeOutlined className="field-icon" />
                    酒店名称
                  </span>
                }
                name="name"
                rules={[
                  { required: true, message: '请输入酒店名称' },
                  { min: 2, message: '酒店名称至少2个字符' },
                  { max: 100, message: '酒店名称最多100个字符' }
                ]}
              >
                <Input
                  placeholder="请输入酒店名称"
                  maxLength={100}
                  className="form-input"
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              {/* 所在城市 */}
              <Form.Item
                label={
                  <span>
                    <EnvironmentOutlined className="field-icon" />
                    所在城市
                  </span>
                }
                name="city"
                rules={[
                  { required: true, message: '请输入所在城市' },
                  { max: 50, message: '城市名称最多50个字符' }
                ]}
              >
                <Select
                  placeholder="请选择或输入城市"
                  showSearch
                  allowClear
                  className="form-select"
                  dropdownRender={menu => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ padding: '0 8px 4px' }}>
                        <Input
                          placeholder="输入其他城市"
                          onPressEnter={e => {
                            form.setFieldsValue({ city: e.target.value });
                          }}
                        />
                      </div>
                    </>
                  )}
                >
                  {cityOptions.map(city => (
                    <Option key={city} value={city}>{city}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 详细地址 */}
          <Form.Item
            label={
              <span>
                <EnvironmentOutlined className="field-icon" />
                详细地址
              </span>
            }
            name="address"
            rules={[
              { required: true, message: '请输入详细地址' },
              { max: 200, message: '地址最多200个字符' }
            ]}
          >
            <Input
              placeholder="请输入详细地址，如：朝阳区建国路88号"
              maxLength={200}
              className="form-input"
            />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} lg={12}>
              {/* 价格 */}
              <Form.Item
                label={
                  <span>
                    <DollarOutlined className="field-icon" />
                    价格（元/晚）
                  </span>
                }
                name="price"
                rules={[
                  { required: true, message: '请输入价格' },
                  { type: 'number', min: 1, message: '价格必须大于0' },
                  { type: 'number', max: 999999, message: '价格不能超过999999' }
                ]}
              >
                <InputNumber
                  min={1}
                  max={999999}
                  style={{ width: '100%' }}
                  placeholder="请输入每晚价格"
                  className="form-input-number"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/[¥\s,]/g, '')}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              {/* 酒店设施 */}
              <Form.Item
                label="酒店设施"
                name="amenities"
              >
                <Select
                  mode="multiple"
                  placeholder="请选择酒店设施"
                  value={amenities}
                  onChange={handleAmenityChange}
                  maxTagCount="responsive"
                  className="form-select"
                  allowClear
                >
                  {amenityOptions.map(option => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 酒店介绍 */}
          <Form.Item
            label={
              <span>
                <FileTextOutlined className="field-icon" />
                酒店介绍
              </span>
            }
            name="description"
            rules={[
              { required: true, message: '请输入酒店介绍' },
              { min: 10, message: '介绍至少10个字符' },
              { max: 1000, message: '介绍最多1000个字符' }
            ]}
          >
            <TextArea
              rows={6}
              placeholder="请输入酒店介绍，包括酒店特色、服务设施、周边环境等"
              maxLength={1000}
              showCount
              className="form-textarea"
            />
          </Form.Item>

          {/* 图片URL */}
          <Form.Item
            label={
              <span>
                <PictureOutlined className="field-icon" />
                图片URL
                <Tooltip title="多个图片URL请用逗号分隔">
                  <InfoCircleOutlined className="info-icon" />
                </Tooltip>
              </span>
            }
            name="images"
          >
            <TextArea
              rows={3}
              placeholder="请输入图片URL，多个URL用逗号分隔（例如：https://example.com/hotel1.jpg, https://example.com/hotel2.jpg）"
              value={imageUrls}
              onChange={handleImageChange}
              className="form-textarea"
            />
          </Form.Item>

          {/* 操作按钮 */}
          <Form.Item className="form-actions">
            <Space size="middle">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
                size="large"
                className="submit-btn"
              >
                提交审核
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  setAmenities([]);
                  setImageUrls('');
                  message.info('表单已重置');
                }}
                size="large"
                icon={<ReloadOutlined />}
              >
                重置表单
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default MerchantEntry;
