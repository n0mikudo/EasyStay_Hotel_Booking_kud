#!/usr/bin/env node
/**
 * EasyStay 酒店数据库批量导入脚本
 *
 * 功能：
 * 1. 批量生成商户与酒店虚拟数据
 * 2. 绕过注册机制直接写入 JSON
 * 3. 导入前自动备份，导入后校验
 *
 * 用法：
 *   node scripts/seed-database.js
 *   node scripts/seed-database.js --merchants=100 --hotels=500
 *   node scripts/seed-database.js -m 80 -h 400
 *   node scripts/seed-database.js --replace-seed   # 替换模式：移除 seed 来源的酒店与商户后重新导入
 *   node scripts/seed-database.js --dedupe-only     # 仅去重：同商户+同酒店名只保留第一条
 *
 * 去重规则：同一商户(userId)下同一酒店名(name)只保留第一条
 */

const fs = require('fs');
const path = require('path');

const cityList = require('./cityList');
const {
  pick,
  pickN,
  randomInt,
  generateId,
  generateUserId,
  HOTEL_BRANDS,
  HOTEL_SUFFIXES,
  STREET_PREFIXES,
  STREET_SUFFIXES,
  AMENITIES_POOL,
  ROOM_TYPES_BASE,
  MERCHANT_SURNAMES,
  MERCHANT_GIVEN_NAMES,
  DESCRIPTION_TEMPLATES,
  DISTRICT_NAMES,
  TAGS_POOL
} = require('./seed-data');

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HOTELS_FILE = path.join(DATA_DIR, 'hotels.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

function parseArgs() {
  const args = process.argv.slice(2);
  let merchants = 80;
  let hotels = 420;
  let simpleUsernames = false;
  let replaceSeed = false;
  let dedupeOnly = false;
  for (const arg of args) {
    if (arg.startsWith('--merchants=')) merchants = parseInt(arg.split('=')[1], 10) || 80;
    if (arg.startsWith('-m')) merchants = parseInt(args[args.indexOf(arg) + 1], 10) || 80;
    if (arg.startsWith('--hotels=')) hotels = parseInt(arg.split('=')[1], 10) || 420;
    if (arg.startsWith('-h')) hotels = parseInt(args[args.indexOf(arg) + 1], 10) || 420;
    if (arg === '--simple-usernames' || arg === '-s') simpleUsernames = true;
    if (arg === '--replace-seed' || arg === '-r') replaceSeed = true;
    if (arg === '--dedupe-only') dedupeOnly = true;
  }
  return { merchants, hotels, simpleUsernames, replaceSeed, dedupeOnly };
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function backup() {
  ensureBackupDir();
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  if (fs.existsSync(USERS_FILE)) {
    fs.copyFileSync(USERS_FILE, path.join(BACKUP_DIR, `users_${ts}.json`));
  }
  if (fs.existsSync(HOTELS_FILE)) {
    fs.copyFileSync(HOTELS_FILE, path.join(BACKUP_DIR, `hotels_${ts}.json`));
  }
  console.log('[备份] 已备份至 data/backups/');
}

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.users) ? data.users : data;
  } catch {
    return [];
  }
}

