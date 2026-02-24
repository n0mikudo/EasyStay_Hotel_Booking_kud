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

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  List,
  Card,
  Tag,
  Empty,
  Toast,
  NavBar,
  Popup,
  Button,
  SearchBar
} from 'antd-mobile';
import {
  EnvironmentOutline,
  FilterOutline,
  StarFill,
  RightOutline,
  UpOutline
} from 'antd-mobile-icons';
import { hotelService } from '../services/api';
import CityPicker from '../components/CityPicker';
import LazyImage from '../components/LazyImage';
import CascadingDatePicker from '../components/CascadingDatePicker';
import './HotelListPage.css';

const LIST_FILTER_KEY = 'easystay_list_filters';

const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toLocalDateStr = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const loadSavedListFilters = () => {
  try {
    const raw = sessionStorage.getItem(LIST_FILTER_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

function HotelListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsString = useMemo(() => searchParams.toString(), [searchParams]);

  const hasUrlParams = searchParamsString.length > 0;
  const savedList = hasUrlParams ? {} : loadSavedListFilters();

  // 筛选条件状态 — URL 参数优先，其次 sessionStorage
  const [keyword, setKeyword] = useState(
    searchParams.get('keyword') || savedList.keyword || ''
  );
  const [city, setCity] = useState(
    searchParams.get('city') || savedList.city || ''
  );
  const [checkInDate, setCheckInDate] = useState(
    parseLocalDate(searchParams.get('checkIn')) || parseLocalDate(savedList.checkIn) || new Date()
  );
  const [checkOutDate, setCheckOutDate] = useState(
    parseLocalDate(searchParams.get('checkOut')) || parseLocalDate(savedList.checkOut) || new Date(Date.now() + 86400000)
  );
  const [starRating, setStarRating] = useState(
    searchParams.get('star') || savedList.starRating || ''
  );
  const [priceRange, setPriceRange] = useState(
    searchParams.get('price') || savedList.priceRange || ''
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
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [dateType, setDateType] = useState('checkIn');

  // 筛选选项
  const starOptions = [
    { label: '不限', value: '' },
    { label: '豪华型', value: '5' },
    { label: '高档型', value: '4' },
    { label: '舒适型', value: '3' },
    { label: '经济型', value: '2' },
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

  const [sortBy, setSortBy] = useState(savedList.sortBy || 'default');
  const [showBackTop, setShowBackTop] = useState(false);

  // 筛选弹窗内的最新值（ref 同步更新，解决点击确定时 state 未 flush 导致需点两次的问题）
  const filterValuesRef = useRef({ starRating: '', priceRange: '' });
  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const queryStateRef = useRef({
    keyword: '',
    city: '',
    starRating: '',
    priceRange: '',
    sortBy: 'default',
    searchParamsString: ''
  });

  // 持久化筛选条件到 sessionStorage
  useEffect(() => {
    sessionStorage.setItem(LIST_FILTER_KEY, JSON.stringify({
      keyword, city,
      checkIn: toLocalDateStr(checkInDate),
      checkOut: toLocalDateStr(checkOutDate),
      starRating, priceRange, sortBy
    }));
  }, [keyword, city, checkInDate, checkOutDate, starRating, priceRange, sortBy]);

  // 弹窗打开时同步 ref，选项点击时也会同步
  useEffect(() => {
    if (filterVisible) {
      filterValuesRef.current = { starRating, priceRange };
    }
  }, [filterVisible, starRating, priceRange]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    queryStateRef.current = {
      keyword,
      city,
      starRating,
      priceRange,
      sortBy,
      searchParamsString
    };
  }, [keyword, city, starRating, priceRange, sortBy, searchParamsString]);

  // 当URL参数变化时同步状态
  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    setKeyword(params.get('keyword') || '');
    setCity(params.get('city') || '');
    const checkIn = parseLocalDate(params.get('checkIn'));
    const checkOut = parseLocalDate(params.get('checkOut'));
    if (checkIn) setCheckInDate(checkIn);
    if (checkOut) setCheckOutDate(checkOut);
    setStarRating(params.get('star') || '');
    setPriceRange(params.get('price') || '');
  }, [searchParamsString]);

  // 进入页面或搜索条件变化时，滚动到顶部
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    scrollToTop();
    requestAnimationFrame(scrollToTop);
  }, [searchParamsString]);

  // 回到顶部按钮显示逻辑
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /**
   * 加载酒店列表
   * @param {boolean} reset - 是否重置列表
   * @param {Object} overrides - 显式覆盖参数，解决 React 异步状态导致的「需点两次」问题
   * @param {string} overrides.sort - 排序方式
   * @param {Object} overrides.filters - 筛选条件 { keyword, city, star, price, tags }
   */
  const loadHotels = useCallback(async (reset = false, overrides = {}) => {
    // 用户主动点击（排序/筛选）时，即使 loading 中也执行，避免需点两次
    const isUserClick = reset && (overrides.sort !== undefined || overrides.filters);
    if (loadingRef.current && !isUserClick) return;

    try {
      setLoading(true);
      loadingRef.current = true;
      const currentPage = reset ? 1 : pageRef.current;
      const queryState = queryStateRef.current;
      const paramsFromUrl = new URLSearchParams(queryState.searchParamsString);

      // 优先使用 overrides 中的值（点击时立即生效），否则从 state/searchParams 读取
      const filters = overrides.filters || {};
      const kw = filters.keyword !== undefined ? filters.keyword : (paramsFromUrl.get('keyword') || queryState.keyword);
      const c = filters.city !== undefined ? filters.city : (paramsFromUrl.get('city') || queryState.city);
      const star = filters.star !== undefined ? filters.star : (paramsFromUrl.get('star') || queryState.starRating);
      const price = filters.price !== undefined ? filters.price : (paramsFromUrl.get('price') || queryState.priceRange);
      const sort = overrides.sort !== undefined ? overrides.sort : queryState.sortBy;

      const params = {
        status: 'approved',
        page: currentPage,
        limit: 10,
        sort
      };

      if (kw) params.keyword = kw;
      if (c) params.city = c;
      if (star) params.star = star;
      if (price) params.price = price;

      const response = await hotelService.getHotels(params);

      if (response.data.success) {
        const newHotels = response.data.data;
        setTotal(response.data.total || newHotels.length);

        if (reset) {
          setHotels(newHotels);
          setPage(2);
          pageRef.current = 2;
        } else {
          setHotels(prev => [...prev, ...newHotels]);
          setPage(prev => {
            const next = prev + 1;
            pageRef.current = next;
            return next;
          });
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
      loadingRef.current = false;
    }
  }, []);

  // 仅当 URL 参数变化时加载（排序由点击直接触发 loadHotels，不依赖此 effect）
  useEffect(() => {
    loadHotels(true);
  }, [searchParamsString, loadHotels]);

  /**
   * 手动点击加载更多
   */
  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    loadHotels(false);
  };

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
   * 应用筛选条件 - 从 ref 读取最新值，确保首次点击即生效（解决 React 异步 state 导致需点两次）
   */
  const applyFilters = () => {
    const { starRating: star, priceRange: price } = filterValuesRef.current;
    const params = new URLSearchParams();
    const checkInStr = checkInDate ? toLocalDateStr(checkInDate) : '';
    const checkOutStr = checkOutDate ? toLocalDateStr(checkOutDate) : '';

    if (keyword) params.append('keyword', keyword);
    if (city) params.append('city', city);
    if (checkInStr) params.append('checkIn', checkInStr);
    if (checkOutStr) params.append('checkOut', checkOutStr);
    if (star) params.append('star', star);
    if (price) params.append('price', price);

    setSearchParams(params);
    setFilterVisible(false);
  };

  const handleResetAll = () => {
    setKeyword('');
    setCity('');
    setCheckInDate(new Date());
    setCheckOutDate(new Date(Date.now() + 86400000));
    setStarRating('');
    setPriceRange('');
    setSortBy('default');
    filterValuesRef.current = { starRating: '', priceRange: '' };
    sessionStorage.removeItem(LIST_FILTER_KEY);
    sessionStorage.removeItem('easystay_search_filters');
    setSearchParams(new URLSearchParams());
    Toast.show({ content: '已重置所有筛选条件', position: 'center' });
  };

  /**
   * 处理酒店点击
   */
  const handleHotelClick = (hotel) => {
    navigate(`/hotels/${hotel.id}`, {
      state: {
        checkIn: toLocalDateStr(checkInDate),
        checkOut: toLocalDateStr(checkOutDate)
      }
    });
  };

  /**
   * 渲染酒店卡片
   */
  const renderHotelCard = (hotel) => {
    const amenities = hotel.amenities || [];
    const displayAmenities = amenities.slice(0, 3);
    const styleTag = hotel.rating >= 5 ? '豪华地标' : hotel.rating >= 4 ? '商旅优选' : '轻居舒适';
    const locationText = hotel.address || `${hotel.city}核心区`;

    return (
      <Card
        key={hotel.id}
        className="hotel-card"
        onClick={() => handleHotelClick(hotel)}
      >
        <div className="hotel-card-content">
          {/* 左侧图片 - 懒加载 */}
          <div className="hotel-image-wrapper">
            {hotel.images && hotel.images.length > 0 ? (
              <LazyImage
                src={hotel.images[0]}
                alt={hotel.name}
                className="hotel-image"
                fit="cover"
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
              <div className="hotel-title-wrap">
                <span className="hotel-style-tag">{styleTag}</span>
                <h3 className="hotel-name">{hotel.name}</h3>
              </div>
              <div className="hotel-rating">
                <StarFill className="rating-star" />
                <span className="rating-score">{hotel.rating || '4.5'}</span>
              </div>
            </div>

            <div className="hotel-location">
              <EnvironmentOutline className="location-icon" />
              <span className="location-text">{hotel.city} · {locationText}</span>
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
                {getNightsCount() > 1 && (
                  <span className="price-total">· {getNightsCount()}晚共¥{hotel.price * getNightsCount()}</span>
                )}
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
        back={null}
        right={
          <div className="nav-right" onClick={() => setFilterVisible(true)}>
            <FilterOutline className="filter-icon" />
            <span>筛选</span>
          </div>
        }
      >
        <div className="nav-content">
          <div className="nav-city" onClick={() => setCityPickerVisible(true)}>
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
              const newSort = option.value;
              setSortBy(newSort);
              loadHotels(true, { sort: newSort });
            }}
          >
            {option.label}
          </div>
        ))}
        <div className="sort-item reset-item" onClick={handleResetAll}>
          重置
        </div>
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
            <List className="hotel-list" style={{ '--border-inner': 'none' }}>
              {hotels.map(renderHotelCard)}
            </List>
            {hasMore ? (
              <div className="load-more-wrap">
                <Button
                  block
                  color="primary"
                  fill="outline"
                  loading={loading}
                  onClick={handleLoadMore}
                  className="load-more-btn"
                >
                  {loading ? '加载中...' : '加载更多'}
                </Button>
              </div>
            ) : hotels.length > 0 ? (
              <div className="load-more-tip">已加载全部</div>
            ) : null}
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
                    onClick={() => {
                      const v = option.value;
                      setStarRating(v);
                      filterValuesRef.current.starRating = v;
                    }}
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
                    onClick={() => {
                      const v = option.value;
                      setPriceRange(v);
                      filterValuesRef.current.priceRange = v;
                    }}
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
                filterValuesRef.current = { starRating: '', priceRange: '' };
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

      {/* 日期选择器 - 级联年月日 */}
      <Popup
        visible={datePickerVisible}
        onMaskClick={() => setDatePickerVisible(false)}
        bodyStyle={{ height: '50vh', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      >
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
          <CascadingDatePicker
            embedded
            visible={datePickerVisible}
            value={dateType === 'checkIn' ? checkInDate : checkOutDate}
            onConfirm={handleDateConfirm}
            onClose={() => setDatePickerVisible(false)}
            min={dateType === 'checkIn' ? new Date() : (checkInDate ? new Date(checkInDate.getTime() + 86400000) : new Date())}
            title={dateType === 'checkIn' ? '选择入住日期' : '选择离店日期'}
          />
        </div>
      </Popup>

      {/* 回到顶部 */}
      {showBackTop && (
        <div
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <UpOutline />
        </div>
      )}

      {/* 城市选择器 */}
      <CityPicker
        visible={cityPickerVisible}
        onClose={() => setCityPickerVisible(false)}
        value={city}
        onSelect={(c) => {
          setCity(c);
          setSearchParams(prev => {
            const p = new URLSearchParams(prev.toString());
            if (c) p.set('city', c); else p.delete('city');
            return p;
          });
          setCityPickerVisible(false);
        }}
      />
    </div>
  );
}

export default HotelListPage;
