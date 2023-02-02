import mongoose from "mongoose"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type:String,
    required: true,
  },
  role: {
    type: String,
    default: "user"
  },
  photo: {
    id: String,
    url: String
  },
  forgotPasswordToken: String,
  forgotPasswordExpiry: Date
}, {
  timestamps: true
})


userSchema.methods = {
  matchPassword: async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password)
  },

  getJwtToken: function(){
    return jwt.sign(
      { id: this._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY}
    )
  },

  getForgotPasswordToken: function(){
    // create a long string
    const forgotToken = crypto.randomBytes(20).toString('hex')

    // hashing
    this.forgotPasswordToken = crypto.createHash('sha256').update(forgotToken).digest('hex')

    // setting expiry
    this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000
    
    return forgotToken
  }
}

userSchema.pre('save', async function(next){
  if(!this.isModified('password')){
    next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})



export default mongoose.model("User", userSchema)