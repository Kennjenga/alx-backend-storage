require("dotenv").config();

// config/database.js
const mysqlConfig = {
  host: "localhost",
  user: "root",
  password: process.env.MYSQL_PASSWORD,
  database: "ecommerce",
  port: 3306,
  // Optional but recommended settings
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

module.exports = { mysqlConfig };
