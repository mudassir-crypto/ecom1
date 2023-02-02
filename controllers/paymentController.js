import asyncHandler from "@joellesenne/express-async-handler"
import stripe from "stripe"
import Razorpay from 'razorpay'
import { nanoid } from "nanoid"

const stripeInstance = stripe(process.env.STRIPE_SECRET)

export const sendStripeKey = asyncHandler(async(req, res) => {
  res.status(200).json({
    stripeKey: process.env.STRIPE_API_KEY
  })
})

export const captureStripePayment = asyncHandler(async(req, res) => {
  //paymentIntent is created only on success payments
  const paymentIntent = await stripeInstance.paymentIntents.create({
    amount: req.body.amount,
    currency: 'inr',
    automatic_payment_methods: {enabled: true},

    // optional
    metadata: {integration_check: "accept_a_payment"}
  })

  res.status(200).json({
    success: true,
    client_secret: paymentIntent.client_secret
  })
})

export const sendRazorpayKey = asyncHandler(async(req, res) => {
  res.status(200).json({
    razorpayKey: process.env.RAZORPAY_API_KEY
  })
})

export const captureRazorpayPayment = asyncHandler(async(req, res) => {

  const { amount } = req.body 

  const instance = new Razorpay({key_id: process.env.RAZORPAY_API_KEY, key_secret: process.env.RAZORPAY_SECRET})

  try {
    const order = await instance.orders.create({
      amount: amount*100,
      currency: "INR",
      receipt: nanoid()
    })
    //console.log(order)
    res.status(200).json({
      success: true,
      amount,
      order
    })
  } catch (error) {
    res.status(401)
    throw new Error(`${error.error.code}: ${error.error.description}`)
  }
  
})