const dbRepository = require('./dbRepository');
const { createJsonRepository } = require('./jsonRepository');

const normalizeMode = (raw, fallback) => {
  const v = String(raw || fallback || '').trim().toLowerCase();
  return v || fallback;
};

const createRepositoryFactory = (adapters) => {
  const jsonRepository = createJsonRepository(adapters);

  const resolveReadSource = (entity) => {
    const key = `READ_SOURCE_${String(entity).toUpperCase()}`;
    return normalizeMode(process.env[key], normalizeMode(process.env.READ_SOURCE, 'json'));
  };

  const resolveWriteMode = () => normalizeMode(process.env.WRITE_MODE, 'json');

  const shouldWriteJson = () => {
    const mode = resolveWriteMode();
    return mode === 'json' || mode === 'dual';
  };

  const shouldWriteDb = () => {
    const mode = resolveWriteMode();
    return (mode === 'db' || mode === 'dual') && dbRepository.isAvailable();
  };

  const read = (entity) => {
    const readSource = resolveReadSource(entity);
    if (readSource === 'db' && dbRepository.isAvailable()) {
      try {
        return dbRepository.read(entity);
      } catch (err) {
        console.error(`[repository] db read failed for ${entity}, fallback to json:`, err.message);
      }
    }
    return jsonRepository.read(entity);
  };

  const write = (entity, payload) => {
    let ok = true;
    if (shouldWriteJson()) {
      ok = jsonRepository.write(entity, payload) !== false && ok;
    }
    if (shouldWriteDb()) {
      try {
        dbRepository.write(entity, payload);
      } catch (err) {
        ok = false;
        console.error(`[repository] db write failed for ${entity}:`, err.message);
      }
    }
    return ok;
  };

  return {
    read,
    write,
    policy: {
      resolveReadSource,
      resolveWriteMode,
      shouldWriteJson,
      shouldWriteDb,
      dbAvailable: dbRepository.isAvailable
    }
  };
};

module.exports = { createRepositoryFactory };
