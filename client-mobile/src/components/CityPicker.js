/**
 * 城市选择组件 - 级联选择（先选省再选市）
 * 与商户录入酒店时的做法一致
 */

import React, { useState, useMemo } from 'react';
import { Popup, SearchBar, List, Button, Toast } from 'antd-mobile';
import { LocationFill } from 'antd-mobile-icons';
import { cityDataNested, hotCities } from '../utils/cityData';
import { getLocationCity } from '../utils/geoLocation';
import './CityPicker.css';

function CityPicker({ visible, onClose, value, onSelect }) {
  const [step, setStep] = useState('province'); // 'province' | 'city'
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const currentProvince = useMemo(() => {
    if (!selectedProvince) return null;
    return cityDataNested.find(p => p.label === selectedProvince);
  }, [selectedProvince]);

  const filteredProvinces = useMemo(() => {
    if (!keyword.trim()) return cityDataNested;
    const kw = keyword.trim().toLowerCase();
    return cityDataNested.filter(
      p => p.label.toLowerCase().includes(kw) ||
        (p.children || []).some(c => c.label.toLowerCase().includes(kw))
    );
  }, [keyword]);

  const filteredCities = useMemo(() => {
    if (!currentProvince) return [];
    const currentCities = currentProvince.children || [];
    if (!keyword.trim()) return currentCities;
    const kw = keyword.trim().toLowerCase();
    return currentCities.filter(c => c.label.toLowerCase().includes(kw));
  }, [currentProvince, keyword]);

  const handleSelectProvince = (prov) => {
    setSelectedProvince(prov.label);
    setStep('city');
    setKeyword('');
  };

  const handleSelectCity = (city) => {
    onSelect(city.label);
    onClose();
  };

  const handleBack = () => {
    setStep('province');
    setSelectedProvince(null);
    setKeyword('');
  };

  const handleHotCity = (city) => {
    onSelect(city);
    onClose();
  };

  const handleManualLocation = async () => {
    setLocationLoading(true);
    try {
      const result = await getLocationCity();
      if (result.city) {
        onSelect(result.city);
        onClose();
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

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="bottom"
      bodyStyle={{ height: '70vh', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
    >
      <div className="city-picker">
        <div className="city-picker-header">
          {step === 'city' ? (
            <span className="picker-back" onClick={handleBack}>← 返回</span>
          ) : (
            <span className="picker-title">选择城市</span>
          )}
          <span className="picker-close" onClick={onClose}>完成</span>
        </div>

        <div className="city-picker-search">
          <SearchBar
            placeholder={step === 'province' ? '搜索省份或城市' : `搜索${selectedProvince}内城市`}
            value={keyword}
            onChange={setKeyword}
            className="city-search-bar"
          />
        </div>

        {step === 'province' && !keyword && (
          <div className="manual-location-row">
            <Button
              size="small"
              fill="outline"
              color="primary"
              loading={locationLoading}
              className="manual-location-btn"
              onClick={handleManualLocation}
            >
              <LocationFill style={{ marginRight: 6 }} />
              定位当前位置
            </Button>
          </div>
        )}

        {step === 'province' && !keyword && (
          <div className="hot-cities">
            <div className="section-title">热门城市</div>
            <div className="hot-cities-grid">
              {hotCities.map(city => (
                <div
                  key={city}
                  className={`hot-city-item ${value === city ? 'active' : ''}`}
                  onClick={() => handleHotCity(city)}
                >
                  {city}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="city-list-section">
          <div className="section-title">
            {step === 'province'
              ? (keyword ? `搜索结果 (${filteredProvinces.length})` : '选择省份')
              : (keyword ? `搜索结果 (${filteredCities.length})` : `${selectedProvince} - 选择城市`)}
          </div>
          <div className="city-list-wrap">
            {step === 'province' ? (
              <List className="city-list">
                {filteredProvinces.map(prov => (
                  <List.Item
                    key={prov.value}
                    className="city-list-item province-item"
                    onClick={() => handleSelectProvince(prov)}
                    arrow
                  >
                    {prov.label}
                  </List.Item>
                ))}
              </List>
            ) : (
              <List className="city-list">
                {filteredCities.map(city => (
                  <List.Item
                    key={city.value}
                    className={`city-list-item ${value === city.label ? 'active' : ''}`}
                    onClick={() => handleSelectCity(city)}
                  >
                    {city.label}
                  </List.Item>
                ))}
              </List>
            )}
          </div>
        </div>
      </div>
    </Popup>
  );
}

export default CityPicker;
