import express from "express"
import { body, param } from "express-validator"
import { adminDeletOrder, adminGetAllOrders, adminUpdateOrder, createOrder, getMyOrderById, getMyOrders, getOrderById } from "../controllers/orderController.js"
import { isLoggedIn, customRole } from "../middleware/authMiddleware.js"

const router = express.Router()

//todo: add validations 
router.route("/order/create")
  .post([
    body("shippingInfo.address").trim().escape(),
    body("shippingInfo.city").trim().escape(),
    body("shippingInfo.phoneNo").trim().escape(),
    body("shippingInfo.state").trim().escape(),
    body("shippingInfo.postalCode").trim().escape(),
    body("shippingInfo.country").trim().escape(),
    body("taxAmount").trim().escape(),
    body("shippingAmount").trim().escape(),
    body("orderStatus").trim().escape(),
  ], isLoggedIn, createOrder)

router.route("/myorder")
  .get(isLoggedIn, getMyOrders)

router.route("/myorder/:id")
  .get(isLoggedIn, getMyOrderById)

router.route("/admin/order/:id") //expect the id one mostly at the end to prevent error
  .get(isLoggedIn, customRole("admin"), [
    param("id").trim().escape()
  ], getOrderById)

  .delete(isLoggedIn, customRole("admin"), [
    param("id").trim().escape()
  ], adminDeletOrder)

router.route("/admin/orders")
  .get(isLoggedIn, customRole("admin"), adminGetAllOrders)

router.route("/admin/updateOrder/:id")
  .patch(isLoggedIn, customRole("admin"), [
    param("id").trim().escape()
  ], adminUpdateOrder)

export default router