# 易宿酒店预订平台

一个完整的酒店预订系统，包含移动端用户界面和PC端管理界面。

## 项目信息

- **服务器 IP**: 81.71.15.150
- **域名**: easystay4u.site（已配置 HTTPS + Let's Encrypt 证书）
- **项目目录**: /root/hotel/EasyStay_Hotel_Booking_kud
- **访问地址**:
  - 管理端: https://easystay4u.site
  - 移动端: https://easystay4u.site/mobile/
  - 后端 API: https://easystay4u.site/api
  - IP 直连（备用）: http://81.71.15.150

## 项目结构

```
EasyStay_Hotel_Booking_kud/
├── server/              # 后端服务（Node.js + Express）
├── client-mobile/       # 移动端（React + Ant Design Mobile）
├── admin-pc/           # PC管理端（React + Ant Design）
├── pm2.config.js       # PM2 统一配置文件
└── logs/               # 服务日志目录
```

## 技术栈

### 后端
- Node.js
- Express
- JSON文件存储

### 移动端
- React 18
- React Router
- Ant Design Mobile
- Axios

### PC管理端
- React 18
- React Router
- Ant Design
- Axios

## 快速开始

### 方式一：使用 PM2 统一启动（推荐，云服务器）

```bash
# 进入项目目录
cd /root/hotel/EasyStay_Hotel_Booking_kud

# 使用 PM2 统一配置启动所有服务
pm2 start pm2.config.js

# 保存 PM2 配置（开机自启）
pm2 save
pm2 startup

# 查看服务状态
pm2 status
```

### 方式二：分别启动（本地开发）

```bash
# 1. 安装依赖
cd server
npm install

cd ../client-mobile
npm install

cd ../admin-pc
npm install

# 2. 启动后端服务（终端1）
cd server
npm start

# 3. 启动移动端（终端2）
cd client-mobile
npm start

# 4. 启动PC管理端（终端3）
cd admin-pc
npm start
```

## PM2 常用命令

```bash
# 查看所有服务状态
pm2 status

# 查看服务日志
pm2 logs easystay-server
pm2 logs easystay-admin
pm2 logs easystay-mobile

# 重启服务
pm2 restart all
pm2 restart easystay-server

# 停止服务
pm2 stop all
pm2 stop easystay-server

# 删除服务
pm2 delete all
```

## 测试账号

- **管理员**：admin / admin123
- **商户**：merchant1 / merchant123

## 功能说明

### 移动端功能
- 酒店查询页：Banner、城市选择、日期选择、星级/价格筛选、快捷标签
- 酒店列表页：分页加载、排序、筛选、城市选择
- 酒店详情页：图片轮播、房型价格列表（按价格排序）、预订

### PC管理端功能
- 数据看板：统计酒店数量和审核状态
- 商户录入：添加新酒店信息
- 审核管理：审核待审核的酒店
- 酒店管理：查看、编辑、删除所有酒店

### 后端API
- `GET /api/hotels` - 获取酒店列表（支持分页、排序、筛选：city/star/price/tags，status=approved 仅展示已上线）
- `GET /api/hotels/:id` - 获取酒店详情
- `POST /api/hotels` - 添加酒店（支持房型、开业时间）
- `PUT /api/hotels/:id` - 更新酒店
- `PUT /api/hotels/:id/status` - 更新酒店状态（含审核拒绝原因、offline）
- `DELETE /api/hotels/:id` - 删除酒店
- `POST /api/bookings` - 创建预订（用户端预订酒店）
- `GET /api/bookings` - 获取预订列表
- `GET /api/stats` - 获取统计数据

## 业务流程

1. **商户录入**：在PC管理端"商户录入"页面添加酒店信息
2. **审核管理**：在"审核管理"页面审核待审核的酒店（通过/拒绝）
3. **用户浏览**：审核通过的酒店会在移动端展示，用户可以搜索和查看详情

## 数据存储

- `server/data/hotels.json` - 酒店数据
- `server/data/users.json` - 用户数据
- `server/data/bookings.json` - 预订订单数据
- `server/data/messages.json` - 消息通知

## 定位功能（百度地图）

首页与酒店列表的「定位」按钮使用百度地图逆地理编码。**本项目已预配置 AK**，启动后端即可使用。他人克隆需自行申请 AK 并创建 `server/.env`。

详见 [项目手册.md](./项目手册.md) 第四章。

## 开发说明

- 后端默认端口：3000
- 移动端默认端口：3001
- PC管理端默认端口：3011
- 所有请求都通过代理转发到后端服务

## 更新日志

### 2026-02 最新修复与改进

**Bug 修复：**
- 后端 API：分页、排序、筛选（city/star/price/tags）
- 酒店下线/上线：支持 offline 状态并可恢复
- 管理员更新酒店状态：正确传递 role 参数
- 审核拒绝：必须填写原因，详情中展示
- 酒店房型：支持多房型录入，详情页按价格排序展示
- 注册表单：角色选择改用 Ant Design Select
- 移动端：城市选择、URL 参数同步

**新增功能：**
- 城市选择组件：支持热门城市、搜索、列表选择
- 房型与开业时间：商户录入表单扩展
- 预订API：用户端预订对接后端，订单持久化到 bookings.json

## 酒店数据更新

本项目已更新酒店数据，包含：
- **真实数据**：北京、天津、上海三个城市的真实酒店信息（通过百度地图 API 爬取）
- **模拟数据**：全国 100+ 城市的酒店数据（基于真实行政区划统计模型生成）
- **数据总量**：5469 条酒店数据

相关脚本位于 `server/scripts/`：
- `fetch-real-hotels.js` - 爬取真实酒店数据
- `generate-from-real.js` - 生成模拟酒店数据
- `clean-and-import.js` - 数据清洗和导入
- `geo_data.js` - 全国行政区划数据

## HTTPS 与域名

本项目已完成 HTTPS 升级：
- **域名**：`easystay4u.site`（阿里云注册）
- **SSL 证书**：Let's Encrypt（自动续期，有效期 90 天）
- **协议**：TLS 1.2/1.3 + HTTP/2 + HSTS
- **HTTP 自动跳转**：域名访问 HTTP 自动 301 重定向到 HTTPS
- **IP 直连兼容**：`http://81.71.15.150` 仍可正常访问

## 文档

- **项目手册**（部署、自检、答辩、常见问题）：[项目手册.md](./项目手册.md)
- **部署指南**：[部署指南.md](./部署指南.md)
- **验证测试指导手册**：[验证测试指导手册.md](./验证测试指导手册.md)
- **GIT 提交指南**：[GIT_提交指南.md](./GIT_提交指南.md)
- **Coze AI 智能体搭建指南**：[Coze_Agent_搭建指南.md](./Coze_Agent_搭建指南.md)
- **Coze AI 设计方案**：[Coze_Agent_设计方案与部署步骤.md](./Coze_Agent_设计方案与部署步骤.md)
