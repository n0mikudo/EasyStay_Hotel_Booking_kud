/**
 * 酒店详情页面组件
 *
 * 功能：
 * 1. 展示酒店详细信息
 * 2. 酒店图片轮播
 * 3. 酒店基本信息（名称、评分、地址、电话等）
 * 4. 设施服务展示
 * 5. 价格信息和预订入口
 *
 * @component
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  NavBar,
  Image,
  Swiper,
  Toast,
  Button,
  Tag,
  Grid,
  List,
  Card,
  Skeleton,
  Popup,
  DatePicker,
  Stepper
} from 'antd-mobile';
import {
  EnvironmentOutline,
  StarFill,
  HeartOutline,
  HeartFill,
  CheckCircleFill,
  CloseCircleOutline,
  CalendarOutline,
  TeamOutline,
  PhonebookOutline
} from 'antd-mobile-icons';
import { hotelService } from '../services/api';
import './HotelDetailPage.css';

function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 酒店数据状态
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // 预订相关状态
  const [bookingVisible, setBookingVisible] = useState(false);
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 86400000));
  const [guestCount, setGuestCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('checkIn');

  // 设施图标映射
  const amenityIcons = {
    'wifi': '📶',
    'parking': '🅿️',
    'breakfast': '🍳',
    'gym': '💪',
    'pool': '🏊',
    'spa': '💆',
    'restaurant': '🍽️',
    'bar': '🍸',
    'laundry': '👕',
    'business': '💼',
    'meeting': '📊',
    'elevator': '🛗',
    'aircon': '❄️',
    'tv': '📺',
    'minibar': '🥤',
    'safe': '🔒',
    'hairdryer': '💨',
    'toiletries': '🧴',
    'slippers': '🩴',
    'robe': '🥼',
  };

  // 加载酒店详情
  useEffect(() => {
    loadHotelDetail();
  }, [id]);

  /**
   * 加载酒店详情
   */
  const loadHotelDetail = async () => {
    try {
      setLoading(true);
      const response = await hotelService.getHotelById(id);

      if (response.data.success) {
        setHotel(response.data.data);
      } else {
        Toast.show({
          content: '酒店不存在或已下架',
          position: 'center',
        });
        navigate('/hotels');
      }
    } catch (error) {
      Toast.show({
        content: '加载失败，请重试',
        position: 'center',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理收藏
   */
  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    Toast.show({
      content: isFavorite ? '已取消收藏' : '已添加到收藏',
      position: 'center',
    });
  };

  /**
   * 处理预订
   */
  const handleBooking = () => {
    setBookingVisible(true);
  };

  /**
   * 确认预订
   */
  const confirmBooking = () => {
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = hotel.price * roomCount * nights;

    Toast.show({
      content: `预订成功！总价：¥${totalPrice}`,
      position: 'center',
    });
    setBookingVisible(false);
  };

  /**
   * 处理日期选择
   */
  const handleDateConfirm = (date) => {
    if (dateType === 'checkIn') {
      setCheckInDate(date);
      if (date >= checkOutDate) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        setCheckOutDate(nextDay);
      }
    } else {
      if (date <= checkInDate) {
        Toast.show({
          content: '离店日期必须晚于入住日期',
          position: 'center',
        });
        return;
      }
      setCheckOutDate(date);
    }
    setDatePickerVisible(false);
  };

  /**
   * 格式化日期
   */
  const formatDate = (date) => {
    if (!date) return '';
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    return `${month}月${day}日 ${weekDay}`;
  };

  /**
   * 计算入住天数
   */
  const getNightsCount = () => {
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  /**
   * 计算总价
   */
  const getTotalPrice = () => {
    if (!hotel) return 0;
    const nights = getNightsCount();
    return hotel.price * roomCount * nights;
  };

  // 加载中状态
  if (loading) {
    return (
      <div className="hotel-detail-page">
        <NavBar onBack={() => navigate(-1)}>酒店详情</NavBar>
        <div className="skeleton-container">
          <Skeleton.Title animated />
          <Skeleton.Paragraph lineCount={5} animated />
        </div>
      </div>
    );
  }

  // 酒店不存在
  if (!hotel) {
    return (
      <div className="hotel-detail-page">
        <NavBar onBack={() => navigate(-1)}>酒店详情</NavBar>
        <div className="empty-state">
          <p>酒店不存在或已下架</p>
          <Button onClick={() => navigate('/hotels')}>返回列表</Button>
        </div>
      </div>
    );
  }

  const images = hotel.images || [];
  const amenities = hotel.amenities || [];

  return (
    <div className="hotel-detail-page">
      {/* 顶部导航 */}
      <NavBar
        className="detail-nav"
        onBack={() => navigate(-1)}
        right={
          <div className="nav-actions">
            <div className="action-btn" onClick={handleFavorite}>
              {isFavorite ? (
                <HeartFill className="favorite-icon active" />
              ) : (
                <HeartOutline className="favorite-icon" />
              )}
            </div>
          </div>
        }
      >
        酒店详情
      </NavBar>

      {/* 图片轮播 */}
      <div className="image-gallery">
        {images.length > 0 ? (
          <Swiper className="image-swiper" loop autoplay>
            {images.map((image, index) => (
              <Swiper.Item key={index}>
                <Image
                  src={image}
                  alt={`${hotel.name} - ${index + 1}`}
                  fit="cover"
                  className="gallery-image"
                />
              </Swiper.Item>
            ))}
          </Swiper>
        ) : (
          <div className="gallery-placeholder">
            <span className="placeholder-icon">🏨</span>
          </div>
        )}
        <div className="image-counter">
          {images.length > 0 ? `1/${images.length}` : '无图片'}
        </div>
      </div>

      {/* 酒店基本信息 */}
      <div className="hotel-basic-info">
        <div className="hotel-title-section">
          <h1 className="hotel-name">{hotel.name}</h1>
          <div className="hotel-rating">
            <div className="rating-score">
              <StarFill className="star-icon" />
              <span className="score">{hotel.rating || '4.5'}</span>
            </div>
            <span className="rating-text">超赞</span>
          </div>
        </div>

        <div className="hotel-tags">
          {hotel.star && (
            <Tag color="warning" fill="outline">
              {hotel.star}星级
            </Tag>
          )}
          {hotel.isRecommended && (
            <Tag color="danger" fill="outline">
              强烈推荐
            </Tag>
          )}
          <Tag color="primary" fill="outline">
            {hotel.city}
          </Tag>
        </div>

        <div className="hotel-address">
          <EnvironmentOutline className="address-icon" />
          <span className="address-text">{hotel.address}</span>
          <Button size="mini" className="map-btn">地图</Button>
        </div>

        {hotel.phone && (
          <div className="hotel-phone">
            <PhonebookOutline className="phone-icon" />
            <span className="phone-text">{hotel.phone}</span>
            <a href={`tel:${hotel.phone}`} className="call-btn">
              <Button size="mini" color="primary">拨打</Button>
            </a>
          </div>
        )}
      </div>

      {/* 设施服务 */}
      {amenities.length > 0 && (
        <Card className="amenities-card" title="设施服务">
          <Grid columns={4} gap={8}>
            {amenities.map((amenity, index) => (
              <Grid.Item key={index} className="amenity-item">
                <div className="amenity-icon">
                  {amenityIcons[amenity] || '✓'}
                </div>
                <div className="amenity-name">{amenity}</div>
              </Grid.Item>
            ))}
          </Grid>
        </Card>
      )}

      {/* 酒店介绍 */}
      {hotel.description && (
        <Card className="description-card" title="酒店介绍">
          <div className="description-content">
            {hotel.description}
          </div>
        </Card>
      )}

      {/* 预订信息 */}
      <Card className="booking-info-card" title="预订信息">
        <List>
          <List.Item
            prefix={<CalendarOutline />}
            onClick={() => { setDateType('checkIn'); setDatePickerVisible(true); }}
          >
            <div className="date-item">
              <span className="date-label">入住</span>
              <span className="date-value">{formatDate(checkInDate)}</span>
            </div>
          </List.Item>
          <List.Item
            prefix={<CalendarOutline />}
            onClick={() => { setDateType('checkOut'); setDatePickerVisible(true); }}
          >
            <div className="date-item">
              <span className="date-label">离店</span>
              <span className="date-value">{formatDate(checkOutDate)}</span>
            </div>
          </List.Item>
          <List.Item
            prefix={<TeamOutline />}
            extra={
              <Stepper
                min={1}
                max={10}
                value={guestCount}
                onChange={setGuestCount}
              />
            }
          >
            入住人数
          </List.Item>
          <List.Item
            prefix={<CheckCircleFill />}
            extra={
              <Stepper
                min={1}
                max={5}
                value={roomCount}
                onChange={setRoomCount}
              />
            }
          >
            房间数量
          </List.Item>
        </List>
      </Card>

      {/* 底部预订栏 */}
      <div className="booking-bar">
        <div className="price-info">
          <div className="price-row">
            <span className="price-symbol">¥</span>
            <span className="price-value">{hotel.price}</span>
            <span className="price-unit">起/晚</span>
          </div>
          <div className="total-price">
            共{getNightsCount()}晚，总计¥{getTotalPrice()}
          </div>
        </div>
        <Button
          color="primary"
          size="large"
          className="book-btn"
          onClick={handleBooking}
        >
          立即预订
        </Button>
      </div>

      {/* 预订弹窗 */}
      <Popup
        visible={bookingVisible}
        onMaskClick={() => setBookingVisible(false)}
        bodyStyle={{ height: '60vh' }}
      >
        <div className="booking-popup">
          <div className="popup-header">
            <h3>确认预订</h3>
            <CloseCircleOutline
              className="close-icon"
              onClick={() => setBookingVisible(false)}
            />
          </div>

          <div className="popup-content">
            <div className="booking-summary">
              <div className="summary-item">
                <span className="summary-label">酒店</span>
                <span className="summary-value">{hotel.name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">入住日期</span>
                <span className="summary-value">{formatDate(checkInDate)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">离店日期</span>
                <span className="summary-value">{formatDate(checkOutDate)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">入住人数</span>
                <span className="summary-value">{guestCount}人</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">房间数量</span>
                <span className="summary-value">{roomCount}间</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">入住天数</span>
                <span className="summary-value">{getNightsCount()}晚</span>
              </div>
            </div>

            <div className="price-breakdown">
              <div className="breakdown-item">
                <span>¥{hotel.price} × {roomCount}间 × {getNightsCount()}晚</span>
                <span>¥{getTotalPrice()}</span>
              </div>
              <div className="breakdown-total">
                <span>总计</span>
                <span className="total-amount">¥{getTotalPrice()}</span>
              </div>
            </div>
          </div>

          <div className="popup-footer">
            <Button
              color="primary"
              size="large"
              block
              onClick={confirmBooking}
            >
              确认预订
            </Button>
          </div>
        </div>
      </Popup>

      {/* 日期选择器 */}
      <Popup
        visible={datePickerVisible}
        onMaskClick={() => setDatePickerVisible(false)}
        bodyStyle={{ height: '50vh' }}
      >
        <div className="picker-header">
          <span className="picker-title">
            选择{dateType === 'checkIn' ? '入住' : '离店'}日期
          </span>
          <Button onClick={() => setDatePickerVisible(false)}>完成</Button>
        </div>
        <DatePicker
          value={dateType === 'checkIn' ? checkInDate : checkOutDate}
          onConfirm={handleDateConfirm}
          min={new Date()}
        />
      </Popup>
    </div>
  );
}

export default HotelDetailPage;
