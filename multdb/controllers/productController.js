class ProductController {
  constructor(redisClient, mysqlConnection) {
    this.redisClient = redisClient;
    this.mysqlConnection = mysqlConnection;
  }

  async getAllProducts(req, res) {
    try {
      const [products] = await this.mysqlConnection.execute(
        "SELECT * FROM products"
      );
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProduct(req, res) {
    try {
      const { id } = req.params;

      // Check Redis cache
      const cachedProduct = await this.redisClient.get(`product:${id}`);
      if (cachedProduct) {
        return res.json(JSON.parse(cachedProduct));
      }

      // Get from MySQL
      const [products] = await this.mysqlConnection.execute(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      if (products.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      const product = products[0];

      // Cache in Redis
      await this.redisClient.set(`product:${id}`, JSON.stringify(product));

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createProduct(req, res) {
    try {
      const { name, description, price, category, stock } = req.body;
      const id = Date.now().toString(); // Simple ID generation

      const [result] = await this.mysqlConnection.execute(
        "INSERT INTO products (id, name, description, price, category, stock) VALUES (?, ?, ?, ?, ?, ?)",
        [id, name, description, price, category, stock]
      );

      const [newProduct] = await this.mysqlConnection.execute(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      res.status(201).json(newProduct[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, category, stock } = req.body;

      const [result] = await this.mysqlConnection.execute(
        "UPDATE products SET name = ?, description = ?, price = ?, category = ?, stock = ? WHERE id = ?",
        [name, description, price, category, stock, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Invalidate Redis cache
      await this.redisClient.del(`product:${id}`);

      const [updatedProduct] = await this.mysqlConnection.execute(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      res.json(updatedProduct[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const [result] = await this.mysqlConnection.execute(
        "DELETE FROM products WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Invalidate Redis cache
      await this.redisClient.del(`product:${id}`);

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProductController;
