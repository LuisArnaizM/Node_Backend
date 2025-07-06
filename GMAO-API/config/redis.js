const redis = require('redis');
require('dotenv').config();

// Debug de configuración
console.log('🔧 Redis Config Debug:');
console.log('  REDIS_HOST:', process.env.REDIS_HOST);
console.log('  REDIS_PORT:', process.env.REDIS_PORT);
console.log('  NODE_ENV:', process.env.NODE_ENV);

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT) || 6379;
const redisConfig = {
  socket: {
    host: redisHost,
    port: redisPort,
    family: 4, // IMPORTANTE: Forzar IPv4
    connectTimeout: 10000,
    lazyConnect: true
  },
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}
const redisClient = redis.createClient(redisConfig);

// Configuración de eventos
redisClient.on('connect', () => {
  console.log(`✅ Conectado a Redis en ${redisHost}:${redisPort}`);
});

redisClient.on('error', (err) => {
  console.error(`❌ Error de conexión a Redis (${redisHost}:${redisPort}):`, err);
});

redisClient.on('end', () => {
  console.log('🔌 Conexión a Redis cerrada');
});

redisClient.on('reconnecting', () => {
  console.log(`🔄 Reconectando a Redis ${redisHost}:${redisPort}...`);
});
// Función para conectar a Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('No se pudo conectar a Redis:', error);
  }
};

// Funciones auxiliares para cache
const cacheHelpers = {
  // Obtener datos del cache
  get: async (key) => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error al obtener del cache:', error);
      return null;
    }
  },

  // Guardar datos en el cache con TTL de 30 minutos (1800 segundos)
  set: async (key, data, ttl = 1800) => {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error al guardar en cache:', error);
      return false;
    }
  },

  // Eliminar datos del cache
  del: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Error al eliminar del cache:', error);
      return false;
    }
  },

  // Eliminar múltiples claves que coincidan con un patrón
  delPattern: async (pattern) => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Error al eliminar patrón del cache:', error);
      return false;
    }
  }
};

module.exports = {
  redisClient,
  connectRedis,
  cacheHelpers
};
