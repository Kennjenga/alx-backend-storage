const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/orderController");

module.exports = (redisClient, mysqlConnection) => {
  const orderController = new OrderController(redisClient, mysqlConnection);

  router.get("/", orderController.getAllOrders.bind(orderController));
  router.get("/:id", orderController.getOrder.bind(orderController));
  router.post("/", orderController.createOrder.bind(orderController));
  router.patch(
    "/:id/status",
    orderController.updateOrderStatus.bind(orderController)
  );
  router.delete("/:id", orderController.deleteOrder.bind(orderController));

  return router;
};
