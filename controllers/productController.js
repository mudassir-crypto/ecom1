import asyncHandler from "@joellesenne/express-async-handler"
import Product from '../models/product.js'
import { validationResult } from "express-validator"
import cloudinary from 'cloudinary'
import WhereClause from "../utils/whereClause.js"
import mongoose from "mongoose"

const ObjectId = mongoose.Types.ObjectId

export const test = (req, res) => {
  console.log(req.query)
  const query = JSON.stringify(req.query)
  const regex = /\b(gte|lte)\b/g
  const newquery = JSON.parse(query.replace(regex, m => `$${m}`))

  res.status(200).json({
    success: true,
    newquery
  })
}

export const adminAddProduct = asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    res.status(401)
    throw new Error(`${errors.array()[0].param} ${errors.array()[0].msg}`)
  }

  let imageArr = []
  if(!req.files){
    res.status(400)
    throw new Error("Photos are required")
  }

  for(let idx = 0; idx < req.files.photos.length; idx++){
    let file = req.files.photos[idx]
    let result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
      folder: "products"
    })

    imageArr.push({
      id: result.public_id,
      url: result.secure_url
    })
  }
  
  const { name, price, description, category, brand, stock } = req.body

  try {
    const product = await Product.create({
      name,
      price,
      description,
      category,
      brand,
      stock,
      photos: imageArr,
      user: req.user._id
    })
  
    res.status(200).json({
      success: true,
      product
    })
  } catch (error) {
    for(let idx = 0; idx < imageArr.length; idx++){
      await cloudinary.v2.uploader.destroy(imageArr[idx].id)
    }
    res.status(401)
    throw new Error(error.message.substring(27))
  }

})

export const getAllProducts = asyncHandler(async (req, res) => {
  console.log(req.query)
  const resultsPerPage = 2
  const totalProductCount = await Product.countDocuments()

  const productsObj = new WhereClause(Product.find(), req.query).search().filter()

  let products = await productsObj.base
  const filteredProductLength = products.length

  productsObj.pager(resultsPerPage)
  products = await productsObj.base.clone()

  res.status(200).json({
    success: true,
    products,
    filteredProductLength,
    totalProductCount
  })
})

export const adminGetAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).populate({ path: "user", select: "-password" })

  res.status(200).json({
    success: true,
    products
  })
})


export const getSingleProduct = asyncHandler(async(req, res) => {
  const { id } = req.params

  if(!(ObjectId.isValid(id) && (String)(new ObjectId(id)) === id)){
    res.status(401)
    throw new Error("Id is invalid")
  }

  const product = await Product.findById(id).populate("user")

  if(!product){
    res.status(401)
    throw new Error("Product not found")
  }
  
  res.status(200).json({
    success: true,
    product
  })
})

export const adminUpdateOneProduct = asyncHandler(async(req, res) => {
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

  let product = await Product.findById(id)
  if(!product){
    res.status(401)
    throw new Error("Product not found")
  }

  let imageArr = []
  if(req.files){
    // destroy the existing images and 
    for(let idx = 0; idx < product.photos.length; idx++){
      const imgId = product.photos[idx].id
      await cloudinary.v2.uploader.destroy(imgId)
    }
    // upload the new ones
    for(let idx = 0; idx < req.files.photos.length; idx++){
      const file = req.files.photos[idx]
      const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
        folder: "products" //folder name should come through env
      })

      imageArr.push({
        id: result.public_id,
        url: result.secure_url
      })
    }

    req.body.photos = imageArr
  }

  // const { name, price, description, category, brand, stock, photos } = req.body

  try {
    product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    })
  
    return res.status(200).json({
      success: true,
      product
    })
  } catch (error) {
    for(let idx = 0; idx < imageArr.length; idx++){
      await cloudinary.v2.uploader.destroy(imageArr[idx].id)
    }
    res.status(401)
    throw new Error(error.message.substring(27))
  }
})

export const adminDeleteOneProduct = asyncHandler(async(req, res) => {
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

  let product = await Product.findById(id)
  if(!product){
    res.status(401)
    throw new Error("Product not found")
  }

  try {
    for(let idx = 0; idx < product.photos.length; idx++){
      await cloudinary.v2.uploader.destroy(product.photos[idx].id)
    }
  
    await product.remove()
    res.status(200).json({
      success: true,
      message: "Product is deleted"
    })
  } catch (error) {
    res.status(400)
    throw new Error("Error occured")
  }
})

export const addReview = asyncHandler(async (req, res) => {
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

  const { rating, comment } = req.body
  
  const review = {
    user: req.user._id,
    rating: Number(rating),
    comment
  }

  const product = await Product.findById(id)
  
  const alreadyReviewed = product.reviews.find((review) => review.user.toString() === req.user._id.toString())
  console.log(alreadyReviewed)
  
  if(alreadyReviewed){
    product.reviews.forEach((review) => {
      if(review.user.toString() === req.user._id.toString()){
        review.rating = rating
        review.comment = comment
      }
    })
  } else {
    console.log(review)
    product.reviews.push(review)
    product.numOfReviews = product.reviews.length
  }
  
  product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

  await product.save({ validateBeforeSave: false})
  
  res.status(200).json({
    success: true,
    message: "Review is added"
  })

})

export const deleteReview = asyncHandler(async(req, res) => {
  const { id } = req.params
  if(!(ObjectId.isValid(id) && (String)(new ObjectId(id)) === id)){
    res.status(401)
    throw new Error("Id is invalid")
  }

  const product = await Product.findById(id)
  if(!product){
    res.status(400)
    throw new Error("Product not found")
  }

  const reviews = product.reviews.filter((review) => review.user.toString() !== req.user._id.toString())

  const numOfReviews = reviews.length

  const ratings = reviews.reduce((acc, item) => item.rating + acc, 0)

  try {
    await Product.findByIdAndUpdate(id, {
      reviews,
      numOfReviews,
      ratings
    }, {
      new: true,
      runValidators: true
    })
    res.status(200).json({
      success: true,
      message: "Review is deleted"
    })
  } catch (error) {
    res.status(401)
    throw new Error(error.message)
  }

})

export const getReviewsForOneProduct = asyncHandler(async(req, res) => {
  const { id } = req.params.id 
  if(!(ObjectId.isValid(id) && (String)(new ObjectId(id)) === id)){
    res.status(401)
    throw new Error("Id is invalid")
  }

  const product = await Product.findById(id)

  res.status(200).json({
    success: true,
    reviews: product.reviews
  })
})