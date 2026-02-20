#!/usr/bin/env node
/**
 * 导出商户登录凭证
 * 将 users.json 中的商户账号导出为 credentials.json，便于调试登录
 *
 * 用法: node scripts/export-merchant-credentials.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'merchant-credentials.json');

function run() {
  let users = [];
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const data = JSON.parse(raw);
    users = Array.isArray(data.users) ? data.users : data;
  } catch (e) {
    console.error('读取 users.json 失败:', e.message);
    process.exit(1);
  }

  const merchants = users
    .filter(u => u.role === 'merchant')
    .map(u => ({
      username: u.username,
      password: u.password || 'merchant123',
      name: u.name,
      id: u.id
    }));

  const output = {
    exportedAt: new Date().toISOString(),
    total: merchants.length,
    note: '商户登录凭证，密码默认 merchant123',
    credentials: merchants
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`已导出 ${merchants.length} 个商户凭证至 data/merchant-credentials.json`);
  console.log('示例: 用户名 merchant_1_xxx, 密码 merchant123');
}

run();
