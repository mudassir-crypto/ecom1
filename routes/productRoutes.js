import express from "express"
import { body, param } from "express-validator"
import { addReview, adminAddProduct, adminDeleteOneProduct, adminGetAllProducts, adminUpdateOneProduct, deleteReview, getAllProducts, getReviewsForOneProduct, getSingleProduct, test } from "../controllers/productController.js"
import { isLoggedIn, customRole } from '../middleware/authMiddleware.js'


const router = express.Router()

router.route('/test')
  .get(test)

router.route('/admin/product/add')
  .post([
    body("name").trim().escape(),
    body("price").trim().escape(),
    body("description").trim().escape(),
    body("category").trim().escape(),
    body("brand").trim().escape(),
    body("stock").trim().escape()
  ], isLoggedIn, customRole("admin"), adminAddProduct)

  //bigQ - search=coder&page=2&category=shorts&ratings[gte]=4&price[lte]=999&price[gte]=500&limit=5

router.route('/products')
  .get([
    // query("search").trim().escape(),
    // query("page").trim().escape(),
    // query("category").trim().escape(),
    // query("ratings[gte]").trim().escape(),
    // query("price[lte]").trim().escape()
    // query("price[gte]").trim().escape(),
  ], getAllProducts)

router.route('/admin/products')
  .get(adminGetAllProducts)

router.route('/product/:id')
  .get([
    param("id").trim().escape(),
  ], getSingleProduct)

router.route("/admin/product/:id")
  .put([
    param("id").trim().escape(),
    body("name").trim().escape(),
    body("price").trim().escape(),
    body("description").trim().escape(),
    body("category").trim().escape(),
    body("brand").trim().escape()
  ], isLoggedIn, customRole("admin"), adminUpdateOneProduct)

  .delete(isLoggedIn, customRole("admin"), adminDeleteOneProduct)

router.route("/review/:id")
  .put([
    param("id").trim().escape(),
    body("rating").trim().escape(),
    body("comment").trim().escape(),
  ], isLoggedIn, addReview)

  .delete(isLoggedIn, deleteReview)

router.route("/reviews/:id")
  .get(getReviewsForOneProduct)


export default router