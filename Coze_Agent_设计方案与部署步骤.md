# 易宿酒店 - Coze Agent 设计方案与部署步骤

## 一、方案概述

本方案旨在通过 **字节跳动 Coze（扣子）平台** 为易宿酒店移动端接入 AI 智能体，实现智能推荐、自然语言查询、以及**在回答中直接导向酒店详情页**等能力，提升用户预订体验。

---

## 二、核心功能设计

### 2.1 基础功能（必做）

| 功能 | 描述 | 实现要点 |
|------|------|----------|
| **智能推荐** | 根据用户偏好（城市、预算、出行场景等）自动推荐酒店 | Agent 调用酒店查询 API，结合对话理解用户需求 |
| **回答中跳转酒店** | 在回复中嵌入可点击的酒店链接，用户点击直达详情页 | 使用 Coze 的「卡片/链接」能力，或 Markdown 链接格式 |
| **自然语言搜索** | 用户用口语描述需求，如「武汉有停车场的便宜酒店」 | Agent 解析意图 → 调用 API → 返回结构化结果 |

### 2.2 扩展功能（建议）

| 功能 | 描述 | 价值 |
|------|------|------|
| **行程规划助手** | 根据入住/离店日期、人数，推荐房型与价格区间 | 提升转化率 |
| **比价与优惠提醒** | 对比同城同档次酒店价格，提示性价比高的选项 | 增强信任 |
| **常见问题解答** | 退订政策、入住时间、儿童政策等 FAQ | 降低客服压力 |
| **收藏与订单查询** | 用户可语音/文字查询「我的订单」「我的收藏」 | 提升粘性 |
| **多轮对话澄清** | 当需求模糊时主动追问（如「您更看重位置还是价格？」） | 提高推荐准确度 |

---

## 三、技术架构

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  易宿移动端      │     │  Coze 平台       │     │  易宿后端 API   │
│  (React)        │────▶│  Bot / 工作流    │────▶│  (Node/Express) │
│                 │     │  + 自定义插件    │     │  /api/hotels    │
│  聊天入口/浮窗   │◀────│                  │◀────│  /api/bookings  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### 3.1 数据流

1. 用户在移动端与 Agent 对话
2. Coze Bot 解析用户意图，通过**自定义插件（Plugin）**调用易宿后端 API
3. 后端返回酒店列表/详情
4. Agent 将结果组织成自然语言 + **可点击链接** 返回用户
5. 用户点击链接，跳转至 `/hotels/:id` 详情页

### 3.2 链接格式约定

为支持「回答中跳转酒店」，需统一链接格式，便于前端解析：

- **H5 详情页**：`https://your-domain.com/hotels/{hotelId}`
- **或使用 URL Scheme**（若为 App）：`easystay://hotels/{hotelId}`

Agent 在回复中输出 Markdown 链接，例如：

```markdown
为您推荐以下酒店：
1. [如家·武汉江汉路店](https://your-domain.com/hotels/1771234567890) - ¥299起
2. [汉庭·武汉光谷店](https://your-domain.com/hotels/1771234567891) - ¥189起
```

---

## 四、Coze 平台配置步骤

### 4.1 注册与创建 Bot

