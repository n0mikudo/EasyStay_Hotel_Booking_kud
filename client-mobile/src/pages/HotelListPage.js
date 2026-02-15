/**
 * 酒店列表页面组件
 *
 * 功能：
 * 1. 顶部核心条件筛选头：城市、入住/离店日期、入住间夜、搜索设置
 * 2. 详细筛选区域
 * 3. 酒店列表（支持上滑自动加载）
 * 4. 酒店信息维度：酒店名、评分、地址、价格等
 *
 * @component
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  List,
  Card,
  Image,
  Tag,
  Empty,
  Toast,
  NavBar,
  InfiniteScroll,
  Popup,
  Button,
  DatePicker,
  SearchBar
} from 'antd-mobile';
import {
  EnvironmentOutline,
  FilterOutline,
  StarFill,
  RightOutline
} from 'antd-mobile-icons';
import { hotelService } from '../services/api';
import './HotelListPage.css';

function HotelListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 筛选条件状态
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [checkInDate, setCheckInDate] = useState(
    searchParams.get('checkIn') ? new Date(searchParams.get('checkIn')) : new Date()
  );
  const [checkOutDate, setCheckOutDate] = useState(
    searchParams.get('checkOut') ? new Date(searchParams.get('checkOut')) : new Date(Date.now() + 86400000)
  );
  const [starRating, setStarRating] = useState(searchParams.get('star') || '');
  const [priceRange, setPriceRange] = useState(searchParams.get('price') || '');
  const [selectedTags, setSelectedTags] = useState(
    searchParams.get('tags') ? searchParams.get('tags').split(',') : []
  );

  // 酒店列表状态
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // UI状态
  const [filterVisible, setFilterVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('checkIn');

  // 筛选选项
  const starOptions = [
    { label: '不限', value: '' },
    { label: '五星级', value: '5' },
    { label: '四星级', value: '4' },
    { label: '三星级', value: '3' },
    { label: '二星级及以下', value: '2' },
  ];

  const priceOptions = [
    { label: '不限', value: '' },
    { label: '¥200以下', value: '0-200' },
    { label: '¥200-500', value: '200-500' },
    { label: '¥500-1000', value: '500-1000' },
    { label: '¥1000以上', value: '1000+' },
  ];

  const sortOptions = [
    { label: '推荐', value: 'default' },
    { label: '价格最低', value: 'price_asc' },
    { label: '价格最高', value: 'price_desc' },
    { label: '评分最高', value: 'rating' },
  ];

  const [sortBy, setSortBy] = useState('default');

  // 初始化加载
  useEffect(() => {
    loadHotels(true);
  }, [searchParams]);

  /**
   * 加载酒店列表
   * @param {boolean} reset - 是否重置列表
   */
  const loadHotels = async (reset = false) => {
    if (loading) return;

    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;

      const params = {
        status: 'approved',
        page: currentPage,
        limit: 10,
        sort: sortBy
      };

      // 添加筛选条件
      if (keyword) params.keyword = keyword;
      if (city) params.city = city;
      if (starRating) params.star = starRating;
      if (priceRange) params.price = priceRange;
      if (selectedTags.length > 0) params.tags = selectedTags.join(',');

      const response = await hotelService.getHotels(params);

      if (response.data.success) {
        const newHotels = response.data.data;
        setTotal(response.data.total || newHotels.length);

        if (reset) {
          setHotels(newHotels);
          setPage(2);
        } else {
          setHotels(prev => [...prev, ...newHotels]);
          setPage(prev => prev + 1);
        }

        setHasMore(newHotels.length === 10);
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
   * 无限滚动加载更多
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadHotels(false);
  }, [hasMore, loading, page]);

  /**
   * 格式化日期显示
   */
  const formatDate = (date) => {
    if (!date) return '';
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  /**
   * 计算入住天数
   */
  const getNightsCount = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  /**
   * 处理日期选择
   */
  const handleDateConfirm = (date) => {
    if (dateType === 'checkIn') {
      setCheckInDate(date);
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
   * 应用筛选条件
   */
  const applyFilters = () => {
    const params = new URLSearchParams();

    if (keyword) params.append('keyword', keyword);
    if (city) params.append('city', city);
    if (checkInDate) params.append('checkIn', checkInDate.toISOString().split('T')[0]);
    if (checkOutDate) params.append('checkOut', checkOutDate.toISOString().split('T')[0]);
    if (starRating) params.append('star', starRating);
    if (priceRange) params.append('price', priceRange);
    if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));

    setSearchParams(params);
    setFilterVisible(false);
    loadHotels(true);
  };

  /**
   * 处理酒店点击
   */
  const handleHotelClick = (hotel) => {
    navigate(`/hotels/${hotel.id}`);
  };

  /**
   * 渲染酒店卡片
   */
  const renderHotelCard = (hotel) => {
    const amenities = hotel.amenities || [];
    const displayAmenities = amenities.slice(0, 3);

    return (
      <Card
        key={hotel.id}
        className="hotel-card"
        onClick={() => handleHotelClick(hotel)}
      >
        <div className="hotel-card-content">
          {/* 左侧图片 */}
          <div className="hotel-image-wrapper">
            {hotel.images && hotel.images.length > 0 ? (
              <Image
                src={hotel.images[0]}
                alt={hotel.name}
                fit="cover"
                className="hotel-image"
                placeholder={<div className="image-placeholder">加载中...</div>}
              />
            ) : (
              <div className="hotel-image-placeholder">
                <span className="placeholder-icon">🏨</span>
              </div>
            )}
            {hotel.isRecommended && (
              <div className="recommend-badge">推荐</div>
            )}
          </div>

          {/* 右侧信息 */}
          <div className="hotel-info">
            <div className="hotel-header">
              <h3 className="hotel-name">{hotel.name}</h3>
              <div className="hotel-rating">
                <StarFill className="rating-star" />
                <span className="rating-score">{hotel.rating || '4.5'}</span>
              </div>
            </div>

            <div className="hotel-location">
              <EnvironmentOutline className="location-icon" />
              <span className="location-text">{hotel.city} · {hotel.address}</span>
            </div>

            {/* 设施标签 */}
            <div className="hotel-amenities">
              {displayAmenities.map((amenity, index) => (
                <Tag key={index} className="amenity-tag" color="primary" fill="outline">
                  {amenity}
                </Tag>
              ))}
            </div>

            {/* 价格和操作 */}
            <div className="hotel-footer">
              <div className="price-section">
                <span className="price-symbol">¥</span>
                <span className="price-value">{hotel.price}</span>
                <span className="price-unit">起/晚</span>
              </div>
              <Button
                size="small"
                color="primary"
                className="view-btn"
              >
                查看详情
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="hotel-list-page">
      {/* 顶部导航栏 */}
      <NavBar
        className="list-nav"
        onBack={() => navigate('/')}
        right={
          <div className="nav-right" onClick={() => setFilterVisible(true)}>
            <FilterOutline className="filter-icon" />
            <span>筛选</span>
          </div>
        }
      >
        <div className="nav-content">
          <div className="nav-city" onClick={() => Toast.show({ content: '城市选择功能开发中', position: 'center' })}>
            {city || '全部城市'}
            <RightOutline className="city-arrow" />
          </div>
          <div className="nav-date" onClick={() => setDatePickerVisible(true)}>
            <span className="date-text">{formatDate(checkInDate)}</span>
            <span className="date-separator">-</span>
            <span className="date-text">{formatDate(checkOutDate)}</span>
            <span className="nights-text">({getNightsCount()}晚)</span>
          </div>
        </div>
      </NavBar>

      {/* 搜索栏 */}
      <div className="search-section">
        <SearchBar
          placeholder="搜索酒店名称"
          value={keyword}
          onChange={setKeyword}
          onSearch={() => loadHotels(true)}
          className="list-search-bar"
        />
      </div>

      {/* 排序选项 */}
      <div className="sort-section">
        {sortOptions.map((option) => (
          <div
            key={option.value}
            className={`sort-item ${sortBy === option.value ? 'active' : ''}`}
            onClick={() => {
              setSortBy(option.value);
              loadHotels(true);
            }}
          >
            {option.label}
          </div>
        ))}
      </div>

      {/* 酒店列表 */}
      <div className="hotels-container">
        {hotels.length === 0 && !loading ? (
          <Empty
            className="empty-state"
            description="暂无符合条件的酒店"
          />
        ) : (
          <>
            <List className="hotel-list">
              {hotels.map(renderHotelCard)}
            </List>
            <InfiniteScroll
              loadMore={loadMore}
              hasMore={hasMore}
            />
          </>
        )}
      </div>

      {/* 结果统计 */}
      {total > 0 && (
        <div className="result-count">
          共找到 {total} 家酒店
        </div>
      )}

      {/* 筛选弹窗 */}
      <Popup
        visible={filterVisible}
        onMaskClick={() => setFilterVisible(false)}
        position="right"
        bodyStyle={{ width: '80vw', height: '100vh' }}
      >
        <div className="filter-popup">
          <div className="filter-header">
            <h3>筛选条件</h3>
            <Button onClick={() => setFilterVisible(false)}>关闭</Button>
          </div>

          <div className="filter-content">
            {/* 星级筛选 */}
            <div className="filter-group">
              <div className="filter-label">星级</div>
              <div className="filter-options">
                {starOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`filter-option ${starRating === option.value ? 'active' : ''}`}
                    onClick={() => setStarRating(option.value)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            </div>

            {/* 价格筛选 */}
            <div className="filter-group">
              <div className="filter-label">价格区间</div>
              <div className="filter-options">
                {priceOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`filter-option ${priceRange === option.value ? 'active' : ''}`}
                    onClick={() => setPriceRange(option.value)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="filter-footer">
            <Button
              className="reset-btn"
              onClick={() => {
                setStarRating('');
                setPriceRange('');
              }}
            >
              重置
            </Button>
            <Button
              color="primary"
              className="confirm-btn"
              onClick={applyFilters}
            >
              确定
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
          <span className="picker-title">选择日期</span>
          <Button onClick={() => setDatePickerVisible(false)}>完成</Button>
        </div>
        <div className="date-picker-content">
          <div className="date-type-selector">
            <Button
              className={dateType === 'checkIn' ? 'active' : ''}
              onClick={() => setDateType('checkIn')}
            >
              入住: {formatDate(checkInDate)}
            </Button>
            <Button
              className={dateType === 'checkOut' ? 'active' : ''}
              onClick={() => setDateType('checkOut')}
            >
              离店: {formatDate(checkOutDate)}
            </Button>
          </div>
          <DatePicker
            value={dateType === 'checkIn' ? checkInDate : checkOutDate}
            onConfirm={handleDateConfirm}
            min={new Date()}
          />
        </div>
      </Popup>
    </div>
  );
}

export default HotelListPage;
