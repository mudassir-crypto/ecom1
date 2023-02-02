import mongoose from "mongoose"


const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "name is required"],
    trim: true
  },
  price: {
    type: Number,
    required: [true, "price is required"],
  },
  description: {
    type: String,
    required: [true, "description is required"]
  },
  category: {
    type: String,
    required: [true, "Select a category from: shortsleeves, longsleeves, sweatshirt, hoodies"],
    enum: {
      values: [
        "shortsleeves",
        "longsleeves",
        "sweatshirt",
        "hoodies"
      ],
      message: "Please select category only from: short-sleeves, long-sleeves, sweat-shirt, hoodies"
    }
  },
  brand: {
    type: String,
    required: [true, "brand name is required"]
  },
  stock: {
    type: Number,
    required: [true, "stock is required"]
  },
  photos: [{
      id: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
  }],
  ratings: {
    type: Number,
    default: 0
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      rating: {
        type: Number,
        required: true
      },
      comment: {
        type: String,
        required: true
      }
    }
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
})

// name
// price
// description
// photos[]
// category
// brand
// stock
// ratings
// numOfReviews
// reviews[user, name,
// rating,comment]
// user

export default mongoose.model("Product", productSchema)