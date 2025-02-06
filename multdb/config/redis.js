// config/redis.js
const redisConfig = {
  url: "redis://localhost:6379",
  // Optional configuration
  socket: {
    connectTimeout: 10000,
  },
};

module.exports = { redisConfig };
