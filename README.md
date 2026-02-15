# 易宿酒店预订平台

一个完整的酒店预订系统，包含移动端用户界面和PC端管理界面。

## 项目结构

```
EasyStay_Project/
├── server/              # 后端服务（Node.js + Express）
├── client-mobile/       # 移动端（React + Ant Design Mobile）
└── admin-pc/           # PC管理端（React + Ant Design）
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

### 1. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装移动端依赖
cd ../client-mobile
npm install

# 安装PC管理端依赖
cd ../admin-pc
npm install
```

### 2. 启动后端服务

```bash
cd server
npm start
```

后端服务将在 http://localhost:3000 运行

### 3. 启动移动端

```bash
cd client-mobile
npm start
```

移动端将在 http://localhost:3001 运行

### 4. 启动PC管理端

```bash
cd admin-pc
npm start
```

PC管理端将在 http://localhost:3002 运行

## 功能说明

### 移动端功能
- 酒店搜索（按名称或城市）
- 酒店列表展示
- 酒店详情查看

### PC管理端功能
- 数据看板：统计酒店数量和审核状态
- 商户录入：添加新酒店信息
- 审核管理：审核待审核的酒店
- 酒店管理：查看、编辑、删除所有酒店

### 后端API
- `GET /api/hotels` - 获取酒店列表
- `GET /api/hotels/:id` - 获取酒店详情
- `POST /api/hotels` - 添加酒店
- `PUT /api/hotels/:id` - 更新酒店
- `PUT /api/hotels/:id/status` - 更新酒店状态
- `DELETE /api/hotels/:id` - 删除酒店
- `GET /api/stats` - 获取统计数据

## 业务流程

1. **商户录入**：在PC管理端"商户录入"页面添加酒店信息
2. **审核管理**：在"审核管理"页面审核待审核的酒店（通过/拒绝）
3. **用户浏览**：审核通过的酒店会在移动端展示，用户可以搜索和查看详情

## 数据存储

酒店数据存储在 `server/data/hotels.json` 文件中。

## 开发说明

- 后端默认端口：3000
- 移动端默认端口：3001
- PC管理端默认端口：3002
- 所有请求都通过代理转发到后端服务
