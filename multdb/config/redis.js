// config/redis.js
const redisConfig = {
  url: process.env.REDIS_URL,
  // Optional configuration
  socket: {
    connectTimeout: 10000,
  },
};

module.exports = { redisConfig };
