require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const {RateLimiterRedis} = require('rate-limiter-flexible')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const Redis = require('ioredis')
const routes = require('./routes/identity-services')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3001

// connect to db
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => logger.info('Db Connected'))
    .catch((e) => console.log('Mongo connection error', e))

//redis
const redisClient = new Redis(process.env.REDIS)

//middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req,res,next) => {
    logger.info(`Recieved ${req.method} request to ${req.url}`)
    logger.info(`Request body ${req.body}`)
    next()
})

//DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient, // Using Redis as the storage
    keyPrefix: 'middleware',  // Prefix for rate limiter keys
    points: 10,                // Allow 10 requests
    duration: 3,             // Per 3 seconds
})

app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => next()).catch(() => {
        logger.warn(`Rate limit exceeded for ${req.ip}`)
        res.status(429).json({success: false, message: 'Too many request'})
    })
})

// Ip based rate limiting for sensetive endpoint
const sensetiveEndpointsLimiter = rateLimit({
    windowMs: 15*60*1000,
    max: 50,
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

// apply this sensetiveEndpointsLimiter to our routes
app.use('/api/auth/register', sensetiveEndpointsLimiter)

// routes
app.use('/api/auth', routes)

//error handler
app.use(errorHandler)

app.listen(PORT, ()=> {
    logger.info(`Identity service running on PORT`)
})

// unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection at', promise, 'reason:', reason)
})