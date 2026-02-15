# 易宿酒店预订平台 - 详细启动指南

## 📋 重要提示

本项目需要同时运行**三个服务**，因此需要**打开三个独立的终端窗口**。

- **后端服务**：不会打开浏览器，只在后台运行
- **移动端**：启动后会自动打开浏览器
- **PC管理端**：启动后会自动打开浏览器

---

## 🚀 完整启动步骤

### 前置条件

确保您已安装：
- **Node.js** (推荐 v16 或更高版本)
- **npm** (随 Node.js 一起安装)

### 步骤1：启动后端服务（必须先启动）

#### 1.1 打开第一个终端

**方法1：使用PowerShell**
- 按 `Win + R`
- 输入 `powershell`
- 按回车

**方法2：使用命令提示符**
- 按 `Win + R`
- 输入 `cmd`
- 按回车

**方法3：在VS Code中**
- 按 `` Ctrl + Shift + ` ``（反引号）
- 或点击菜单：终端 → 新建终端

#### 1.2 进入后端目录并启动

在第一个终端中，依次执行以下命令：

```bash
# 进入项目根目录（根据您的实际路径调整）
cd EasyStay_Project

# 进入后端目录
cd server

# 安装依赖（首次运行需要）
npm install

# 启动后端服务
npm start
```

#### 1.3 验证后端启动成功

您应该看到以下输出：

```
> easystay-server@1.0.0 start
> node app.js

服务器运行在 http://localhost:3000
```

✅ **成功标志**：看到 `服务器运行在 http://localhost:3000`

❌ **失败标志**：如果看到 `Error: listen EADDRINUSE`，说明端口被占用，参考下面的"端口被占用解决方案"

⚠️ **重要**：**不要关闭这个终端窗口**，保持后端服务运行

---

### 步骤2：启动移动端（用户端）

#### 2.1 打开第二个终端

**打开新的终端窗口**（不要关闭第一个终端）

**方法1：使用PowerShell**
- 按 `Win + R`
- 输入 `powershell`
- 按回车

**方法2：在VS Code中**
- 点击终端右上角的 `+` 号
- 或右键终端 → "新建终端"

#### 2.2 进入移动端目录并启动

在第二个终端中，依次执行以下命令：

```bash
# 进入项目根目录
cd EasyStay_Project

# 进入移动端目录
cd client-mobile

# 安装依赖（首次运行需要）
npm install

# 启动移动端
npm start
```

#### 2.3 等待编译完成

首次启动可能需要1-3分钟，您会看到类似以下输出：

```
Starting the development server...

Compiled successfully!

You can now view easystay-mobile in the browser.

  Local:            http://localhost:3001
  On Your Network:  http://192.168.x.x:3001
```

✅ **成功标志**：看到 `Compiled successfully!` 和浏览器自动打开

⚠️ **注意**：浏览器打开后，请按 `F12` 打开开发者工具，点击设备模拟器图标（📱），选择手机尺寸（如 iPhone 12 Pro）来模拟移动端效果

⚠️ **重要**：**不要关闭这个终端窗口**，保持移动端服务运行

---

### 步骤3：启动PC管理端（管理员端）

#### 3.1 打开第三个终端

**打开新的终端窗口**（不要关闭前两个终端）

#### 3.2 进入PC管理端目录并启动

在第三个终端中，依次执行以下命令：

```bash
# 进入项目根目录
cd EasyStay_Project

# 进入PC管理端目录
cd admin-pc

# 安装依赖（首次运行需要）
npm install

# 启动PC管理端
npm start
```

#### 3.3 等待编译完成

您会看到类似以下输出：

```
Starting the development server...

Compiled successfully!

You can now view easystay-admin in the browser.

  Local:            http://localhost:3002
  On Your Network:  http://192.168.x.x:3002
```

✅ **成功标志**：看到 `Compiled successfully!` 和浏览器自动打开

---

## 📱 移动端真机测试指南

### 方法一：局域网访问（推荐）

1. **确保手机和电脑在同一WiFi网络**

2. **查看电脑IP地址**
   - Windows: 在命令提示符中运行 `ipconfig`，找到 IPv4 地址
   - Mac/Linux: 在终端运行 `ifconfig` 或 `ip addr`

3. **修改API配置**
   
   编辑 `client-mobile/src/services/api.js`：
   ```javascript
   // 将 localhost 改为您的电脑IP
   const API_BASE_URL = 'http://192.168.x.x:3000/api';
   ```

4. **重新启动移动端**
   ```bash
   cd client-mobile
   npm start
   ```

5. **手机浏览器访问**
   - 打开手机浏览器
   - 输入 `http://192.168.x.x:3001`
   - 即可访问移动端应用

### 方法二：二维码扫描

1. **安装 qr-code-terminal**
   ```bash
   npm install -g qr-code-terminal
   ```

