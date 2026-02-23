const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_PATH, 'users.json');
const HOTELS_FILE = path.join(DATA_PATH, 'hotels.json');

const merchantLastNames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '高', '罗', '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹'];
const merchantFirstNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀英', '华', '平', '刚', '桂英', '玉兰', '玉珍', '秀兰', '文', '志', '建', '国', '海', '波', '宇', '浩', '轩', '俊', '凯', '婷', '雪', '琳', '欣'];
const companySuffixes = ['酒店管理有限公司', '酒店投资管理有限公司', '旅游发展有限公司', '商务酒店管理有限公司'];
const usedNames = new Set();
const usedUsernames = new Set();

function generateRandomPhone() {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
}

function generateUniqueName() {
  let attempts = 0;
  while (attempts < 500) {
    const lastName = merchantLastNames[Math.floor(Math.random() * merchantLastNames.length)];
    const firstName = merchantFirstNames[Math.floor(Math.random() * merchantFirstNames.length)];
    const name = lastName + firstName;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
    attempts++;
  }
  const lastName = merchantLastNames[Math.floor(Math.random() * merchantLastNames.length)];
  const firstName = merchantFirstNames[Math.floor(Math.random() * merchantFirstNames.length)];
  const num = Math.floor(Math.random() * 1000);
  return lastName + firstName + num;
}

function generateUsername(brand, city, index) {
  const brandShort = brand ? brand.replace(/酒店|连锁|快捷|精选|智选|优佳|优品|轻雅|时尚|智好|商旅|者行孙|青年|和家|和颐|青季|富驿|丽枫|希岸|维也纳|汉庭|锦江之星|格林豪泰|如家|7天|速8|布丁/gi, '') : '';
  const cityShort = city.replace(/市|省|特别行政区/gi, '');
  let base = '';
  if (brandShort && brandShort.length > 0) {
    base = brandShort.toLowerCase().replace(/\s+/g, '') + '_' + cityShort.toLowerCase().replace(/\s+/g, '');
  } else {
    base = cityShort.toLowerCase().replace(/\s+/g, '');
  }
  base = base.replace(/[^a-z0-9_]/g, '');
  if (base.length === 0) base = 'merchant';
  let username = base;
  let counter = index;
  while (usedUsernames.has(username)) {
    username = base + counter;
    counter++;
  }
  usedUsernames.add(username);
  return username;
}

function generateCompanyName(city, brand) {
  const cityPrefix = city.replace('市', '').replace('省', '');
  const brandPart = brand ? brand.replace(/酒店/gi, '') : '';
  const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
  if (brandPart && brandPart.length > 0) {
    return cityPrefix + brandPart + suffix;
  }
  const randomNum = Math.floor(Math.random() * 1000);
  return cityPrefix + randomNum + suffix;
}

function generateUserId() {
  const timestamp = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const randomStr = Math.random().toString(36).substr(2, 9);
  return 'user_' + timestamp + '_' + randomStr;
}

function main() {
  console.log('🚀 开始批量生成商户（优化版）...');
  
  const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  let hotels = JSON.parse(fs.readFileSync(HOTELS_FILE, 'utf8'));
  
  const existingAdminUsers = usersData.users.filter(u => u.role === 'admin');
  const usersToKeep = existingAdminUsers.concat(usersData.users.filter(u => u.role === 'merchant' && !u.username.startsWith('merchant')));
  
  usersData.users = usersToKeep;
  
  for (const hotel of hotels) {
    delete hotel.userId;
  }
  
  const existingUsernames = new Set(usersData.users.map(u => u.username));
  for (const username of existingUsernames) {
    usedUsernames.add(username);
  }
  
  console.log(`�� 保留管理员: ${existingAdminUsers.length} 人`);
  console.log(`📊 保留老商户: ${usersData.users.length - existingAdminUsers.length} 人`);
  console.log(`🏨 酒店总数: ${hotels.length}`);
  
  const hotelGroups = new Map();
  
  for (const hotel of hotels) {
    const brand = hotel.brand || '';
    const city = hotel.city || '未知城市';
    const key = brand + '|' + city;
    if (!hotelGroups.has(key)) {
      hotelGroups.set(key, []);
    }
    hotelGroups.get(key).push(hotel);
  }
  
  console.log(`📦 分组数量: ${hotelGroups.size} 个（按品牌+城市）`);
  
  const newMerchants = [];
  let merchantIndex = 1;
  
  for (const [key, groupHotels] of hotelGroups) {
    const [brand, city] = key.split('|');
    let groupIndex = 0;
    while (groupIndex < groupHotels.length) {
      const batchSize = Math.min(Math.floor(Math.random() * 10) + 5, groupHotels.length - groupIndex);
      const merchantHotels = groupHotels.slice(groupIndex, groupIndex + batchSize);
      
      const name = generateUniqueName();
      const username = generateUsername(brand, city, merchantIndex);
      const userId = generateUserId();
      const phone = generateRandomPhone();
      const companyName = generateCompanyName(city, brand);
      
      const merchant = {
        id: userId,
        username: username,
        password: 'merchant123',
        role: 'merchant',
        name: name,
        phone: phone,
        email: '',
        company: companyName,
        brand: brand || '',
        city: city,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      newMerchants.push(merchant);
      
      for (const hotel of merchantHotels) {
        hotel.userId = userId;
        hotel.updatedAt = new Date().toISOString();
      }
      
      groupIndex += batchSize;
      merchantIndex++;
    }
  }
  
  usersData.users = [...usersData.users, ...newMerchants];
  
  fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
  fs.writeFileSync(HOTELS_FILE, JSON.stringify(hotels, null, 2));
  
  console.log('\\n✅ 完成！');
  console.log(`👥 新增商户: ${newMerchants.length}`);
  console.log(`🏨 已分配商户的酒店: ${hotels.filter(h => h.userId).length}`);
  
  console.log('\\n📋 前30个新增商户账号列表:');
  console.log('--------------------------------------------------------------------------------');
  console.log('用户名\\t\\t\\t密码\\t\\t姓名\\t\\t城市\\t\\t品牌');
  console.log('--------------------------------------------------------------------------------');
  
  for (let i = 0; i < Math.min(30, newMerchants.length); i++) {
    const merchant = newMerchants[i];
    const brandDisplay = (merchant.brand || '').substring(0, 8);
    const cityDisplay = (merchant.city || '').substring(0, 6);
    const usernamePad = merchant.username.padEnd(20);
    console.log(`${usernamePad}\\tmerchant123\\t${merchant.name}\\t${cityDisplay}\\t${brandDisplay}`);
  }
  
  if (newMerchants.length > 30) {
    console.log(`... 还有 ${newMerchants.length - 30} 个商户未显示`);
  }
  
  console.log('--------------------------------------------------------------------------------');
  console.log('\\n💡 所有新增商户密码均为: merchant123');
}

main();
