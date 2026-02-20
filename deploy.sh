#!/bin/bash
# EasyStay 一键部署脚本
# 使用方式: bash deploy.sh

set -e

echo "========================================="
echo "   EasyStay 项目部署脚本"
echo "========================================="

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="/opt/EasyStay_Project"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 用户运行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/6] 检查环境...${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js 未安装，请先安装 Node.js 16+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js 版本: $(node -v)${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm 版本: $(npm -v)${NC}"

# 检查 Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nginx 未安装，跳过 Nginx 配置${NC}"
else
    echo -e "${GREEN}✓ Nginx 已安装${NC}"
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 未安装，正在安装...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 已安装${NC}"

echo ""
echo -e "${YELLOW}[2/6] 安装后端依赖...${NC}"
cd "$PROJECT_DIR/server"
if [ ! -d "node_modules" ]; then
    npm install --production
fi
echo -e "${GREEN}✓ 后端依赖安装完成${NC}"

echo ""
echo -e "${YELLOW}[3/6] 构建管理端...${NC}"
cd "$PROJECT_DIR/admin-pc"
if [ ! -d "node_modules" ]; then
    npm install
fi
if [ ! -d "build" ]; then
    npm run build
fi
echo -e "${GREEN}✓ 管理端构建完成${NC}"

echo ""
echo -e "${YELLOW}[4/6] 构建移动端...${NC}"
cd "$PROJECT_DIR/client-mobile"
if [ ! -d "node_modules" ]; then
    npm install
fi
if [ ! -d "build" ]; then
    npm run build
fi
echo -e "${GREEN}✓ 移动端构建完成${NC}"

echo ""
echo -e "${YELLOW}[5/6] 启动后端服务...${NC}"
cd "$PROJECT_DIR/server"

# 创建日志目录
mkdir -p logs

# 停止旧的进程
pm2 delete easystay-server 2>/dev/null || true

# 启动新进程
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    pm2 start app.js --name easystay-server
fi

# 保存 PM2 配置
pm2 save
pm2 startup -u root --hp /root 2>/dev/null || true

echo -e "${GREEN}✓ 后端服务已启动${NC}"

echo ""
echo -e "${YELLOW}[6/6] 配置 Nginx...${NC}"
if command -v nginx &> /dev/null; then
    # 备份旧配置
    if [ -f "/etc/nginx/sites-enabled/easystay" ]; then
        cp /etc/nginx/sites-enabled/easystay /etc/nginx/sites-enabled/easystay.backup 2>/dev/null || true
    fi
    
    # 复制新配置
    if [ -f "$PROJECT_DIR/nginx.conf" ]; then
        cp "$PROJECT_DIR/nginx.conf" /etc/nginx/sites-available/easystay
        
        # 创建软链接
        ln -sf /etc/nginx/sites-available/easystay /etc/nginx/sites-enabled/
        
        # 测试配置
        if nginx -t; then
            # 重启 Nginx
            systemctl reload nginx
            echo -e "${GREEN}✓ Nginx 配置已更新${NC}"
        else
            echo -e "${RED}✗ Nginx 配置测试失败，请检查配置${NC}"
        fi
    fi
fi

echo ""
echo "========================================="
echo -e "${GREEN}   部署完成！${NC}"
echo "========================================="
echo ""
echo "访问地址："
echo "  管理端: http://$(hostname -I | awk '{print $1}')"
echo "  移动端: http://$(hostname -I | awk '{print $1}')/mobile/"
echo ""
echo "常用命令："
echo "  查看服务状态: pm2 status"
echo "  查看服务日志: pm2 logs easystay-server"
echo "  重启服务: pm2 restart easystay-server"
echo "  重启 Nginx: systemctl reload nginx"
echo ""
