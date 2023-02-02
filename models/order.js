import mongoose from "mongoose"

const orderSchema = new mongoose.Schema({
  shippingInfo: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    phoneNo: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  orderItems: [{
    quantity: {
      type: Number,
      required: true 
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    totalPrice: {
      type: Number,
    }
  }],
  paymentInfo: {
    id: {
      type: String
    }
  },
  taxAmount: {
    type: Number,
    required: true
  },
  shippingAmount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  orderStatus: {
    type: String,
    required: true,
    default: "processing"
  },
  deliveredAt: {
    type: Date
  }
}, {
  timestamps: true
})



export default mongoose.model("Order", orderSchema)