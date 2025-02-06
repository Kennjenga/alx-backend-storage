// routes/products.js
const express = require("express");
const router = express.Router();
const ProductController = require("../controllers/productController");

module.exports = (redisClient, mysqlConnection) => {
  const productController = new ProductController(redisClient, mysqlConnection);

  router.get("/", productController.getAllProducts.bind(productController));
  router.get("/:id", productController.getProduct.bind(productController));
  router.post("/", productController.createProduct.bind(productController));
  router.put("/:id", productController.updateProduct.bind(productController));
  router.delete(
    "/:id",
    productController.deleteProduct.bind(productController)
  );

  return router;
};
