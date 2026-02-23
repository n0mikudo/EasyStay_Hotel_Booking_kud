const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_PATH, 'users.json');
const HOTELS_FILE = path.join(DATA_PATH, 'hotels.json');

const merchantLastNames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '高', '罗'];
const merchantFirstNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀英', '华', '平', '刚'];

const companyPrefixes = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆', '天津', '苏州', '长沙', '青岛', '大连', '宁波', '厦门', '沈阳', '哈尔滨', '济南'];
const companySuffixes = ['酒店管理有限公司', '酒店投资管理有限公司', '旅游发展有限公司', '商务酒店管理有限公司', '国际酒店管理有限公司', '精品酒店管理有限公司', '度假村管理有限公司', '快捷酒店管理有限公司'];

function generateRandomPhone() {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', 
                   '150', '151', '152', '153', '155', '156', '157', '158', '159',
                   '180', '181', '182', '183', '184', '185', '186', '187', '188', '189'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
}

function generateRandomName() {
  const lastName = merchantLastNames[Math.floor(Math.random() * merchantLastNames.length)];
  const firstName = merchantFirstNames[Math.floor(Math.random() * merchantFirstNames.length)];
  return lastName + firstName;
}

function generateCompanyName(city) {
  const cityPrefix = city.replace('市', '').replace('省', '');
  const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
  const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return cityPrefix + randomNum + suffix;
}

function generateUserId() {
  const timestamp = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const randomStr = Math.random().toString(36).substr(2, 9);
  return 'user_' + timestamp + '_' + randomStr;
}

function main() {
  console.log('🚀 开始批量生成商户并分配酒店...');
  
  const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  const hotels = JSON.parse(fs.readFileSync(HOTELS_FILE, 'utf8'));
  
  console.log(`📊 现有用户数量: ${usersData.users.length}`);
  console.log(`🏨 现有酒店数量: ${hotels.length}`);
  
  const existingMerchants = usersData.users.filter(u => u.role === 'merchant');
  const existingUsernames = new Set(usersData.users.map(u => u.username));
  
  console.log(`👥 现有商户数量: ${existingMerchants.length}`);
  
  const hotelsWithoutUserId = hotels.filter(h => !h.userId);
  console.log(`🏨 需要分配商户的酒店数量: ${hotelsWithoutUserId.length}`);
  
  const hotelsPerMerchant = 8;
  const newMerchantCount = Math.ceil(hotelsWithoutUserId.length / hotelsPerMerchant);
  
  console.log(`👥 需要生成的新商户数量: ${newMerchantCount}`);
  
  const newMerchants = [];
  const merchantHotelMap = new Map();
  
  for (let i = 0; i < newMerchantCount; i++) {
    let username = `merchant${existingMerchants.length + i + 1}`;
    while (existingUsernames.has(username)) {
      username = `merchant${existingMerchants.length + i + 1}_${Math.floor(Math.random() * 1000)}`;
    }
    
    const name = generateRandomName();
    const userId = generateUserId();
    const phone = generateRandomPhone();
    const companyName = generateCompanyName(hotelsWithoutUserId[i * hotelsPerMerchant]?.city || '北京');
    
    const merchant = {
      id: userId,
      username: username,
      password: 'merchant123',
      role: 'merchant',
      name: name,
      phone: phone,
      email: '',
      company: companyName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    newMerchants.push(merchant);
    existingUsernames.add(username);
    
    merchantHotelMap.set(userId, []);
  }
  
  let merchantIndex = 0;
  const allMerchants = [...existingMerchants, ...newMerchants];
  
  for (const hotel of hotelsWithoutUserId) {
    const merchant = allMerchants[merchantIndex % allMerchants.length];
    hotel.userId = merchant.id;
    hotel.updatedAt = new Date().toISOString();
    merchantHotelMap.get(merchant.id)?.push(hotel.id);
    merchantIndex++;
  }
  
  usersData.users = [...usersData.users, ...newMerchants];
  
  fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
  fs.writeFileSync(HOTELS_FILE, JSON.stringify(hotels, null, 2));
  
  console.log('\n✅ 完成！');
  console.log(`👥 新增商户: ${newMerchants.length}`);
  console.log(`🏨 已分配商户的酒店: ${hotelsWithoutUserId.length}`);
  
  console.log('\n📋 新增商户账号列表:');
  console.log('------------------------------------------------');
  console.log('用户名\t\t密码\t\t姓名\t\t公司');
  console.log('------------------------------------------------');
  for (const merchant of newMerchants) {
    const companyDisplay = (merchant.company || '').substring(0, 10);
    console.log(`${merchant.username}\tmerchant123\t${merchant.name}\t${companyDisplay}`);
  }
  console.log('------------------------------------------------');
  console.log('\n💡 所有新增商户密码均为: merchant123');
}

main().catch(console.error);
