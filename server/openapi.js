const openapi = {
  openapi: '3.0.3',
  info: {
    title: '易宿酒店预订平台后端 API',
    version: '1.0.0',
    description: '覆盖认证、酒店、预订、消息、系统配置、客户端用户与 AI 对话接口。',
  },
  servers: [
    { url: 'http://81.71.15.150', description: '公网 IP（演示）' },
    { url: 'https://easystay4u.site', description: '域名 HTTPS（可选）' },
    { url: 'http://localhost:3000', description: '本地开发' },
  ],
  tags: [
    { name: 'Health', description: '服务健康检查' },
    { name: 'Auth', description: '管理员/商户认证' },
    { name: 'Hotels', description: '酒店管理与审核' },
    { name: 'Bookings', description: '订单管理' },
    { name: 'Stats', description: '统计与分析' },
    { name: 'Messages', description: '消息中心' },
    { name: 'Users', description: '用户管理' },
    { name: 'Settings', description: '系统配置与权限' },
    { name: 'Geo', description: '定位服务' },
    { name: 'InviteCodes', description: '邀请码管理' },
    { name: 'Activities', description: '最近活动' },
    { name: 'AI', description: 'AI 搜索与对话' },
    { name: 'ClientAuth', description: '移动端用户认证' },
    { name: 'ClientChat', description: '移动端会话管理' },
  ],
  components: {
    schemas: {
      ApiSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: '操作成功' },
        },
      },
      UserCredentials: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', example: 'admin123' },
        },
      },
      HotelCreatePayload: {
        type: 'object',
        required: ['userId', 'name', 'city', 'address', 'description', 'rating', 'phone', 'roomTypesStr'],
        properties: {
          userId: { type: 'string', example: 'merchant_001' },
          name: { type: 'string', example: '北京中关村智选酒店' },
          city: { type: 'string', example: '北京市' },
          address: { type: 'string', example: '海淀区中关村大街 88 号' },
          description: { type: 'string', example: '地铁旁，适合商旅出行。' },
          rating: { type: 'integer', example: 4 },
          phone: { type: 'string', example: '13800138000' },
          roomTypesStr: { type: 'string', example: '标准间:299\n大床房:359' },
          amenities: { type: 'array', items: { type: 'string' }, example: ['免费WiFi', '早餐'] },
          images: { type: 'array', items: { type: 'string' } },
        },
      },
      BookingPayload: {
        type: 'object',
        required: ['hotelId', 'hotelName', 'roomType', 'roomPrice', 'checkIn', 'checkOut', 'nights', 'roomCount', 'totalPrice'],
        properties: {
          hotelId: { type: 'string', example: '1737352566001' },
          hotelName: { type: 'string', example: '三亚海棠湾度假酒店' },
          roomType: { type: 'string', example: '豪华海景房' },
          roomPrice: { type: 'number', example: 699 },
          checkIn: { type: 'string', example: '2026-02-27' },
          checkOut: { type: 'string', example: '2026-03-01' },
          nights: { type: 'integer', example: 2 },
          guestCount: { type: 'integer', example: 2 },
          roomCount: { type: 'integer', example: 1 },
          totalPrice: { type: 'number', example: 1398 },
          clientUserId: { type: 'string', example: 'cu_1740000000_abcde' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: '健康检查',
        responses: {
          '200': { description: '服务正常' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: '管理员/商户登录',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCredentials' } } },
        },
        responses: {
          '200': { description: '登录成功' },
          '401': { description: '用户名或密码错误' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: '管理员/商户注册',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password', 'role', 'name', 'phone'],
                properties: {
                  username: { type: 'string', example: 'merchant2' },
                  password: { type: 'string', example: 'merchant123' },
                  role: { type: 'string', enum: ['admin', 'merchant'], example: 'merchant' },
                  name: { type: 'string', example: '张三' },
                  phone: { type: 'string', example: '13800001234' },
                  email: { type: 'string', example: 'merchant2@example.com' },
                  inviteCode: { type: 'string', example: 'ABCD1234' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: '注册成功' },
          '400': { description: '参数校验失败' },
          '409': { description: '用户名已存在' },
        },
      },
    },
    '/api/hotels': {
      get: {
        tags: ['Hotels'],
        summary: '获取酒店列表（支持筛选/排序/分页）',
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string' }, description: '如 approved,offline' },
          { in: 'query', name: 'keyword', schema: { type: 'string' } },
          { in: 'query', name: 'city', schema: { type: 'string' } },
          { in: 'query', name: 'star', schema: { type: 'integer' } },
          { in: 'query', name: 'price', schema: { type: 'string' }, description: '0-200/200-500/500-1000/1000+' },
          { in: 'query', name: 'sort', schema: { type: 'string' }, description: 'price_asc/price_desc/rating/default' },
          { in: 'query', name: 'page', schema: { type: 'integer' } },
          { in: 'query', name: 'limit', schema: { type: 'integer' } },
          { in: 'query', name: 'userId', schema: { type: 'string' } },
          { in: 'query', name: 'role', schema: { type: 'string', enum: ['admin', 'merchant'] } },
        ],
        responses: { '200': { description: '成功' } },
      },
      post: {
        tags: ['Hotels'],
        summary: '创建酒店（默认待审核）',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/HotelCreatePayload' } } },
        },
        responses: { '201': { description: '创建成功' }, '400': { description: '参数错误' } },
      },
    },
    '/api/hotels/hot-tags': {
      get: {
        tags: ['Hotels'],
        summary: '获取热门筛选标签',
        parameters: [{ in: 'query', name: 'limit', schema: { type: 'integer', default: 8 } }],
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/hotels/{id}': {
      get: {
        tags: ['Hotels'],
        summary: '获取酒店详情',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'userId', schema: { type: 'string' } },
        ],
        responses: { '200': { description: '成功' }, '404': { description: '不存在' } },
      },
      put: {
        tags: ['Hotels'],
        summary: '更新酒店信息',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'userId', schema: { type: 'string' } },
          { in: 'query', name: 'role', schema: { type: 'string', enum: ['admin', 'merchant'] } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/HotelCreatePayload' } } },
        },
        responses: { '200': { description: '成功' } },
      },
      delete: {
        tags: ['Hotels'],
        summary: '删除酒店（管理员需先下线）',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'userId', schema: { type: 'string' } },
          { in: 'query', name: 'role', schema: { type: 'string', enum: ['admin', 'merchant'] } },
        ],
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/hotels/{id}/status': {
      put: {
        tags: ['Hotels'],
        summary: '更新酒店状态（审核/上线/下线）',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'offline'] },
                  rejectReason: { type: 'string' },
                  adminId: { type: 'string' },
                  adminUsername: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/hotels/{id}/admin': {
      put: {
        tags: ['Hotels'],
        summary: '管理员修改酒店（待商户确认）',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/hotels/{id}/audit-dismiss': {
      put: {
        tags: ['Hotels'],
        summary: '归档单条审核记录（仅从审核列表移除）',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/hotels/batch-audit-dismiss': {
      post: {
        tags: ['Hotels'],
        summary: '批量归档审核记录',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['ids'], properties: { ids: { type: 'array', items: { type: 'string' } } } },
            },
          },
        },
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/stats': {
      get: { tags: ['Stats'], summary: '统计概览', responses: { '200': { description: '成功' } } },
    },
    '/api/stats/risk-alerts': {
      get: { tags: ['Stats'], summary: '经营风险预警', responses: { '200': { description: '成功' } } },
    },
    '/api/stats/analytics': {
      get: { tags: ['Stats'], summary: '分析报表数据', responses: { '200': { description: '成功' } } },
    },
    '/api/activities': {
      get: { tags: ['Activities'], summary: '获取最近活动', responses: { '200': { description: '成功' } } },
    },
    '/api/invite-codes': {
      post: {
        tags: ['InviteCodes'],
        summary: '生成管理员邀请码',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['adminUserId'], properties: { adminUserId: { type: 'string' } } } } },
        },
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/messages': {
      get: {
        tags: ['Messages'],
        summary: '获取消息通知',
        parameters: [
          { in: 'query', name: 'role', required: true, schema: { type: 'string', enum: ['admin', 'merchant'] } },
          { in: 'query', name: 'userId', schema: { type: 'string' } },
          { in: 'query', name: 'adminId', schema: { type: 'string' } },
        ],
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/messages/{id}/read': {
      put: {
        tags: ['Messages'],
        summary: '标记消息已读',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { adminId: { type: 'string' } } } } } },
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/messages/{id}/process': {
      put: {
        tags: ['Messages'],
        summary: '标记消息已处理（管理员）',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['adminId', 'adminUsername'],
                properties: { adminId: { type: 'string' }, adminUsername: { type: 'string' } },
              },
            },
          },
        },
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/messages/{id}': {
      delete: {
        tags: ['Messages'],
        summary: '删除消息',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: '获取用户列表',
        parameters: [
          { in: 'query', name: 'q', schema: { type: 'string' } },
          { in: 'query', name: 'hotelZero', schema: { type: 'string' } },
        ],
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/users/{id}': {
      delete: {
        tags: ['Users'],
        summary: '删除用户',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/users/batch-delete': {
      post: {
        tags: ['Users'],
        summary: '批量删除用户',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['ids'], properties: { ids: { type: 'array', items: { type: 'string' } } } },
            },
          },
        },
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/bookings': {
      get: {
        tags: ['Bookings'],
        summary: '获取订单列表',
        parameters: [
          { in: 'query', name: 'hotelId', schema: { type: 'string' } },
          { in: 'query', name: 'userId', schema: { type: 'string' } },
          { in: 'query', name: 'role', schema: { type: 'string', enum: ['admin', 'merchant'] } },
          { in: 'query', name: 'clientUserId', schema: { type: 'string' } },
        ],
        responses: { '200': { description: '成功' } },
      },
      post: {
        tags: ['Bookings'],
        summary: '创建订单',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingPayload' } } },
        },
        responses: { '201': { description: '创建成功' }, '400': { description: '参数错误' } },
      },
    },
    '/api/bookings/{id}': {
      get: {
        tags: ['Bookings'],
        summary: '获取订单详情',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '成功' } },
      },
      delete: {
        tags: ['Bookings'],
        summary: '删除订单',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/bookings/{id}/cancel': {
      patch: {
        tags: ['Bookings'],
        summary: '取消订单',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/settings': {
      get: { tags: ['Settings'], summary: '获取系统配置', responses: { '200': { description: '成功' } } },
      put: {
        tags: ['Settings'],
        summary: '更新系统配置',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/permissions': {
      get: { tags: ['Settings'], summary: '权限矩阵', responses: { '200': { description: '成功' } } },
    },
    '/api/system-logs': {
      get: {
        tags: ['Settings'],
        summary: '系统日志',
        parameters: [{ in: 'query', name: 'limit', schema: { type: 'integer', default: 100 } }],
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/geo/ip': {
      get: { tags: ['Geo'], summary: 'IP 定位', responses: { '200': { description: '成功' } } },
    },
    '/api/geo/reverse': {
      get: {
        tags: ['Geo'],
        summary: '逆地理编码',
        parameters: [
          { in: 'query', name: 'lat', required: true, schema: { type: 'number' } },
          { in: 'query', name: 'lng', required: true, schema: { type: 'number' } },
        ],
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/ai/search': {
      get: {
        tags: ['AI'],
        summary: 'AI 酒店检索',
        parameters: [
          { in: 'query', name: 'city', schema: { type: 'string' } },
          { in: 'query', name: 'keyword', schema: { type: 'string' } },
          { in: 'query', name: 'price_min', schema: { type: 'number' } },
          { in: 'query', name: 'price_max', schema: { type: 'number' } },
          { in: 'query', name: 'star', schema: { type: 'integer' } },
          { in: 'query', name: 'tags', schema: { type: 'string' } },
          { in: 'query', name: 'sort', schema: { type: 'string' } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 5 } },
        ],
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/chat': {
      post: {
        tags: ['AI'],
        summary: 'AI 对话（SSE 流式）',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: '帮我推荐北京地铁附近酒店' },
                  mode: { type: 'string', enum: ['fast', 'deep'], default: 'fast' },
                  conversation_id: { type: 'string' },
                  session_id: { type: 'string' },
                  user_id: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'SSE 流式响应（text/event-stream）' },
          '503': { description: 'AI 服务未配置' },
        },
      },
    },
    '/api/client/auth/login': {
      post: {
        tags: ['ClientAuth'],
        summary: '移动端手机号验证码登录',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'code'],
                properties: {
                  phone: { type: 'string', example: '13800001234' },
                  code: { type: 'string', example: '8888' },
                },
              },
            },
          },
        },
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/client/auth/profile': {
      get: {
        tags: ['ClientAuth'],
        summary: '获取移动端用户资料',
        parameters: [{ in: 'header', name: 'x-client-uid', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '成功' }, '401': { description: '未登录' } },
      },
      put: {
        tags: ['ClientAuth'],
        summary: '更新移动端用户资料',
        parameters: [{ in: 'header', name: 'x-client-uid', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { nickname: { type: 'string' } } } } } },
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/client/chat/sessions': {
      get: {
        tags: ['ClientChat'],
        summary: '获取会话列表',
        parameters: [{ in: 'query', name: 'user_id', schema: { type: 'string' } }],
        responses: { '200': { description: '成功' } },
      },
      post: {
        tags: ['ClientChat'],
        summary: '创建会话',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['user_id'], properties: { user_id: { type: 'string' }, mode: { type: 'string', enum: ['fast', 'deep'] } } } } },
        },
        responses: { '200': { description: '成功' } },
      },
    },
    '/api/client/chat/sessions/{id}': {
      get: {
        tags: ['ClientChat'],
        summary: '获取会话详情',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '成功' } },
      },
      put: {
        tags: ['ClientChat'],
        summary: '重命名会话',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['title'], properties: { title: { type: 'string' } } } } } },
        responses: { '200': { description: '成功' } },
      },
      delete: {
        tags: ['ClientChat'],
        summary: '删除会话',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: '成功' } },
      },
    },
  },
};

module.exports = openapi;
