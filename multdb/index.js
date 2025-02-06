// server.js
const express = require("express");
const redis = require("redis");
const connectDb = require("./config/database");
const { redisConfig } = require("./config/redis");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

async function initializeDatabases() {
  try {
    await connectDb();
    const redisClient = redis.createClient(redisConfig);
    await redisClient.connect();
    console.log("Redis connected successfully");
    return { redisClient };
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
}

app.get("/", function (req, res) {
  res.send("Welcome to the Product API");
});

async function startServer() {
  const { redisClient } = await initializeDatabases();

  const productRoutes = require("./routes/products")(redisClient);
  // const orderRoutes = require("./routes/orders")(redisClient);

  app.use("/api/products", productRoutes);
  // app.use("/api/orders", orderRoutes);

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: "error", message: err.message });
  });

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  process.on("SIGINT", async () => {
    try {
      await mongoose.connection.close();
      await redisClient.quit();
      console.log("Database connections closed");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });
}

startServer();