function readHotels() {
  try {
    const raw = fs.readFileSync(HOTELS_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : (data.hotels || []);
  } catch {
    return [];
  }
}

function writeUsers(users) {
  const obj = { users };
  fs.writeFileSync(USERS_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

function writeHotels(hotels) {
  fs.writeFileSync(HOTELS_FILE, JSON.stringify(hotels, null, 2), 'utf8');
}

/**
 * 去重：同一商户(userId)下同一酒店名(name)只保留第一条
 * 返回去重后的酒店列表及被移除数量
 */
function dedupeHotels(hotels) {
  const seen = new Set();
  const kept = [];
  let removed = 0;
  for (const h of hotels) {
    const key = `${h.userId || 'no-user'}|${(h.name || '').trim()}`;
    if (seen.has(key)) {
      removed++;
      continue;
    }
    seen.add(key);
    kept.push(h);
  }
  return { hotels: kept, removed };
}

function generateMerchantName() {
  const s = pick(MERCHANT_SURNAMES);
  const g1 = pick(MERCHANT_GIVEN_NAMES);
  const g2 = Math.random() > 0.5 ? pick(MERCHANT_GIVEN_NAMES) : '';
  return s + g1 + g2;
}

function generateMerchants(count, simpleUsernames = false) {
  const merchants = [];
  const usernames = new Set();
  for (let i = 0; i < count; i++) {
    let username;
    if (simpleUsernames) {
      username = 'merchant_' + (i + 1);
    } else {
      do {
        username = 'merchant_' + (i + 1) + '_' + Math.random().toString(36).substr(2, 6);
      } while (usernames.has(username));
    }
    usernames.add(username);
    merchants.push({
      id: generateUserId(),
      username,
      password: 'merchant123',
      role: 'merchant',
      name: generateMerchantName(),
      phone: '1' + randomInt(3, 9) + String(randomInt(100000000, 999999999)),
      email: username + '@easystay.demo',
      createdAt: new Date(Date.now() - randomInt(0, 365) * 86400000).toISOString()
    });
  }
  return merchants;
}

let _idCounter = 0;
function nextId() {
  return (Date.now() + _idCounter++).toString() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateHotel(merchantId, cityInfo, index) {
  const brand = pick(HOTEL_BRANDS);
  const suffix = pick(HOTEL_SUFFIXES);
  const cityShort = cityInfo.city.replace(/(市|省|自治区|特别行政区|地区|自治州)$/, '') || cityInfo.city;
  const name = brand + '·' + cityShort + (index > 0 ? index + '号' : '') + suffix;
  const nameEn = brand + ' ' + cityInfo.city + ' Hotel';
  const district = pick(DISTRICT_NAMES);
  const street = pick(STREET_PREFIXES) + pick(STREET_SUFFIXES);
  const address = `${cityInfo.province}${cityInfo.city}${district}${street}${randomInt(1, 999)}号`;
  const totalRooms = randomInt(30, 300);
  const floorCount = randomInt(5, 25);
  const amenities = pickN(AMENITIES_POOL, randomInt(5, 12));
  const amenitiesSample = amenities.slice(0, 4).join('、');
  const roomCount = randomInt(2, 5);
  const basePrice = randomInt(150, 800);
  const roomTypes = [];
  const usedTypes = new Set();
  for (let i = 0; i < roomCount; i++) {
    let rt;
    do {
      rt = pick(ROOM_TYPES_BASE);
    } while (usedTypes.has(rt.name));
    usedTypes.add(rt.name);
    const price = Math.round(basePrice * rt.priceBase * (0.9 + Math.random() * 0.2));
    roomTypes.push({
      name: rt.name,
      price,
      description: rt.desc || ''
    });
  }
  const minPrice = Math.min(...roomTypes.map(r => r.price));
  const template = pick(DESCRIPTION_TEMPLATES);
  const description = template
    .replace('{city}', cityInfo.city)
    .replace('{district}', district)
    .replace('{totalRooms}', totalRooms)
    .replace('{amenitiesSample}', amenitiesSample)
    .replace('{brand}', brand);
  const rating = randomInt(3, 5);
  const openDate = `${randomInt(2015, 2023)}年${randomInt(1, 12)}月`;
  const lat = 39 + Math.random() * 15;
  const lng = 115 + Math.random() * 20;
  const tags = pickN(TAGS_POOL, randomInt(1, 4));
  const images = [
    `https://picsum.photos/seed/${nextId()}/800/600`,
    `https://picsum.photos/seed/${nextId()}/800/600`,
    `https://picsum.photos/seed/${nextId()}/800/600`
  ];
  const now = new Date().toISOString();
  return {
    id: nextId(),
    userId: merchantId,
    name,
    nameEn,
    city: cityInfo.city,
    address,
    description,
    price: minPrice,
    rating,
    phone: '1' + randomInt(3, 9) + String(randomInt(100000000, 999999999)),
    images,
    amenities,
    roomTypes,
    openDate,
    status: 'approved',
    createdAt: now,
    updatedAt: now,
    province: cityInfo.province,
    district,
    businessZone: district + '商圈',
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6)),
    tags,
    checkInTime: '14:00',
    checkOutTime: '12:00',
    totalRooms,
    floorCount,
    brand,
    source: 'seed'
  };
}

function run() {
  const { merchants: mCount, hotels: hCount, simpleUsernames, replaceSeed, dedupeOnly } = parseArgs();

  if (dedupeOnly) {
    console.log('\n========== 仅执行去重 ==========\n');
    backup();
    const hotels = readHotels();
    const { hotels: deduped, removed } = dedupeHotels(hotels);
    writeHotels(deduped);
    console.log(`去重完成: 保留 ${deduped.length} 家, 移除 ${removed} 家重复\n`);
    return;
  }

  console.log('\n========== EasyStay 数据库批量导入 ==========\n');
  console.log(`配置: 商户 ${mCount} 家, 酒店 ${hCount} 家${replaceSeed ? ' [替换模式]' : ''}\n`);

  backup();

  let existingUsers = readUsers();
  let existingHotels = readHotels();

  if (replaceSeed) {
    const allHotels = existingHotels;
    const nonSeedHotels = allHotels.filter(h => h.source !== 'seed');
    const merchantIdsWithNonSeed = new Set(nonSeedHotels.map(h => h.userId));
    const seedMerchantIds = new Set(allHotels.filter(h => h.source === 'seed').map(h => h.userId).filter(Boolean));
    const seedOnlyMerchantIds = [...seedMerchantIds].filter(id => !merchantIdsWithNonSeed.has(id));
    existingHotels = nonSeedHotels;
    existingUsers = existingUsers.filter(u => u.role === 'admin' || !seedOnlyMerchantIds.includes(u.id));
    console.log(`[替换] 已移除 seed 来源的酒店与商户\n`);
  }

  const adminUsers = existingUsers.filter(u => u.role === 'admin');
  const existingMerchants = existingUsers.filter(u => u.role === 'merchant');

  const newMerchants = generateMerchants(mCount, simpleUsernames);
  const allMerchants = [...existingMerchants, ...newMerchants];
  const mergedUsers = [...adminUsers, ...allMerchants];

  const existingKeys = new Set(existingHotels.map(h => `${h.userId || 'no-user'}|${(h.name || '').trim()}`));
  const newHotels = [];
  const hotelsPerMerchant = Math.ceil(hCount / newMerchants.length);
  let skipped = 0;
  for (const merchant of newMerchants) {
    const count = Math.min(hotelsPerMerchant, hCount - newHotels.length);
    for (let i = 0; i < count && newHotels.length < hCount; i++) {
      const cityInfo = pick(cityList);
      const hotel = generateHotel(merchant.id, cityInfo, i);
      const key = `${hotel.userId}|${(hotel.name || '').trim()}`;
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }
      existingKeys.add(key);
      newHotels.push(hotel);
    }
  }

  const mergedHotels = [...existingHotels, ...newHotels];

  writeUsers(mergedUsers);
  writeHotels(mergedHotels);

  console.log('[导入] 完成\n');
  console.log('统计:');
  console.log(`  用户: ${mergedUsers.length} (管理员 ${adminUsers.length}, 商户 ${allMerchants.length})`);
  console.log(`  酒店: ${mergedHotels.length} (新增 ${newHotels.length})`);
  console.log(`  城市覆盖: ${[...new Set(mergedHotels.map(h => h.city))].length} 个`);
  if (skipped > 0) {
    console.log(`  跳过重复: ${skipped} 家（同商户+同名称已存在）`);
  }
  console.log('\n校验:');
  const withUserId = mergedHotels.filter(h => h.userId);
  const validRoomTypes = mergedHotels.filter(h => h.roomTypes && h.roomTypes.length > 0);
  console.log(`  关联商户: ${withUserId.length}/${mergedHotels.length}`);
  console.log(`  有效房型: ${validRoomTypes.length}/${mergedHotels.length}`);
  if (newMerchants.length > 0) {
    console.log('商户登录: 用户名见 users.json，密码 merchant123');
    if (simpleUsernames) {
      console.log('  (本次使用简单用户名: merchant_1, merchant_2, ...)');
    } else {
      console.log('  导出凭证: node scripts/export-merchant-credentials.js');
    }
  }
  console.log('\n========== 导入完成 ==========\n');
}

run();