1. 打开 [Coze 官网](https://www.coze.cn)，注册/登录
2. 进入「创建应用」→ 选择「智能体」
3. 填写 Bot 名称：`易宿酒店助手`
4. 选择模型：推荐 `豆包大模型` 或 `GPT-4`（按需）

### 4.2 编写人设与提示词

在「人设与回复逻辑」中配置系统提示词，示例：

```
你是易宿酒店的智能客服助手，负责帮用户推荐酒店、解答预订相关问题。

## 能力
- 根据用户说的城市、预算、设施需求（如停车场、海景、亲子）推荐酒店
- 在推荐时，必须为每个酒店生成可点击链接，格式为：[酒店名](https://你的域名/hotels/{酒店ID})
- 可回答退订政策、入住时间等常见问题

## 约束
- 仅推荐易宿平台上的酒店，不编造信息
- 若用户需求无法满足，礼貌说明并建议调整条件
- 回复简洁，重点突出酒店名、价格、链接
```

### 4.3 创建自定义插件（Plugin）

Coze 支持通过「插件」调用外部 API，需为易宿后端创建插件：

1. 在 Bot 配置中进入「插件」→「创建插件」
2. 选择「API 插件」或「自定义 API」
3. 配置接口：

| 接口 | 方法 | 说明 |
|------|------|------|
| 搜索酒店 | GET | `https://你的后端域名/api/hotels?status=approved&keyword={keyword}&city={city}&limit=5` |
| 酒店详情 | GET | `https://你的后端域名/api/hotels/{id}` |

4. 配置鉴权（若后端需要）：在 Header 中添加 `Authorization` 或自定义 Token
5. 定义插件的「输入/输出」Schema，供 Bot 调用时解析

### 4.4 发布 Bot 并获取 API 凭证

1. 点击「发布」→ 选择「API 访问」
2. 获取 `Bot ID`、`API Key`（或 Personal Access Token）
3. 记录 API 端点，如：`https://api.coze.cn/v3/chat`

---

## 五、移动端集成方式

### 5.1 方案 A：Coze Web SDK（推荐）

Coze 提供 Web SDK，可在 H5 页面中嵌入聊天窗口：

```bash
npm install @coze-dev/coze-js
```

```jsx
// 在 SearchPage 或新建 AgentPage 中
import { CozeWebSDK } from '@coze-dev/coze-js';

useEffect(() => {
  const sdk = new CozeWebSDK({
    botId: 'YOUR_BOT_ID',
    // 可选：传入用户 ID、会话 ID
  });
  sdk.mount('#coze-chat-container');
  return () => sdk.unmount();
}, []);
```

在页面底部或 TabBar 旁增加「AI 助手」入口，点击后展开聊天浮窗。

### 5.2 方案 B：自建聊天 UI + Coze API

若需完全自定义 UI，可直接调用 Coze Chat API：

```javascript
// 调用示例
const response = await fetch('https://api.coze.cn/v3/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bot_id: 'YOUR_BOT_ID',
    user_id: 'user_' + userId,
    query: userInput,
    stream: false,
  }),
});
const data = await response.json();
// 解析 data.messages 中的回复，渲染为 UI
// 若包含 Markdown 链接，用 <a href="..."> 渲染，并监听点击跳转
```

### 5.3 链接跳转处理

在移动端路由中，确保 `/hotels/:id` 可被正确打开。若使用 React Router，需支持从外部链接（如 H5 分享链接）进入：

```jsx
// App.js 中已有
<Route path="/hotels/:id" element={<HotelDetailPage />} />
```

在聊天消息渲染组件中，解析 Markdown 链接，使用 `navigate()` 或 `window.location` 跳转：

```jsx
// 解析 [酒店名](url) 格式，将 url 中的 /hotels/xxx 提取为 id
const handleLinkClick = (url) => {
  const match = url.match(/\/hotels\/([^/?]+)/);
  if (match) navigate(`/hotels/${match[1]}`);
};
```

---

## 六、后端适配（可选）

若需 Agent 访问「我的订单」「我的收藏」等需登录的接口，需考虑：

1. **鉴权**：Coze 插件调用时，需携带用户 Token。可在 Bot 对话开始时让用户「绑定账号」，或通过 Coze 的「用户变量」传递加密 Token。
2. **CORS**：确保易宿后端允许 Coze 所在域名的跨域请求（或通过 Coze 服务端代理调用，无需 CORS）。
3. **限流**：对来自 Coze 的请求做限流，避免滥用。

当前易宿 `GET /api/hotels` 为公开接口，无需鉴权，可直接被 Coze 插件调用。

---

## 七、部署步骤清单

| 步骤 | 操作 | 预计耗时 |
|------|------|----------|
| 1 | 注册 Coze 账号，创建 Bot | 5 分钟 |
| 2 | 编写人设与提示词，强调「链接格式」 | 10 分钟 |
| 3 | 创建 API 插件，配置酒店搜索/详情接口 | 15 分钟 |
| 4 | 发布 Bot，获取 Bot ID 与 API Key | 5 分钟 |
| 5 | 在移动端安装 Coze SDK 或对接 Chat API | 30 分钟 |
| 6 | 添加「AI 助手」入口与聊天浮窗 | 20 分钟 |
| 7 | 实现链接解析与酒店详情页跳转 | 15 分钟 |
| 8 | 联调测试：对话 → 推荐 → 点击链接 → 详情页 | 20 分钟 |

**总计**：约 2 小时可完成基础集成。

---

## 八、测试用例

| 用例 | 用户输入 | 预期行为 |
|------|----------|----------|
| 1 | 「武汉有停车场的酒店」 | 返回若干酒店，每条带可点击链接 |
| 2 | 「预算 500 左右，北京」 | 返回价格区间内的酒店列表 + 链接 |
| 3 | 「海景房」 | 返回带海景标签的酒店 + 链接 |
| 4 | 点击回复中的酒店链接 | 跳转至该酒店详情页 |

---

## 九、后续优化方向

- **多轮对话记忆**：利用 Coze 的 `conversation_id` 保持上下文
- **流式输出**：启用 `stream: true`，提升响应体感
- **埋点统计**：记录「通过 Agent 推荐产生的点击/预订」转化率
- **多语言**：在提示词中支持英文，面向出境游用户

---

## 十、参考链接

- [Coze 开放平台文档](https://www.coze.cn/api/open/docs)
- [Coze Web SDK 使用说明](https://www.coze.cn/docs/developer_guides/web_sdk)
- [易宿后端 API 说明](http://localhost:3000)（本地启动后访问）
