const normalize = (v, fallback = []) => (Array.isArray(v) ? v : fallback);

const createJsonRepository = (adapters) => {
  const {
    readHotelsJson,
    readUsersJson,
    readMessagesJson,
    readBookingsJson,
    readClientUsersJson,
    readChatSessionsJson,
    writeHotelsJson,
    writeUsersJson,
    writeMessagesJson,
    writeBookingsJson,
    writeClientUsersJson,
    writeChatSessionsJson
  } = adapters;

  return {
    read(entity) {
      switch (entity) {
        case 'hotels': return normalize(readHotelsJson());
        case 'users': return normalize(readUsersJson());
        case 'messages': return normalize(readMessagesJson());
        case 'bookings': return normalize(readBookingsJson());
        case 'clientUsers': return normalize(readClientUsersJson());
        case 'chatSessions': return normalize(readChatSessionsJson());
        default: throw new Error(`unsupported_entity:${entity}`);
      }
    },
    write(entity, payload) {
      switch (entity) {
        case 'hotels': return writeHotelsJson(normalize(payload));
        case 'users': return writeUsersJson(normalize(payload));
        case 'messages': return writeMessagesJson(normalize(payload));
        case 'bookings': return writeBookingsJson(normalize(payload));
        case 'clientUsers': return writeClientUsersJson(normalize(payload));
        case 'chatSessions': return writeChatSessionsJson(normalize(payload));
        default: throw new Error(`unsupported_entity:${entity}`);
      }
    }
  };
};

module.exports = { createJsonRepository };
