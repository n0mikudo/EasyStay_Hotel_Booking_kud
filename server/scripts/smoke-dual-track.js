const fs = require('fs');
const path = require('path');
const dbRepository = require('../repositories/dbRepository');

const dataDir = path.join(__dirname, '..', 'data');

const readJsonArray = (filePath, wrapperKey) => {
  if (!fs.existsSync(filePath)) return [];
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (wrapperKey) return Array.isArray(raw?.[wrapperKey]) ? raw[wrapperKey] : [];
  return Array.isArray(raw) ? raw : [];
};

const entities = [
  { entity: 'hotels', file: 'hotels.json' },
  { entity: 'users', file: 'users.json', wrapperKey: 'users' },
  { entity: 'messages', file: 'messages.json' },
  { entity: 'bookings', file: 'bookings.json' },
  { entity: 'clientUsers', file: 'client_users.json' },
  { entity: 'chatSessions', file: 'chat_sessions.json' }
];

if (!dbRepository.isAvailable()) {
  console.error('[smoke] DB driver unavailable');
  process.exit(1);
}

for (const item of entities) {
  const jsonRows = readJsonArray(path.join(dataDir, item.file), item.wrapperKey);
  const dbRows = dbRepository.read(item.entity);
  console.log(`[smoke] ${item.entity}: json=${jsonRows.length}, db=${dbRows.length}`);
}

console.log('[smoke] dual-track read path prerequisite OK');