2. **生成二维码**
   ```bash
   # 在移动端启动后，运行
   npx qrcode-terminal http://192.168.x.x:3001
   ```

3. **手机扫描二维码**即可访问

---

## 🔧 常见问题解决

### 问题1：端口被占用

**症状**：
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**：

1. **查找占用端口的进程**
   ```bash
   netstat -ano | findstr :3000
   ```

2. **结束进程**
   ```bash
   taskkill /PID <进程ID> /F
   ```
   将 `<进程ID>` 替换为实际的进程ID

3. **或者更换端口**
   
   修改 `server/package.json`：
   ```json
   "scripts": {
     "start": "set PORT=3003 && node app.js"
   }
   ```

### 问题2：npm install 失败

**症状**：
```
npm ERR! code ENOENT
npm ERR! syscall open
```

**解决方案**：

1. **清除npm缓存**
   ```bash
   npm cache clean --force
   ```

2. **使用淘宝镜像（国内用户）**
   ```bash
   npm config set registry https://registry.npmmirror.com
   ```

3. **重新安装**
   ```bash
   npm install
   ```

### 问题3：移动端显示为PC页面

**症状**：移动端页面显示为桌面版样式

**解决方案**：

1. **按F12打开开发者工具**

2. **点击设备模拟器图标**（📱 或 `Ctrl+Shift+M`）

3. **选择手机尺寸**，如：
   - iPhone 12 Pro (390×844)
   - iPhone SE (375×667)
   - Pixel 5 (393×851)

### 问题4：API请求失败

**症状**：页面显示"加载失败"或数据无法显示

**解决方案**：

1. **检查后端服务是否运行**
   - 确保第一个终端没有关闭
   - 确保看到 `服务器运行在 http://localhost:3000`

2. **检查API地址配置**
   
   编辑 `client-mobile/src/services/api.js`：
   ```javascript
   const API_BASE_URL = 'http://localhost:3000/api';
   ```

3. **检查网络连接**
   - 确保电脑网络正常
   - 尝试在浏览器访问 `http://localhost:3000/api/hotels`

### 问题5：CORS跨域错误

**症状**：
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**解决方案**：

后端已配置CORS支持，如果仍有问题：

1. **检查后端CORS配置**
   
   编辑 `server/app.js`，确保包含：
   ```javascript
   const cors = require('cors');
   app.use(cors());
   ```

2. **重启后端服务**

---

## 🧪 功能测试流程

### 测试1：完整业务流程

1. **PC管理端 - 商户录入**
   - 访问 `http://localhost:3002`
   - 点击"商户录入"
   - 填写酒店信息并提交
   - 状态应为"待审核"

2. **PC管理端 - 审核管理**
   - 点击"审核管理"
   - 找到刚添加的酒店
   - 点击"通过"
   - 状态变为"已通过"

3. **移动端 - 查看酒店**
   - 访问 `http://localhost:3001`
   - 搜索或浏览酒店列表
   - 点击酒店查看详情
   - 确认显示审核通过的内容

### 测试2：数据持久化

1. **添加多个酒店**
2. **关闭所有服务**
3. **重新启动服务**
4. **验证数据仍然存在**

---

## 📊 项目结构说明

```
EasyStay_Project/          # 项目根目录
├── server/                # 后端服务
│   ├── app.js            # 主程序
│   ├── package.json      # 依赖配置
│   └── data/             # 数据存储
│       └── hotels.json   # 酒店数据
├── client-mobile/         # 移动端（用户端）
│   ├── src/              # 源代码
│   │   ├── pages/        # 页面组件
│   │   └── services/     # API服务
│   └── package.json      # 依赖配置
└── admin-pc/              # PC管理端（管理员端）
    ├── src/              # 源代码
    │   ├── pages/        # 页面组件
    │   └── services/     # API服务
    └── package.json      # 依赖配置
```

---

## 🛠️ 开发命令参考

### 后端服务
```bash
cd server
npm start              # 启动服务
npm run dev            # 开发模式（如果有配置）
```

### 移动端
```bash
cd client-mobile
npm start              # 启动开发服务器
npm run build          # 构建生产版本
npm test               # 运行测试
```

### PC管理端
```bash
cd admin-pc
npm start              # 启动开发服务器
npm run build          # 构建生产版本
npm test               # 运行测试
```

---

## 📝 注意事项

1. **三个服务必须同时运行**，缺一不可
2. **启动顺序**：后端 → 移动端 → PC管理端
3. **不要关闭终端窗口**，最小化即可
4. **首次安装需要运行** `npm install`
5. **数据存储在** `server/data/hotels.json`，删除此文件会清空所有数据

---

## 🆘 获取帮助

如果以上步骤无法解决问题：

1. **查看终端错误信息**，复制错误消息搜索
2. **检查Node.js版本**：`node --version`（推荐v16+）
3. **检查npm版本**：`npm --version`
4. **重新克隆项目**并重新安装依赖

---

**祝您使用愉快！** 🎉
