require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const mediaRoutes = require('./routes/media-routes')
const logger = require('./utils/logger')
const errorHandler = require('./middlewares/errorHandler')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')

const app = express()
const PORT = process.env.PORT || 3004
const Redis = require('ioredis')

mongoose
.connect(process.env.MONGO_URI)
.then(() => logger.info('Mongo db connected'))
.catch((err) => logger.error('Mongo connection error'))

//redis
const redisClient = new Redis(process.env.REDIS_URL)

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req,res,next) => {
    logger.info(`Recieved ${req.method} request to ${req.url}`)
    logger.info(`Request body ${req.body}`)
    next()
})

// Ip based rate limiting for sensetive endpoint
const sensetiveEndpointsLimiter = rateLimit({
    windowMs: 15*60*1000,  //_ min
    max: 50,               // _ request per window
    standardHeaders: true,  // include standard info in response header
    legacyHeaders: false,
    handler: (req,res) => {
        console.log(`Sensitive endpoint rate limit exceeded for ${req.ip}`)
        res.status(429).json({success: false, message: 'Too many request'})
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
})

app.use('/api/media/upload', sensetiveEndpointsLimiter)

app.use('/api/media', mediaRoutes)
app.use(errorHandler)

app.listen(PORT, ()=> {
    logger.info(`Media service running on PORT`)
})

//unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection at', promise, 'reason:', reason);
})