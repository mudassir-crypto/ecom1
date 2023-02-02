import express from "express"
import { register, login, logout, forgotPassword, passwordReset, userDashboard, changePassword, updateUserDetails, adminAllUsers, managerAllUsers, adminGetOneUser, adminUpdateOneUser, adminDeleteOneUser } from "../controllers/userController.js"
import { body, param } from "express-validator"
import { customRole, isLoggedIn } from "../middleware/authMiddleware.js"

const router = express.Router()

router.route('/register')
  .post([
    body("name", "should be atleast 4 char long").isLength({ min: 4 }).trim().escape(),
    body("email").isEmail().trim().escape(),
    body("password", "should be atleast 6 chars long").isLength({ min: 6 }).trim().escape()
  ], register)

router.route('/login')
  .post([
    body("email").isEmail().trim().escape(),
    body("password", "should be atleast 6 chars long").isLength({ min: 6 }).trim().escape()
  ], login)

router.route('/logout')
  .get(logout)

router.route('/forgotpassword')
  .post([
    body("email").isEmail().trim().escape()
  ], forgotPassword)

router.route('/password/reset/:token')
  .post([
    param("token").trim().escape(),
    body("password", "should be atleast 6 chars long").isLength({ min: 6 }).trim().escape(),
    body("confirmPassword", "should be atleast 6 chars long").isLength({ min: 6 }).trim().escape()
  ], passwordReset)

router.route('/user-dashboard')
  .get(isLoggedIn, userDashboard)

router.route('/password/update')
  .post([
    body("oldPassword", "should be atleast 6 chars long").isLength({ min: 6 }).trim().escape(),
    body("newPassword", "should be atleast 6 chars long").isLength({ min: 6 }).trim().escape()
  ], isLoggedIn, changePassword)

router.route("/user-dashboard/update")
  .patch([
    body("name", "should be atleast 4 char long").isLength({ min: 4 }).trim().escape(),
    body("email").isEmail().trim().escape(),
  ], isLoggedIn, updateUserDetails)

router.route('/admin/users')
  .get(isLoggedIn, customRole("admin"), adminAllUsers)

router.route('/manager/users')
  .get(isLoggedIn, customRole("manager"), managerAllUsers)

router.route('/admin/user/:id')
  .get([
    param("id").trim().escape()
  ], isLoggedIn, customRole("admin"), adminGetOneUser)

  .patch([
    body("name", "should be atleast 4 char long").isLength({ min: 4 }).trim().escape(),
    body("email").isEmail().trim().escape(),
    body("role").trim().escape(),
  ], isLoggedIn, customRole("admin"), adminUpdateOneUser)

  .delete(isLoggedIn, customRole("admin"), adminDeleteOneUser)


export default router