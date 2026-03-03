const fs = require('fs');
const path = require('path');
const dbRepository = require('../repositories/dbRepository');

const readJsonArray = (filePath, wrapperKey) => {
  if (!fs.existsSync(filePath)) return [];
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (wrapperKey) return Array.isArray(raw?.[wrapperKey]) ? raw[wrapperKey] : [];
  return Array.isArray(raw) ? raw : [];
};

const serverRoot = path.join(__dirname, '..');
const dataDir = path.join(serverRoot, 'data');

const entities = [
  { entity: 'hotels', file: path.join(dataDir, 'hotels.json') },
  { entity: 'users', file: path.join(dataDir, 'users.json'), wrapperKey: 'users' },
  { entity: 'messages', file: path.join(dataDir, 'messages.json') },
  { entity: 'bookings', file: path.join(dataDir, 'bookings.json') },
  { entity: 'clientUsers', file: path.join(dataDir, 'client_users.json') },
  { entity: 'chatSessions', file: path.join(dataDir, 'chat_sessions.json') }
];

if (!dbRepository.isAvailable()) {
  console.error('[migrate] better-sqlite3 未安装，无法迁移。请先在 server 目录执行 npm install。');
  process.exit(1);
}

let total = 0;
for (const { entity, file, wrapperKey } of entities) {
  const rows = readJsonArray(file, wrapperKey);
  dbRepository.write(entity, rows);
  console.log(`[migrate] ${entity}: ${rows.length}`);
  total += rows.length;
}

console.log(`[migrate] 完成，总记录数: ${total}`);
