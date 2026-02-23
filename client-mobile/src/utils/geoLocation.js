/**
 * 地理定位工具 - 定位并解析为城市名
 * 优先使用后端百度地图（携程式），失败时回退到免费 API
 */

import { flatCities } from './cityData';

const getApiBase = () => {
  const h = window.location.hostname;
  return (h === 'localhost' || h === '127.0.0.1') ? 'http://localhost:3000/api' : `http://${h}:3000/api`;
};

function toCityFormat(name) {
  if (!name || !String(name).trim()) return null;
  const s = String(name).trim();
  return /[市地区州]$/.test(s) ? s : s + '市';
}

function matchCity(name) {
  const formatted = toCityFormat(name);
  if (!formatted) return null;
  const m = flatCities.find(f => f.label === formatted || f.label.includes(name) || name.includes(f.label.replace(/[市地区州]$/, '')));
  return m ? m.label : formatted;
}

function parseCityFromData(data) {
  const city = data.city || data.locality || data.principalSubdivision || '';
  const locality = data.locality || data.city || '';
  const province = data.principalSubdivision || '';

  if (!city && !locality && !province) return null;

  const candidates = [city, locality, province].filter(Boolean);
  for (const c of candidates) {
    const name = String(c).trim();
    if (!name) continue;
    const withSuffix = name.endsWith('市') || name.endsWith('地区') || name.endsWith('州') ? name : name + '市';
    const match = flatCities.find(
      f => f.label === withSuffix || f.label === name || f.label.includes(name) || name.includes(f.label.replace(/[市地区州]$/, ''))
    );
    if (match) return match.label;
    if (flatCities.some(f => f.label === withSuffix)) return withSuffix;
  }

  const first = (city || locality || province).trim();
  if (first) {
    const withSuffix = first.endsWith('市') || first.endsWith('地区') || first.endsWith('州') ? first : first + '市';
    return withSuffix;
  }
  return null;
}

/**
 * 根据经纬度逆地理编码获取城市名称
 * 1. 优先后端百度地图（需配置 BAIDU_MAP_AK，携程式定位）
 * 2. 备用 BigDataCloud
 * 3. 备用 Nominatim
 * @param {number} lat - 纬度
 * @param {number} lng - 经度
 * @returns {Promise<string|null>} 城市名称（如 北京市）
 */
export async function reverseGeocode(lat, lng) {
  // 1. 优先百度地图（后端代理，国内稳定）
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/geo/reverse?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.city) {
        const c = matchCity(json.data.city);
        if (c) return c;
      }
    }
  } catch { /* 继续备用 */ }

  // 2. BigDataCloud
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=zh`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const city = parseCityFromData(data);
      if (city) return city;
    }
  } catch { /* 继续备用 */ }

  // 3. Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EasyStay-Hotel/1.0' } });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || addr.state || '';
      if (city) return matchCity(city) || toCityFormat(city);
    }
  } catch { /* 忽略 */ }

  return null;
}

/**
 * IP 定位（当浏览器定位不可用时备用，如桌面端无 GPS）
 * 通过后端代理调用，避免 CORS 与混合内容问题
 * @returns {Promise<{ city: string }|{ error: string }>}
 */
async function getLocationCityByIP() {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/geo/ip`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    if (json.success && json.data && json.data.city) {
      const c = matchCity(json.data.city) || toCityFormat(json.data.city);
      if (c) return { city: c };
    }
  } catch { /* 忽略 */ }
  return { error: 'IP 定位失败' };
}

/**
 * 检查是否在 HTTPS 或 localhost 环境下
 * @returns {boolean}
 */
function isSecureContext() {
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
}

/**
 * 获取当前位置并解析为城市名（需用户主动点击触发）
 * 优先浏览器定位，失败时自动尝试 IP 定位（适合桌面端无 GPS）
 * @returns {Promise<{ city: string }|{ error: string }>}
 */
export async function getLocationCity() {
  // 如果不是安全上下文（HTTP 且非 localhost），直接使用 IP 定位
  if (!isSecureContext()) {
    const ipResult = await getLocationCityByIP();
    if (ipResult.city) {
      return ipResult;
    }
    return { error: '当前环境不支持浏览器定位，请使用 HTTPS 访问' };
  }

  if (!navigator.geolocation) {
    return getLocationCityByIP();
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const city = await reverseGeocode(latitude, longitude);
        if (city) resolve({ city });
        else resolve({ error: '无法解析当前位置' });
      },
      async (err) => {
        // 无论什么错误，都尝试 IP 定位
        const ipResult = await getLocationCityByIP();
        if (ipResult.city) {
          resolve(ipResult);
          return;
        }
        
        if (err.code === 1) {
          resolve({ error: '您已拒绝定位权限，正在使用 IP 定位...' });
          return;
        }
        const msg = err.code === 2 ? '定位失败，请检查网络或定位服务是否开启' : '定位超时';
        resolve({ error: msg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}
