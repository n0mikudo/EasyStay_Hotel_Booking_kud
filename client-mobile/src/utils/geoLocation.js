/**
 * 地理定位工具 - 定位并解析为城市名
 * 优先使用后端百度地图（携程式），失败时回退到免费 API
 */

import { flatCities } from './cityData';

const getApiBase = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  return '/api';
};

function hasGarbledChars(text) {
  if (!text) return false;
  return String(text).includes('�');
}

function decodeMojibake(text) {
  if (!text) return text;
  const raw = String(text);
  try {
    // 常见 latin1/utf8 错位修复（如 æ­¦æ± -> 武汉）
    const repaired = decodeURIComponent(escape(raw));
    return repaired || raw;
  } catch {
    return raw;
  }
}

function normalizeCityText(name) {
  if (!name) return '';
  const repaired = decodeMojibake(name);
  return String(repaired).trim();
}

function stripCitySuffix(name) {
  return String(name || '').replace(/[市地区州盟]$/, '');
}

function isDistrictLevelName(name) {
  if (!name) return false;
  return /(区|县|旗|镇|乡|街道)$/.test(String(name));
}

function matchCity(name) {
  const normalized = normalizeCityText(name);
  if (!normalized) return null;
  if (!/[\u4e00-\u9fa5]/.test(normalized)) return null;
  if (isDistrictLevelName(normalized)) return null;

  const normalizedBase = stripCitySuffix(normalized);
  const m = flatCities.find(
    f => f.label === normalized ||
      stripCitySuffix(f.label) === normalizedBase ||
      f.label.includes(normalized) ||
      normalized.includes(stripCitySuffix(f.label))
  );
  return m ? m.label : null;
}

export function normalizeDetectedCity(name) {
  return matchCity(name) || null;
}

function parseCityFromData(data) {
  const city = data.city || data.locality || data.principalSubdivision || '';
  const locality = data.locality || data.city || '';
  const province = data.principalSubdivision || '';

  if (!city && !locality && !province) return null;

  const candidates = [city, locality, province].filter(Boolean);
  for (const c of candidates) {
    const name = normalizeCityText(c);
    if (!name) continue;
    const matched = matchCity(name);
    if (matched) return matched;
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
        if (c && !hasGarbledChars(c)) return c;
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
      if (city) return matchCity(city);
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
      const c = matchCity(json.data.city);
      if (c && !hasGarbledChars(c)) return { city: c };
    }
  } catch { /* 忽略 */ }
  return { error: 'IP 定位失败' };
}

/**
 * 获取当前位置并解析为城市名（需用户主动点击触发）
 * 优先浏览器定位，失败时自动尝试 IP 定位（适合桌面端无 GPS）
 * @returns {Promise<{ city: string }|{ error: string }>}
 */
export async function getLocationCity() {
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
          resolve({ error: '未授予定位权限，且 IP 定位失败' });
          return;
        }
        const msg = err.code === 2 ? '定位失败，请检查网络或定位服务是否开启（HTTP 下部分浏览器会限制 GPS）' : '定位超时';
        resolve({ error: msg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}
