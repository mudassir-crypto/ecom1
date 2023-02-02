import asyncHandler from "@joellesenne/express-async-handler"
import User from '../models/user.js'
import { validationResult } from "express-validator"
import { cookieToken } from "../utils/cookieToken.js"
import cloudinary from 'cloudinary'
import mailHelper from "../utils/emailHelper.js"
import crypto from 'crypto'
import mongoose from "mongoose"

const ObjectId = mongoose.Types.ObjectId

export const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    res.status(401)
    throw new Error(`${errors.array()[0].param} ${errors.array()[0].msg}`)
  }

  if(!req.files){
    res.status(401)
      throw new Error("Photo is required")
  }

  const { name, email, password } = req.body

  const existingUser = await User.findOne({ email })
  if(existingUser){
    res.status(401)
    throw new Error("Email already exists")
  }

  let file = req.files.photo
  let result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: 'users',
  }) 
  
  try {
     
    const user = await User.create({
      name, 
      email: email.toLowerCase(), 
      password,
      photo: {
        id: result.public_id,
        url: result.secure_url
      } 
    })

    user.password = undefined
    cookieToken(user, res)

  } catch (error) {
    throw new Error("Error in registering the user")
  }
})

export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    res.status(401)
    throw new Error(`${errors.array()[0].param} ${errors.array()[0].msg}`)
  }

  const { email, password } = req.body

  const user = await User.findOne({ email }).select("-__v -forgotPasswordToken -forgotPasswordExpiry")

  if(!user){
    res.status(401)
    throw new Error("User does not exist")
  }

  if(user && (await user.matchPassword(password))){
    user.password = undefined
    cookieToken(user, res)
  } else {
    res.status(401)
    throw new Error("email or password is incorrect")
  }

})

export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true
  })
  res.status(200).json({
    success: true,
    message: "Logout successfully"
  })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  const user = await User.findOne({ email })
  if(!user){
    res.status(401)
    throw new Error("User does not exist")
  }
  
  const forgotToken = await user.getForgotPasswordToken()

  await user.save({ validateBeforeSave: false })

  const url = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${forgotToken}`

  const message = `Copy paste this link in your URL and hit enter \n ${url}`

  try {
    await mailHelper({
      email: user.email,
      subject: "Invictus: Password Reset",
      message
    })

    res.status(201).json({
      message: "Email is sent successfully"
    })

  } catch (error) {
    user.forgotPasswordToken = undefined
    user.forgotPasswordExpiry = undefined
    await user.save({ validateBeforeSave: false })
    res.status(401)
    throw new Error(error.message)
  }
})

export const passwordReset = asyncHandler(async (req, res) => {
  const forgotToken = req.params.token

  const forgotPasswordToken = crypto.createHash('sha256').update(forgotToken).digest('hex')

  const user = await User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: {$gt: Date.now()}
  })
  if(!user){
    res.status(400)
    throw new Error("Token is invalid or expired")
  }

  const { password, confirmPassword } = req.body
  if(password !== confirmPassword){
    res.status(400)
    throw new Error("Passwords do not match")
  }

  user.password = password
  user.forgotPasswordToken = undefined
  user.forgotPasswordExpiry = undefined
  await user.save()
  res.status(201).json({
    success: true,
    message: "Password is changed"
  })
})

export const userDashboard = asyncHandler(async (req, res) => {
  const user = req.user
  user.password = undefined

  res.status(201).json(user)
})

export const changePassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    res.status(401)
    throw new Error(`${errors.array()[0].param} ${errors.array()[0].msg}`)
  }

  const { oldPassword, newPassword } = req.body

  const user = req.user
  if(!user){
    res.status(400)
    throw new Error("User does not exist")
  }

  if(user && (await user.matchPassword(oldPassword))){
    user.password = newPassword
    await user.save()
    user.password = undefined
    cookieToken(user, res)
  } else {
    res.status(401)
    throw new Error("Old Password is incorrect")
  }
})

export const updateUserDetails = asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    res.status(401)
    throw new Error(`${errors.array()[0].param} ${errors.array()[0].msg}`)
  }

  const { name, email } = req.body
  const newData = {
    name, email
  }

  if(email !== req.user.email){
    const existingUser = await User.findOne({ email })
    if(existingUser){
      res.status(400)
      throw new Error("Email already exists, try a different one")
    }
  }

  if(req.files){
    const user = await User.findById(req.user._id)

    const imgId = user.photo.id
    const resp = await cloudinary.v2.uploader.destroy(imgId)
    //console.log(resp)
    const file = req.files.photo
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
      folder: "users"
    })

    newData.photo = {
      id: result.public_id,
      url: result.secure_url
    }
  }


  const user = await User.findByIdAndUpdate(req.user._id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  })

  res.status(200).json({
    success: true,
    user
  })
  
})

export const adminAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password")

  res.status(200).json({
    success: true,
    users
  })
})

export const managerAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "user" }).select("-password")

  res.status(200).json({
    success: true,
    users
  })
})

export const adminGetOneUser = asyncHandler(async (req, res) => {
  const { id } = req.params

  if(!(ObjectId.isValid(id) && (String)(new ObjectId(id)) === id)){
    res.status(401)
    throw new Error("Id is invalid")
  }

  const user = await User.findById(id).select("-password")

  if(!user){
    res.status(401)
    throw new Error("User does not exist")
  }

  res.status(200).json({
    success: true,
    user
  })
})

export const adminUpdateOneUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    res.status(401)
    throw new Error(`${errors.array()[0].param} ${errors.array()[0].msg}`)
  }

  const { id } = req.params

  if(!(ObjectId.isValid(id) && (String)(new ObjectId(id)) === id)){
    res.status(401)
    throw new Error("Id is invalid")
  }

  const { name, email, role } = req.body
  const newData = {
    name, email, role
  }

  const requser = await User.findById(id)
  if(email !== requser.email){
    const existingUser = await User.findOne({ email })
    if(existingUser){
      res.status(400)
      throw new Error("Email already exists, try a different one")
    }
  }

  const user = await User.findByIdAndUpdate(requser._id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  })
  user.password = undefined
  res.status(200).json({
    success: true,
    user
  })

})

export const adminDeleteOneUser = asyncHandler(async (req, res) => {
  const { id } = req.params

  if(!(ObjectId.isValid(id) && (String)(new ObjectId(id)) === id)){
    res.status(401)
    throw new Error("Id is invalid")
  }

  const user = await User.findById(id)
  if(!user){
    res.status(400)
    throw new Error("User does not exist")
  }

  const imageId = user.photo.id
  await cloudinary.v2.uploader.destroy(imageId)

  await user.remove()

  res.status(200).json({
    success: true
  })
})