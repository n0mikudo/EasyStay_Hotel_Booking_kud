const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dbRepository = require('../repositories/dbRepository');

const stableHash = (value) => crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex');

const readJsonArray = (filePath, wrapperKey) => {
  if (!fs.existsSync(filePath)) return [];
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (wrapperKey) return Array.isArray(raw?.[wrapperKey]) ? raw[wrapperKey] : [];
  return Array.isArray(raw) ? raw : [];
};

if (!dbRepository.isAvailable()) {
  console.error('[consistency] better-sqlite3 未安装，无法校验。');
  process.exit(1);
}

const dataDir = path.join(__dirname, '..', 'data');
const checks = [
  { entity: 'hotels', file: 'hotels.json' },
  { entity: 'users', file: 'users.json', wrapperKey: 'users' },
  { entity: 'messages', file: 'messages.json' },
  { entity: 'bookings', file: 'bookings.json' },
  { entity: 'clientUsers', file: 'client_users.json' },
  { entity: 'chatSessions', file: 'chat_sessions.json' }
];

let failed = 0;
for (const item of checks) {
  const jsonData = readJsonArray(path.join(dataDir, item.file), item.wrapperKey);
  const dbData = dbRepository.read(item.entity);
  const jsonHash = stableHash(jsonData);
  const dbHash = stableHash(dbData);
  const ok = jsonHash === dbHash;
  if (!ok) failed += 1;
  console.log(
    `[consistency] ${item.entity} | json=${jsonData.length} | db=${dbData.length} | hashMatch=${ok}`
  );
}

if (failed > 0) {
  console.error(`[consistency] 校验失败实体数: ${failed}`);
  process.exit(2);
}

console.log('[consistency] 全部实体一致。');
