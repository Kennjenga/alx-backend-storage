class OrderController {
  constructor(redisClient, mysqlConnection) {
    this.redisClient = redisClient;
    this.mysqlConnection = mysqlConnection;
  }

  async getAllOrders(req, res) {
    try {
      const [orders] = await this.mysqlConnection.execute(`
          SELECT o.*, 
            GROUP_CONCAT(JSON_OBJECT(
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price
            )) as items
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          GROUP BY o.id
        `);

      // Parse the items string into JSON
      const formattedOrders = orders.map((order) => ({
        ...order,
        items: order.items ? JSON.parse(`[${order.items}]`) : [],
      }));

      res.json(formattedOrders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOrder(req, res) {
    try {
      const { id } = req.params;

      // Check Redis cache
      const cachedOrder = await this.redisClient.get(`order:${id}`);
      if (cachedOrder) {
        return res.json(JSON.parse(cachedOrder));
      }

      const [orders] = await this.mysqlConnection.execute(
        `
          SELECT o.*, 
            GROUP_CONCAT(JSON_OBJECT(
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price
            )) as items
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.id = ?
          GROUP BY o.id
        `,
        [id]
      );

      if (orders.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      const order = {
        ...orders[0],
        items: orders[0].items ? JSON.parse(`[${orders[0].items}]`) : [],
      };

      // Cache in Redis
      await this.redisClient.set(`order:${id}`, JSON.stringify(order));

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createOrder(req, res) {
    const connection = await this.mysqlConnection.getConnection();

    try {
      await connection.beginTransaction();

      const {
        total_amount,
        shipping_address_street,
        shipping_address_city,
        shipping_address_state,
        shipping_address_zip,
        shipping_address_country,
        items,
      } = req.body;

      const orderId = Date.now().toString(); // Simple ID generation

      // Create the order
      await connection.execute(
        `INSERT INTO orders (
            id, total_amount, shipping_address_street, shipping_address_city,
            shipping_address_state, shipping_address_zip, shipping_address_country
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          total_amount,
          shipping_address_street,
          shipping_address_city,
          shipping_address_state,
          shipping_address_zip,
          shipping_address_country,
        ]
      );

      // Insert order items
      for (const item of items) {
        await connection.execute(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
             VALUES (?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, item.price]
        );
      }

      await connection.commit();

      const [newOrder] = await connection.execute(
        `
          SELECT o.*, 
            GROUP_CONCAT(JSON_OBJECT(
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price
            )) as items
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.id = ?
          GROUP BY o.id
        `,
        [orderId]
      );

      const formattedOrder = {
        ...newOrder[0],
        items: newOrder[0].items ? JSON.parse(`[${newOrder[0].items}]`) : [],
      };

      res.status(201).json(formattedOrder);
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const [result] = await this.mysqlConnection.execute(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Invalidate Redis cache
      await this.redisClient.del(`order:${id}`);

      const [updatedOrder] = await this.mysqlConnection.execute(
        `
          SELECT o.*, 
            GROUP_CONCAT(JSON_OBJECT(
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price
            )) as items
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.id = ?
          GROUP BY o.id
        `,
        [id]
      );

      const formattedOrder = {
        ...updatedOrder[0],
        items: updatedOrder[0].items
          ? JSON.parse(`[${updatedOrder[0].items}]`)
          : [],
      };

      res.json(formattedOrder);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteOrder(req, res) {
    try {
      const { id } = req.params;

      // Due to ON DELETE CASCADE, this will automatically delete related order_items
      const [result] = await this.mysqlConnection.execute(
        "DELETE FROM orders WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Invalidate Redis cache
      await this.redisClient.del(`order:${id}`);

      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = OrderController;
