const {
  isAvailable,
  saveEntityDataset,
  readEntityDataset
} = require('../db/sqliteClient');

const SUPPORTED_ENTITIES = new Set([
  'hotels',
  'users',
  'messages',
  'bookings',
  'clientUsers',
  'chatSessions'
]);

const assertEntity = (entity) => {
  if (!SUPPORTED_ENTITIES.has(entity)) {
    throw new Error(`unsupported_entity:${entity}`);
  }
};

const read = (entity) => {
  assertEntity(entity);
  return readEntityDataset(entity);
};

const write = (entity, data) => {
  assertEntity(entity);
  saveEntityDataset(entity, data);
  return true;
};

module.exports = {
  isAvailable,
  read,
  write,
  SUPPORTED_ENTITIES
};
