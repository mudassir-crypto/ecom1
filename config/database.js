import mongoose from "mongoose"

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log(`DB is connected on ${conn.connection.host}`)
  } catch (error) {
    console.log(`Error: ${error}`)
    process.exit(1)
  }
}