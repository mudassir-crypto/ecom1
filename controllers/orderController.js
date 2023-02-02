import Order from "../models/order.js"
import Product from "../models/product.js"
import asyncHandler from "@joellesenne/express-async-handler"
import mongoose from "mongoose"

const {ObjectId} = mongoose.Types

export const createOrder = asyncHandler(async(req, res) => {

  const { shippingInfo, orderItems, paymentInfo, taxAmount, shippingAmount } = req.body

  let totalAmount = 0
  for(let idx = 0; idx < orderItems.length; idx++){
    let product = await Product.findById(orderItems[idx].product)
    orderItems[idx]['totalPrice'] = Number(orderItems[idx].quantity) * Number(product.price)
    totalAmount += Number(orderItems[idx]['totalPrice'])
  }


  totalAmount += Number(taxAmount) + Number(shippingAmount)

  try {
    const order = await Order.create({
      shippingInfo, orderItems, paymentInfo, taxAmount, shippingAmount, totalAmount, user: req.user._id 
    })

    order.orderItems.forEach(async(prod) => {
      await updateStock(prod.product, prod.quantity)
    })

    res.status(200).json({
      success: true,
      order
    })
  } catch (error) {
    res.status(401)
    throw new Error(error)
  }
  
})

export const getOrderById = asyncHandler(async(req, res) => {
  const { id } = req.params 
  if(!(ObjectId.isValid(id) && (String)(new ObjectId(id)) === id)){
    res.status(401)
    throw new Error("Id is invalid")
  }

  const order = await Order.findById(id).populate("orderItems.product").populate({ path: "user", select: "-password"})

  if(!order){
    res.status(401)
    throw new Error("Order does not exist")
  }

  return res.status(200).json({
    success: true,
    order
  })
})

export const getMyOrders = asyncHandler(async(req, res) => {

  const orders = await Order.find({ user: req.user._id }).populate("orderItems.product")
  
  if(orders.length == 0){
    return res.status(200).json({
      message: "You have no orders"
    })
  }

  return res.status(200).json({
    success: true,
    orders
  })
})

export const getMyOrderById = asyncHandler(async(req, res) => {
  const { id } = req.params 
  if(!(ObjectId.isValid(id) && (String)(new ObjectId(id)) === id)){
    res.status(401)
    throw new Error("Id is invalid")
  }

  const order = await Order.find({ _id: id, user: req.user._id })

  if(order.length === 0){
    res.status(401)
    throw new Error("Order not found")
  }

  res.status(200).json({
    success: true,
    order
  })
})

export const adminGetAllOrders = asyncHandler(async(req, res) => {
  const orders = await Order.find({}).populate("orderItems.product").populate({ path: "user", select: "-password"})

  res.status(200).json({
    orders
  })
})

export const adminUpdateOrder = asyncHandler(async(req, res) => {
  const { id } = req.params
  if(!(ObjectId.isValid(id) && (String)(new ObjectId(id)) === id)){
    res.status(401)
    throw new Error("Id is invalid")
  }

  const order = await Order.findById(id)
  if(!order){
    res.status(401)
    throw new Error("Order not found")
  }

  if(order.orderStatus === "delivered"){
    res.status(401)
    throw new Error("Order is already marked as delivered")
  }

  order.orderStatus = req.body.orderStatus
  if(req.body.orderStatus === "delivered"){
    order.deliveredAt = Date.now()
  }

  try {
    await order.save()
    res.status(200).json({
      message: "Order is updated"
    })
  } catch (error) {
    res.status(401)
    throw new Error(error)
  }

  
})

export const adminDeletOrder = asyncHandler(async(req, res) => {
  const { id } = req.params
  if(!(ObjectId.isValid(id) && (String)(new ObjectId(id)) === id)){
    res.status(401)
    throw new Error("Id is invalid")
  }

  const order = await Order.findById(id)
  if(!order){
    res.status(401)
    throw new Error("Order not found")
  }

  await order.remove()
  res.status(200).json({
    message: "Order is deleted"
  })
})

const updateStock = async (productId, quantity) => {
  const product = await Product.findById(productId)
  product.stock -= quantity
  // if(product.stock <= 0){
  //   res.status(401)
  //   throw new Error("Product is out of stock")
  // }
  await product.save({ validateBeforeSave: false })
}