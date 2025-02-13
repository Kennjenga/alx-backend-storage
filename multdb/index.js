// server.js
const express = require("express");
const mysql = require("mysql2/promise");
const redis = require("redis");
const { mysqlConfig } = require("./config/database");
const { redisConfig } = require("./config/redis");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./config/swagger-output.json");

const app = express();
const PORT = process.env.PORT || 8001;

app.use(express.json());

async function initializeDatabases() {
  try {
    const mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log("MySQL connected successfully");

    const redisClient = redis.createClient(redisConfig);
    await redisClient.connect();
    console.log("Redis connected successfully");

    return { mysqlConnection, redisClient };
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
}

app.get("/", function (req, res) {
  res.send("Hello, World!");
});

async function startServer() {
  const { mysqlConnection, redisClient } = await initializeDatabases();

  const productRoutes = require("./routes/products")(
    redisClient,
    mysqlConnection
  );
  const orderRoutes = require("./routes/orders")(redisClient, mysqlConnection);

  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(
      `Swagger documentation available at http://localhost:${PORT}/api-docs`
    );
  });

  process.on("SIGINT", async () => {
    try {
      await mysqlConnection.end();
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
