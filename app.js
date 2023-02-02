import express from "express"
import fileUpload from "express-fileupload"
import cookieParser from "cookie-parser"
import morgan from "morgan"
import { errorHandler, notFound } from "./middleware/errorMiddleware.js"
import userRoutes from './routes/userRoutes.js'
import productRoutes from './routes/productRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import orderRoutes from './routes/orderRoutes.js'

const app = express()

// middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}))
app.use(morgan('tiny'))

app.use('/api/v1', userRoutes)
app.use('/api/v1', productRoutes)
app.use('/api/v1/payment', paymentRoutes)
app.use('/api/v1', orderRoutes)

app.get('/', (req, res) => {
  res.send("API is working")
})

app.use(notFound)
app.use(errorHandler)


export default app