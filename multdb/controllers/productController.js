// controllers/productController.js
const Product = require("../models/product");

class ProductController {
  constructor(redisClient) {
    this.redisClient = redisClient;
  }

  async getAllProducts(req, res) {
    try {
      const products = await Product.find();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProduct(req, res) {
    try {
      const { id } = req.params;

      const cachedProduct = await this.redisClient.get(`product:${id}`);
      if (cachedProduct) return res.json(JSON.parse(cachedProduct));

      const product = await Product.findById(id);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      await this.redisClient.set(`product:${id}`, JSON.stringify(product));
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createProduct(req, res) {
    try {
      const product = await Product.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      if (!product)
        return res.status(404).json({ message: "Product not found" });

      await this.redisClient.del(`product:${id}`);
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findByIdAndDelete(id);

      if (!product)
        return res.status(404).json({ message: "Product not found" });

      await this.redisClient.del(`product:${id}`);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProductController;
