import express from 'express'
import { captureStripePayment, sendStripeKey, sendRazorpayKey, captureRazorpayPayment } from '../controllers/paymentController.js'
import { isLoggedIn } from '../middleware/authMiddleware.js'

const router = express.Router()

router.route("/stripekey")
  .get(isLoggedIn, sendStripeKey)

router.route("/captureStripePayment")
  .post(isLoggedIn, captureStripePayment)

router.route("/razorpaykey")
  .get(isLoggedIn, sendRazorpayKey)

router.route("/captureRazorpayPayment")
  .post(isLoggedIn, captureRazorpayPayment)

export default router