import asyncHandler from '@joellesenne/express-async-handler'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'

export const isLoggedIn = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers("Authorization").replace("Bearer ", "")

    const { id } = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(id).select("-__v -forgotPasswordToken -forgotPasswordExpiry")

    next()
  } catch (error) {
    res.status(401)
    throw new Error("You are not authorised")
  }
})

export const customRole = (...roles) => {
  return (req, res, next) => {
    if(!roles.includes(req.user.role)){
      res.status(401)
      throw new Error("You are not allowed to access this resource")
    }
    next()
  }
}