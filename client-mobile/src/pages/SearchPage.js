/**
 * 酒店查询页面（首页）组件
 *
 * 功能：
 * 1. 顶部Banner广告 - 点击跳转酒店详情
 * 2. 核心查询区域：
 *    a. 当前地点（支持定位）
 *    b. 关键字搜索
 *    c. 酒店入住日期选择
 *    d. 筛选条件（星级/价格）
 *    e. 快捷标签（亲子、豪华、免费停车场等）
 * 3. 查询按钮 - 跳转到列表页
 *
 * @component
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchBar,
  Button,
  Toast,
  NavBar,
  DatePicker,
  Tag,
  Swiper,
  Popup
} from 'antd-mobile';
import {
  EnvironmentOutline,
  CalendarOutline,
  FilterOutline,
  SearchOutline,
  StarOutline,
  TagOutline
} from 'antd-mobile-icons';
import { hotelService } from '../services/api';
import './SearchPage.css';

function SearchPage() {
  const navigate = useNavigate();

  // 核心查询状态
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [starRating, setStarRating] = useState(null);
  const [priceRange, setPriceRange] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);

  // UI状态
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('checkIn'); // 'checkIn' 或 'checkOut'
  const [starPickerVisible, setStarPickerVisible] = useState(false);
  const [pricePickerVisible, setPricePickerVisible] = useState(false);
  const [bannerHotels, setBannerHotels] = useState([]);

  // 快捷标签选项
  const quickTags = [
    { label: '亲子', value: 'family', icon: '👨‍👩‍👧‍👦' },
    { label: '豪华', value: 'luxury', icon: '👑' },
    { label: '免费停车', value: 'parking', icon: '🅿️' },
    { label: '含早餐', value: 'breakfast', icon: '🍳' },
    { label: '海景', value: 'seaview', icon: '🌊' },
    { label: '市中心', value: 'center', icon: '🏙️' },
    { label: '近地铁', value: 'subway', icon: '🚇' },
    { label: '网红', value: 'popular', icon: '📸' },
  ];

  // 星级选项
  const starOptions = [
    { label: '不限', value: null },
    { label: '五星级', value: 5 },
    { label: '四星级', value: 4 },
    { label: '三星级', value: 3 },
    { label: '二星级及以下', value: 2 },
  ];

  // 价格区间选项
  const priceOptions = [
    { label: '不限', value: null },
    { label: '¥200以下', value: '0-200' },
    { label: '¥200-500', value: '200-500' },
    { label: '¥500-1000', value: '500-1000' },
    { label: '¥1000以上', value: '1000+' },
  ];

  // 获取Banner酒店数据
  useEffect(() => {
    fetchBannerHotels();
    // 尝试获取当前位置
    getCurrentLocation();
  }, []);

  /**
   * 获取Banner酒店数据
   */
  const fetchBannerHotels = async () => {
    try {
      const response = await hotelService.getHotels({ status: 'approved', limit: 5 });
      if (response.data.success && response.data.data.length > 0) {
        setBannerHotels(response.data.data.slice(0, 5));
      }
    } catch (error) {
      console.error('获取Banner酒店失败:', error);
    }
  };

  /**
   * 获取当前位置
   */
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 这里可以调用逆地理编码API获取城市名称
          // 简化处理，使用默认城市
          setLocation('当前位置');
        },
        (error) => {
          console.log('定位失败:', error);
          setLocation('请选择城市');
        }
      );
    } else {
      setLocation('请选择城市');
    }
  };

  /**
   * 处理日期选择
   * @param {Date} date - 选择的日期
   */
  const handleDateConfirm = (date) => {
    if (dateType === 'checkIn') {
      setCheckInDate(date);
      // 如果离店日期早于入住日期，自动调整
      if (checkOutDate && date >= checkOutDate) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        setCheckOutDate(nextDay);
      }
    } else {
      if (checkInDate && date <= checkInDate) {
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
   * 格式化日期显示
   * @param {Date} date - 日期对象
   * @returns {string} 格式化后的日期字符串
   */
  const formatDate = (date) => {
    if (!date) return '';
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  /**
   * 计算入住天数
   * @returns {number} 入住天数
   */
  const getNightsCount = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  /**
   * 处理快捷标签选择
   * @param {string} tag - 标签值
   */
  const handleTagSelect = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  /**
   * 处理Banner点击
   * @param {Object} hotel - 酒店数据
   */
  const handleBannerClick = (hotel) => {
    navigate(`/hotels/${hotel.id}`);
  };

  /**
   * 处理查询按钮点击
   */
  const handleSearch = () => {
    const params = new URLSearchParams();

    if (keyword.trim()) {
      params.append('keyword', keyword.trim());
    }

    if (location && location !== '请选择城市') {
      params.append('city', location);
    }

    if (checkInDate) {
      params.append('checkIn', checkInDate.toISOString().split('T')[0]);
    }

    if (checkOutDate) {
      params.append('checkOut', checkOutDate.toISOString().split('T')[0]);
    }

    if (starRating) {
      params.append('star', starRating);
    }

    if (priceRange) {
      params.append('price', priceRange);
    }

    if (selectedTags.length > 0) {
      params.append('tags', selectedTags.join(','));
    }

    navigate(`/hotels?${params.toString()}`);
  };

  /**
   * 渲染Banner区域
   */
  const renderBanner = () => {
    if (bannerHotels.length === 0) {
      return (
        <div className="banner-empty" onClick={() => navigate('/hotels')}>
          <div className="banner-placeholder">
            <span className="banner-icon">🏨</span>
            <span className="banner-text">探索精选酒店</span>
          </div>
        </div>
      );
    }

    return (
      <div className="banner-container">
        <Swiper autoplay loop className="banner-swiper">
          {bannerHotels.map((hotel) => (
            <Swiper.Item key={hotel.id}>
              <div
                className="banner-item"
                onClick={() => handleBannerClick(hotel)}
                style={{
                  backgroundImage: hotel.images && hotel.images.length > 0
                    ? `url(${hotel.images[0]})`
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                <div className="banner-overlay">
                  <div className="banner-content">
                    <div className="banner-badge">精选推荐</div>
                    <h3 className="banner-title">{hotel.name}</h3>
                    <p className="banner-location">📍 {hotel.city} · {hotel.address}</p>
                    <div className="banner-price">
                      <span className="price-symbol">¥</span>
                      <span className="price-value">{hotel.price}</span>
                      <span className="price-unit">/晚</span>
                    </div>
                  </div>
                </div>
              </div>
            </Swiper.Item>
          ))}
        </Swiper>
      </div>
    );
  };

  return (
    <div className="search-page">
      {/* 顶部导航 */}
      <NavBar className="search-nav" back={null}>
        <div className="nav-title">易宿酒店</div>
      </NavBar>

      {/* Banner区域 */}
      {renderBanner()}

      {/* 核心查询区域 */}
      <div className="search-form-container">
        {/* 地点选择 */}
        <div className="form-item location-item">
          <div className="form-icon">
            <EnvironmentOutline />
          </div>
          <div className="form-content">
            <div className="form-label">目的地</div>
            <div className="form-value" onClick={() => Toast.show({ content: '城市选择功能开发中', position: 'center' })}>
              {location || '请选择城市'}
            </div>
          </div>
        </div>

        {/* 日期选择 */}
        <div className="form-item date-item">
          <div className="form-icon">
            <CalendarOutline />
          </div>
          <div className="form-content date-content">
            <div
              className="date-block"
              onClick={() => {
                setDateType('checkIn');
                setDatePickerVisible(true);
              }}
            >
              <div className="form-label">入住</div>
              <div className="form-value">
                {checkInDate ? formatDate(checkInDate) : '选择日期'}
              </div>
            </div>
            <div className="date-separator">
              <div className="nights-badge">{getNightsCount()}晚</div>
            </div>
            <div
              className="date-block"
              onClick={() => {
                setDateType('checkOut');
                setDatePickerVisible(true);
              }}
            >
              <div className="form-label">离店</div>
              <div className="form-value">
                {checkOutDate ? formatDate(checkOutDate) : '选择日期'}
              </div>
            </div>
          </div>
        </div>

        {/* 关键字搜索 */}
        <div className="form-item keyword-item">
          <div className="form-icon">
            <SearchOutline />
          </div>
          <div className="form-content">
            <div className="form-label">关键词</div>
            <SearchBar
              placeholder="酒店名/位置/品牌"
              value={keyword}
              onChange={setKeyword}
              className="keyword-search"
            />
          </div>
        </div>

        {/* 筛选条件 */}
        <div className="filter-row">
          <div
            className="filter-item"
            onClick={() => setStarPickerVisible(true)}
          >
            <StarOutline className="filter-icon" />
            <span className="filter-text">
              {starRating ? starOptions.find(s => s.value === starRating)?.label : '星级'}
            </span>
          </div>
          <div
            className="filter-item"
            onClick={() => setPricePickerVisible(true)}
          >
            <FilterOutline className="filter-icon" />
            <span className="filter-text">
              {priceRange ? priceOptions.find(p => p.value === priceRange)?.label : '价格'}
            </span>
          </div>
        </div>

        {/* 快捷标签 */}
        <div className="quick-tags-section">
          <div className="section-title">
            <TagOutline className="section-icon" />
            <span>快捷筛选</span>
          </div>
          <div className="tags-container">
            {quickTags.map((tag) => (
              <Tag
                key={tag.value}
                className={`quick-tag ${selectedTags.includes(tag.value) ? 'active' : ''}`}
                onClick={() => handleTagSelect(tag.value)}
              >
                <span className="tag-icon">{tag.icon}</span>
                <span className="tag-label">{tag.label}</span>
              </Tag>
            ))}
          </div>
        </div>

        {/* 查询按钮 */}
        <Button
          color="primary"
          size="large"
          block
          className="search-btn"
          onClick={handleSearch}
        >
          查询酒店
        </Button>
      </div>

      {/* 日期选择器弹窗 */}
      <Popup
        visible={datePickerVisible}
        onMaskClick={() => setDatePickerVisible(false)}
        bodyStyle={{ height: '50vh' }}
      >
        <div className="picker-header">
          <span className="picker-title">选择{dateType === 'checkIn' ? '入住' : '离店'}日期</span>
          <Button onClick={() => setDatePickerVisible(false)}>完成</Button>
        </div>
        <DatePicker
          value={dateType === 'checkIn' ? checkInDate : checkOutDate}
          onConfirm={handleDateConfirm}
          min={new Date()}
        />
      </Popup>

      {/* 星级选择器弹窗 */}
      <Popup
        visible={starPickerVisible}
        onMaskClick={() => setStarPickerVisible(false)}
        bodyStyle={{ height: '40vh' }}
      >
        <div className="picker-header">
          <span className="picker-title">选择星级</span>
          <Button onClick={() => setStarPickerVisible(false)}>完成</Button>
        </div>
        <div className="picker-list">
          {starOptions.map((option) => (
            <div
              key={option.value}
              className={`picker-item ${starRating === option.value ? 'active' : ''}`}
              onClick={() => {
                setStarRating(option.value);
                setStarPickerVisible(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      </Popup>

      {/* 价格选择器弹窗 */}
      <Popup
        visible={pricePickerVisible}
        onMaskClick={() => setPricePickerVisible(false)}
        bodyStyle={{ height: '40vh' }}
      >
        <div className="picker-header">
          <span className="picker-title">选择价格区间</span>
          <Button onClick={() => setPricePickerVisible(false)}>完成</Button>
        </div>
        <div className="picker-list">
          {priceOptions.map((option) => (
            <div
              key={option.value}
              className={`picker-item ${priceRange === option.value ? 'active' : ''}`}
              onClick={() => {
                setPriceRange(option.value);
                setPricePickerVisible(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      </Popup>
    </div>
  );
}

export default SearchPage;
