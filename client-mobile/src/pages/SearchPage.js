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
  LocationFill
} from 'antd-mobile-icons';
import { hotelService } from '../services/api';
import CityPicker from '../components/CityPicker';
import { getLocationCity } from '../utils/geoLocation';
import CascadingDatePicker from '../components/CascadingDatePicker';
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
  const [hotTags, setHotTags] = useState([]);

  // UI状态
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('checkIn'); // 'checkIn' 或 'checkOut'
  const [starPickerVisible, setStarPickerVisible] = useState(false);
  const [pricePickerVisible, setPricePickerVisible] = useState(false);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [bannerHotels, setBannerHotels] = useState([]);
  const [bannerLoading, setBannerLoading] = useState(true);

  // 星级选项（与录入表单一致）
  const starOptions = [
    { label: '不限', value: null },
    { label: '五星级', value: 5 },
    { label: '四星级', value: 4 },
    { label: '三星级', value: 3 },
    { label: '二星级', value: 2 },
    { label: '经济型', value: 1 },
  ];

  // 价格区间选项
  const priceOptions = [
    { label: '不限', value: null },
    { label: '¥200以下', value: '0-200' },
    { label: '¥200-500', value: '200-500' },
    { label: '¥500-1000', value: '500-1000' },
    { label: '¥1000以上', value: '1000+' },
  ];

  // 获取Banner酒店数据 + 热门筛选标签（从实际数据统计，保证可匹配）
  useEffect(() => {
    fetchBannerHotels();
    hotelService.getHotTags(8).then(res => {
      if (res.data.success && res.data.data?.length) setHotTags(res.data.data);
    }).catch(() => {});
  }, []);

  /**
   * 获取Banner酒店数据
   */
  const fetchBannerHotels = async () => {
    try {
      setBannerLoading(true);
      const response = await hotelService.getHotels({ status: 'approved', limit: 5 });
      if (response.data.success && response.data.data.length > 0) {
        setBannerHotels(response.data.data.slice(0, 5));
      }
    } catch (error) {
      console.error('获取Banner酒店失败:', error);
    } finally {
      setBannerLoading(false);
    }
  };

  /**
   * 定位 - 用户主动点击后获取当前位置并填充目的城市
   */
  const handleManualLocation = async () => {
    setLocationLoading(true);
    try {
      const result = await getLocationCity();
      if (result.city) {
        setLocation(result.city);
        Toast.show({ content: `已定位到 ${result.city}`, position: 'center' });
      } else {
        Toast.show({ content: result.error || '定位失败', position: 'center', icon: 'fail' });
      }
    } catch {
      Toast.show({ content: '定位失败', position: 'center', icon: 'fail' });
    } finally {
      setLocationLoading(false);
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

  const handleHotSearch = (term) => {
    setKeyword(term);
    setLocation(term);
    addSearchHistory(term);
    const params = new URLSearchParams();
    params.append('keyword', term);
    params.append('city', term);
    if (checkInDate) params.append('checkIn', checkInDate.toISOString().split('T')[0]);
    if (checkOutDate) params.append('checkOut', checkOutDate.toISOString().split('T')[0]);
    if (starRating) params.append('star', starRating);
    if (priceRange) params.append('price', priceRange);
    navigate(`/hotels?${params.toString()}`);
  };

  const handleHotTagClick = (tag) => {
    const kw = keyword.trim() ? `${keyword} ${tag}` : tag;
    setKeyword(kw);
    addSearchHistory(tag);
  };

  const handleHistoryClick = (term) => {
    const params = new URLSearchParams();
    params.append('keyword', term);
    const cityVal = (location && location !== '请选择城市' && location !== '当前位置') ? location : (hotSearches.includes(term) ? term : '');
    if (cityVal) params.append('city', cityVal);
    if (checkInDate) params.append('checkIn', checkInDate.toISOString().split('T')[0]);
    if (checkOutDate) params.append('checkOut', checkOutDate.toISOString().split('T')[0]);
    if (starRating) params.append('star', starRating);
    if (priceRange) params.append('price', priceRange);
    navigate(`/hotels?${params.toString()}`);
  };

  /**
   * 处理Banner点击
   * @param {Object} hotel - 酒店数据
   */
  const handleBannerClick = (hotel) => {
    navigate(`/hotels/${hotel.id}`);
  };

  const SEARCH_HISTORY_KEY = 'easystay_search_history';
  const MAX_HISTORY = 8;
  const hotSearches = ['北京', '上海', '杭州', '成都', '三亚', '西安', '厦门', '丽江'];
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const getSearchHistory = () => {
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const addSearchHistory = (term) => {
    if (!term?.trim()) return;
    const hist = getSearchHistory().filter(h => h !== term.trim());
    hist.unshift(term.trim());
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(hist.slice(0, MAX_HISTORY)));
  };

  const clearSearchHistory = () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, '[]');
    setHistoryRefresh(r => r + 1);
  };

  const searchHistory = getSearchHistory();

  /**
   * 处理查询按钮点击
   */
  const handleSearch = () => {
    const params = new URLSearchParams();

    if (keyword.trim()) {
      params.append('keyword', keyword.trim());
      addSearchHistory(keyword.trim());
    }

    if (location && location !== '请选择城市' && location !== '当前位置') {
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

    navigate(`/hotels?${params.toString()}`);
  };

  /**
   * 渲染Banner区域
   */
  const renderBanner = () => {
    if (bannerLoading) {
      return (
        <div className="banner-skeleton">
          <div className="skeleton-shimmer" />
          <div className="skeleton-content">
            <div className="skeleton-line w60" />
            <div className="skeleton-line w80" />
            <div className="skeleton-line w40" />
          </div>
        </div>
      );
    }
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
        <Swiper
          autoplay
          loop
          className="banner-swiper"
          indicator={(total, current) => {
            const idx = bannerHotels.length > 0 ? current % bannerHotels.length : 0;
            return (
              <div className="banner-indicator">
                {bannerHotels.map((_, i) => (
                  <span key={i} className={`indicator-dot ${i === idx ? 'active' : ''}`} />
                ))}
              </div>
            );
          }}
        >
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
                      <span className="price-unit">起/晚</span>
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
          <div className="form-content location-content">
            <div className="location-row">
              <div className="form-label">目的地</div>
              <div className="form-value" onClick={() => setCityPickerVisible(true)}>
                {location || '请选择城市'}
              </div>
            </div>
            <Button
              size="small"
              fill="outline"
              color="primary"
              loading={locationLoading}
              className="location-btn"
              onClick={(e) => { e.stopPropagation(); handleManualLocation(); }}
            >
              <LocationFill style={{ marginRight: 4 }} />
              定位
            </Button>
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

        {/* 热门搜索 */}
        <div className="search-history-section">
          <div className="section-title">
            <SearchOutline className="section-icon" />
            <span>热门目的地</span>
          </div>
          <div className="hot-tags">
            {hotSearches.map((city) => (
              <Tag
                key={city}
                className="hot-tag"
                onClick={() => handleHotSearch(city)}
              >
                {city}
              </Tag>
            ))}
          </div>
        </div>

        {/* 搜索历史 */}
        {searchHistory.length > 0 && (
          <div className="search-history-section">
            <div className="section-title">
              <span>搜索历史</span>
              <span className="clear-history" onClick={clearSearchHistory}>清空</span>
            </div>
            <div className="hot-tags">
              {searchHistory.map((term) => (
                <Tag
                  key={term}
                  className="hot-tag history-tag"
                  onClick={() => handleHistoryClick(term)}
                >
                  {term}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {/* 智能搜索 + 热门筛选（数据驱动，保证可匹配） */}
        <div className="smart-search-section">
          <div className="section-title">
            <SearchOutline className="section-icon" />
            <span>智能搜索</span>
          </div>
          <SearchBar
            placeholder="试试：武汉、停车场、海景、亲子、近地铁..."
            value={keyword}
            onChange={setKeyword}
            className="smart-search-input"
          />
          {hotTags.length > 0 && (
            <div className="hot-tags-row">
              <span className="hot-tags-label">热门：</span>
              <div className="hot-tags-wrap">
                {hotTags.map((t) => (
                  <Tag key={t.value} className="hot-filter-tag" onClick={() => handleHotTagClick(t.label)}>
                    {t.label}
                  </Tag>
                ))}
              </div>
            </div>
          )}
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

      {/* 日期选择器弹窗 - 级联年月日 */}
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

      {/* 城市选择器 */}
      <CityPicker
        visible={cityPickerVisible}
        onClose={() => setCityPickerVisible(false)}
        value={location !== '请选择城市' && location !== '当前位置' ? location : ''}
        onSelect={(city) => setLocation(city)}
      />
    </div>
  );
}

export default SearchPage;
