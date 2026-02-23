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
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { hotelService, bookingService } from '../services/api';
import CascadingDatePicker from '../components/CascadingDatePicker';
import './HotelDetailPage.css';

function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const passedCheckIn = routeLocation.state?.checkIn;
  const passedCheckOut = routeLocation.state?.checkOut;

  // 酒店数据状态
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // 预订相关状态
  const [bookingVisible, setBookingVisible] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [checkInDate, setCheckInDate] = useState(
    passedCheckIn ? new Date(passedCheckIn) : new Date()
  );
  const [checkOutDate, setCheckOutDate] = useState(
    passedCheckOut ? new Date(passedCheckOut) : new Date(Date.now() + 86400000)
  );
  const [guestCount, setGuestCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('checkIn');

  const getAmenityChar = (name) => {
    if (!name) return '✓';
    return name.charAt(0);
  };

  const FAVORITES_KEY = 'easystay_favorites';

  const getFavorites = () => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  // 加载酒店详情
  useEffect(() => {
    loadHotelDetail();
  }, [id]);

  // 酒店加载后默认选中最便宜房型
  useEffect(() => {
    if (!hotel) {
      setSelectedRoomType(null);
      return;
    }
    if (hotel.roomTypes && hotel.roomTypes.length > 0) {
      const sorted = [...hotel.roomTypes].sort((a, b) => (a.price || 0) - (b.price || 0));
      setSelectedRoomType(sorted[0]);
    } else if (hotel.price) {
      setSelectedRoomType({ name: '标准间', price: hotel.price });
    } else {
      setSelectedRoomType(null);
    }
  }, [hotel?.id]);

  useEffect(() => {
    if (id) {
      const favs = getFavorites();
      setIsFavorite(favs.includes(id));
    }
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
   * 处理收藏 - 持久化到 localStorage
   */
  const handleFavorite = () => {
    const favs = getFavorites();
    const next = !isFavorite;
    setIsFavorite(next);
    if (next) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs, id]));
      Toast.show({ content: '已添加到收藏', position: 'center' });
    } else {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs.filter(f => f !== id)));
      Toast.show({ content: '已取消收藏', position: 'center' });
    }
  };

  /**
   * 处理预订 - 需已选房型
   */
  const handleBooking = () => {
    if (!selectedRoomType) {
      Toast.show({ content: '请先选择房型', position: 'center' });
      return;
    }
    setBookingVisible(true);
  };

  /**
   * 确认预订 - 对接后端API，预订所选具体房型
   */
  const confirmBooking = async () => {
    if (!selectedRoomType) {
      Toast.show({ content: '请选择房型', position: 'center' });
      return;
    }
    const nights = getNightsCount();
    const totalPrice = getTotalPrice();
    const roomTypeIndex = hotel.roomTypes ? hotel.roomTypes.findIndex(r => r.name === selectedRoomType.name && r.price === selectedRoomType.price) : 0;

    try {
      const response = await bookingService.createBooking({
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomType: selectedRoomType.name,
        roomPrice: selectedRoomType.price,
        roomTypeDescription: selectedRoomType.description || undefined,
        roomTypeIndex: roomTypeIndex >= 0 ? roomTypeIndex : 0,
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        nights,
        guestCount,
        roomCount,
        totalPrice
      });

      if (response.data.success) {
        Toast.show({
          content: `预订成功！总价：¥${totalPrice}`,
          position: 'center',
        });
        setBookingVisible(false);
      } else {
        Toast.show({
          content: response.data.message || '预订失败',
          position: 'center',
          icon: 'fail',
        });
      }
    } catch (error) {
      Toast.show({
        content: error.response?.data?.message || '预订失败，请稍后重试',
        position: 'center',
        icon: 'fail',
      });
    }
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
   * 计算总价（使用所选房型价格）
   */
  const getTotalPrice = () => {
    if (!selectedRoomType) return 0;
    const nights = getNightsCount();
    return (selectedRoomType.price || 0) * roomCount * nights;
  };

  // 加载中状态
  if (loading) {
    return (
      <div className="hotel-detail-page">
        <NavBar onBack={() => navigate('/hotels')}>酒店详情</NavBar>
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
        <NavBar onBack={() => navigate('/hotels')}>酒店详情</NavBar>
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
      {/* 顶部导航 - PDF要求：显示酒店名称及返回列表页功能 */}
      <NavBar
        className="detail-nav"
        onBack={() => navigate('/hotels')}
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
        <span className="nav-title-text">{hotel.name}</span>
      </NavBar>

      {/* 图片轮播 - 支持左右滚动，带指示器 */}
      <div className="image-gallery">
        {images.length > 0 ? (
          <Swiper
            className="image-swiper"
            loop
            autoplay
            indicator={(total, current) => {
              const idx = images.length > 0 ? current % images.length : 0;
              return (
                <div className="gallery-indicator">
                  <span className="gallery-counter">{idx + 1}/{images.length}</span>
                  <div className="gallery-dots">
                    {images.map((_, i) => (
                      <span key={i} className={`gallery-dot ${i === idx ? 'active' : ''}`} />
                    ))}
                  </div>
                </div>
              );
            }}
          >
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
      </div>

      {/* 酒店基本信息 - PDF要求：酒店名(中/英显示) */}
      <div className="hotel-basic-info">
        <div className="hotel-title-section">
          <div className="hotel-name-block">
            <h1 className="hotel-name">{hotel.name}</h1>
            {hotel.nameEn && <p className="hotel-name-en">{hotel.nameEn}</p>}
          </div>
          <div className="hotel-rating">
            <div className="rating-score">
              <StarFill className="star-icon" />
              <span className="score">{hotel.rating || '4.5'}</span>
            </div>
            <span className="rating-text">超赞</span>
          </div>
        </div>

        <div className="hotel-tags">
          {hotel.rating && (
            <Tag color="warning" fill="outline">
              {hotel.rating >= 5 ? '豪华型' : hotel.rating >= 4 ? '高档型' : hotel.rating >= 3 ? '舒适型' : '经济型'}
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
          {hotel.openDate && (
            <Tag color="default" fill="outline">
              开业于 {hotel.openDate}
            </Tag>
          )}
        </div>

        <div className="hotel-address">
          <EnvironmentOutline className="address-icon" />
          <span className="address-text">{hotel.address}</span>
          <Button
            size="mini"
            className="map-btn"
            onClick={() => {
              const addr = encodeURIComponent(`${hotel.name} ${hotel.address}`);
              window.open(`https://uri.amap.com/marker?position=116.397128,39.916527&name=${encodeURIComponent(hotel.name)}&address=${addr}`, '_blank');
            }}
          >
            地图
          </Button>
        </div>

        {/* 评分分布可视化 */}
        <div className="score-distribution">
          {hotel.baiduRating && (
            <div className="score-source">百度评分 {hotel.baiduRating}{hotel.commentCount ? ` · ${hotel.commentCount}条评价` : ''}</div>
          )}
          {[
            { label: '环境', key: 'environment' },
            { label: '服务', key: 'service' },
            { label: '设施', key: 'facility' }
          ].map(item => {
            const val = hotel.scores?.[item.key] || hotel.rating || 3.0;
            return (
              <div className="score-bar-item" key={item.key}>
                <span className="score-label">{item.label}</span>
                <div className="score-bar-track">
                  <div className="score-bar-fill" style={{ width: `${val / 5 * 100}%` }} />
                </div>
                <span className="score-num">{val}</span>
              </div>
            );
          })}
        </div>

        {/* 酒店亮点 */}
        {(() => {
          const highlights = [];
          const br = parseFloat(hotel.baiduOverallRating || hotel.baiduRating) || 0;
          const cc = parseInt(hotel.baiduCommentNum || hotel.commentCount) || 0;
          if (br >= 4.5) highlights.push({ label: '优', text: `口碑极佳 · 评分${br}` });
          if (cc >= 100) highlights.push({ label: '热', text: `热门之选 · ${cc}条真实评价` });
          if (hotel.brand) highlights.push({ label: '牌', text: `品牌连锁 · ${hotel.brand}` });
          const amen = (hotel.amenities || []).map(a => String(a));
          const tags = (hotel.tags || []).map(t => String(t));
          if (amen.some(a => a.includes('地铁')) || tags.some(t => t.includes('地铁'))) highlights.push({ label: '铁', text: '交通便利 · 近地铁' });
          if (amen.some(a => a.includes('早餐'))) highlights.push({ label: '早', text: '含早餐 · 省心之选' });
          if (amen.some(a => a.includes('停车'))) highlights.push({ label: '车', text: '免费停车 · 自驾友好' });
          if (tags.some(t => t.includes('亲子'))) highlights.push({ label: '亲', text: '亲子出行 · 家庭首选' });
          if ((hotel.price || 999) < 200 && br >= 4.0) highlights.push({ label: '值', text: '超值推荐 · 好评低价' });
          if (amen.some(a => a.includes('泳池') || a.includes('游泳'))) highlights.push({ label: '泳', text: '泳池配套 · 休闲度假' });
          if (br > 0 && br < 4.5 && cc >= 50) highlights.push({ label: '赞', text: `用户好评 · 评分${br}` });
          const show = highlights.slice(0, 5);
          if (show.length === 0) return null;
          return (
            <div className="highlights-section">
              <div className="highlights-title">酒店亮点</div>
              <div className="highlights-list">
                {show.map((h, i) => (
                  <div key={i} className="highlight-item">
                    <span className="highlight-dot">{h.label}</span>
                    <span className="highlight-text">{h.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

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

      {/* 房型价格列表 - 按价格从低到高，点击选择预订房型 */}
      <Card className="room-types-card" title="选择房型">
        <List>
          {(() => {
            const roomTypes = hotel.roomTypes && hotel.roomTypes.length > 0
              ? [...hotel.roomTypes].sort((a, b) => (a.price || 0) - (b.price || 0))
              : [{ name: '标准间', price: hotel.price }];
            return roomTypes.map((room, index) => {
              const isSelected = selectedRoomType && selectedRoomType.name === room.name && selectedRoomType.price === room.price;
              return (
                <List.Item
                  key={index}
                  className={isSelected ? 'room-type-item selected' : 'room-type-item'}
                  onClick={() => setSelectedRoomType(room)}
                  extra={
                    <div className="room-price">
                      <span className="price-symbol">¥</span>
                      <span className="price-value">{room.price}</span>
                      <span className="price-unit">/晚</span>
                    </div>
                  }
                  arrow={false}
                >
                  <div>
                    <div className="room-type-name">
                      {room.name}
                      {isSelected && <CheckCircleFill style={{ marginLeft: 8, color: 'var(--color-primary)' }} />}
                    </div>
                    {room.description && (
                      <div className="room-type-desc">{room.description}</div>
                    )}
                  </div>
                </List.Item>
              );
            });
          })()}
        </List>
      </Card>

      {/* 设施服务 */}
      {amenities.length > 0 && (
        <Card className="amenities-card" title="设施服务">
          <Grid columns={4} gap={8}>
            {amenities.map((amenity, index) => (
              <Grid.Item key={index} className="amenity-item">
                <div className="amenity-icon-circle">
                  {getAmenityChar(amenity)}
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

      {/* 日历+人间夜 Banner - PDF要求：突出展示 */}
      <div className="date-nights-banner">
        <div className="banner-inner">
          <div className="banner-item" onClick={() => { setDateType('checkIn'); setDatePickerVisible(true); }}>
            <div className="banner-label">入住</div>
            <div className="banner-value">{formatDate(checkInDate)}</div>
          </div>
          <div className="banner-divider">
            <span className="nights-badge">{getNightsCount()}晚</span>
          </div>
          <div className="banner-item" onClick={() => { setDateType('checkOut'); setDatePickerVisible(true); }}>
            <div className="banner-label">离店</div>
            <div className="banner-value">{formatDate(checkOutDate)}</div>
          </div>
        </div>
      </div>

      {/* 预订信息 - 人数与房间 */}
      <Card className="booking-info-card" title="入住人数与房间">
        <List>
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
            <span className="price-value">{selectedRoomType ? getTotalPrice() : '—'}</span>
            {selectedRoomType && (
              <span className="selected-room-unit">{selectedRoomType.name} ¥{selectedRoomType.price}/晚</span>
            )}
          </div>
          <div className="total-price">
            共{getNightsCount()}晚{selectedRoomType ? `，${roomCount}间，总计¥${getTotalPrice()}` : '，请选择房型'}
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
              {selectedRoomType && (
                <div className="summary-item">
                  <span className="summary-label">房型</span>
                  <span className="summary-value">
                    {selectedRoomType.name} ¥{selectedRoomType.price}/晚
                    {selectedRoomType.description && (
                      <span className="summary-desc"> · {selectedRoomType.description}</span>
                    )}
                  </span>
                </div>
              )}
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
                <span>¥{selectedRoomType?.price || hotel.price} × {roomCount}间 × {getNightsCount()}晚</span>
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

      {/* 日期选择器 - 级联年月日 */}
      <Popup
        visible={datePickerVisible}
        onMaskClick={() => setDatePickerVisible(false)}
        bodyStyle={{ height: '50vh', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      >
        <CascadingDatePicker
          embedded
          visible={datePickerVisible}
          value={dateType === 'checkIn' ? checkInDate : checkOutDate}
          onConfirm={handleDateConfirm}
          onClose={() => setDatePickerVisible(false)}
          min={dateType === 'checkIn' ? new Date() : new Date((checkInDate || new Date()).getTime() + 86400000)}
          title={`选择${dateType === 'checkIn' ? '入住' : '离店'}日期`}
        />
      </Popup>
    </div>
  );
}

export default HotelDetailPage;
