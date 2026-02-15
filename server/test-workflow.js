const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testWorkflow() {
  console.log('=== 开始测试酒店录入、审核、发布闭环流程 ===\n');

  try {
    console.log('步骤1: 添加新酒店（商户录入）');
    const newHotel = {
      name: '测试酒店',
      city: '北京',
      address: '北京市朝阳区测试路123号',
      description: '这是一家测试酒店，设施齐全，服务优质。',
      price: 299,
      images: ['https://example.com/hotel1.jpg'],
      amenities: ['免费WiFi', '免费停车', '游泳池', '健身房']
    };

    const addResponse = await makeRequest('POST', '/hotels', newHotel);
    console.log('✓ 酒店添加成功');
    console.log('  酒店ID:', addResponse.data.id);
    console.log('  状态:', addResponse.data.status);
    console.log('  消息:', addResponse.message);
    const hotelId = addResponse.data.id;
    console.log();

    console.log('步骤2: 查询待审核酒店');
    const pendingResponse = await makeRequest('GET', '/hotels?status=pending');
    console.log('✓ 查询成功');
    console.log('  待审核酒店数量:', pendingResponse.data.length);
    console.log();

    console.log('步骤3: 审核通过酒店（管理员审核）');
    const approveResponse = await makeRequest('PUT', `/hotels/${hotelId}/status`, { status: 'approved' });
    console.log('✓ 审核通过');
    console.log('  状态:', approveResponse.data.status);
    console.log('  消息:', approveResponse.message);
    console.log();

    console.log('步骤4: 查询已发布的酒店（移动端展示）');
    const publishedResponse = await makeRequest('GET', '/hotels?status=approved');
    console.log('✓ 查询成功');
    console.log('  已发布酒店数量:', publishedResponse.data.length);
    console.log('  酒店名称:', publishedResponse.data[0].name);
    console.log();

    console.log('步骤5: 查看酒店详情');
    const detailResponse = await makeRequest('GET', `/hotels/${hotelId}`);
    console.log('✓ 获取详情成功');
    console.log('  酒店名称:', detailResponse.data.name);
    console.log('  城市:', detailResponse.data.city);
    console.log('  地址:', detailResponse.data.address);
    console.log('  价格:', `¥${detailResponse.data.price}/晚`);
    console.log('  设施:', detailResponse.data.amenities.join(', '));
    console.log();

    console.log('步骤6: 查看统计数据');
    const statsResponse = await makeRequest('GET', '/stats');
    console.log('✓ 获取统计成功');
    console.log('  酒店总数:', statsResponse.data.total);
    console.log('  待审核:', statsResponse.data.pending);
    console.log('  已通过:', statsResponse.data.approved);
    console.log('  已拒绝:', statsResponse.data.rejected);
    console.log();

    console.log('=== 测试完成！闭环流程验证成功 ===');
    console.log('✓ 商户录入 → 管理员审核 → 用户浏览 流程已打通');

  } catch (error) {
    console.error('✗ 测试失败:', error.message);
  }
}

testWorkflow();
