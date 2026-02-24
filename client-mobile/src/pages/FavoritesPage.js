/**
 * 我的收藏页面
 * 展示用户收藏的酒店（本地存储）
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Empty, Image, Button } from 'antd-mobile';
import { EnvironmentOutline, LeftOutline } from 'antd-mobile-icons';
import { hotelService } from '../services/api';
import './FavoritesPage.css';

const FAVORITES_KEY = 'easystay_favorites';

function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function FavoritesPage() {
  const navigate = useNavigate();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getFavorites();
    setFavoriteIds(ids);
    if (ids.length > 0) {
      loadHotels(ids);
    } else {
      setLoading(false);
    }
  }, []);

  const loadHotels = async (ids) => {
    try {
      setLoading(true);
      const all = await Promise.all(
        ids.map(id => hotelService.getHotelById(id).then(r => r.data.success ? r.data.data : null))
      );
      setHotels(all.filter(Boolean));
    } catch {
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (e, id) => {
    e.stopPropagation();
    const next = favoriteIds.filter(i => i !== id);
    setFavoriteIds(next);
    setHotels(prev => prev.filter(h => h.id !== id));
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  return (
    <div className="favorites-page">
      <NavBar
        className="fav-nav"
        back={null}
        left={
          <button
            type="button"
            className="fav-back-entry"
            onClick={() => navigate('/profile')}
            aria-label="返回我的"
          >
            <LeftOutline />
          </button>
        }
      >
        <span className="nav-title">我的收藏</span>
      </NavBar>

      <div className="fav-content">
        {loading ? (
          <div className="fav-loading">加载中...</div>
        ) : hotels.length === 0 ? (
          <Empty
            className="fav-empty"
            description="暂无收藏"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="fav-list">
            {hotels.map((hotel) => (
              <Card
                key={hotel.id}
                className="fav-card"
                onClick={() => navigate(`/hotels/${hotel.id}`)}
              >
                <div className="fav-card-inner">
                  <div className="fav-image">
                    {hotel.images?.[0] ? (
                      <Image src={hotel.images[0]} alt={hotel.name} fit="cover" />
                    ) : (
                      <div className="fav-placeholder">🏨</div>
                    )}
                  </div>
                  <div className="fav-info">
                    <div className="fav-name">{hotel.name}</div>
                    <div className="fav-location">
                      <EnvironmentOutline /> {hotel.city} · {hotel.address}
                    </div>
                    <div className="fav-footer">
                      <span className="fav-price">¥{hotel.price}起</span>
                      <Button
                        size="mini"
                        fill="outline"
                        color="danger"
                        onClick={(e) => handleRemove(e, hotel.id)}
                      >
                        取消收藏
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoritesPage;
