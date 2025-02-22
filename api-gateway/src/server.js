require('dotenv').config()
const express = require('express');
const cors = require('cors')
const Redis = require('ioredis')
const helmet = require('helmet')
const { rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis');
const logger = require('./utils/logger');
const proxy = require('express-http-proxy');
const errorHandler = require('./middlewares/errorhandler');

const app = express()
const PORT = process.env.PORT || 3000

const redisClient = new Redis(process.env.REDIS_URL)

app.use(helmet())
app.use(cors())
app.use(express.json())

// ip based rate limiting for sensetive endpoint
const rateLimiting = rateLimit({
    windowMs: 15 * 16 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req,res) => {
        logger.warn(`Sensetive endpoint rate exceeded for ip ${req.ip}`)
        res.status(429).json({success: false, message: 'Too many requests'})
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
    //The store option in the rateLimit middleware is used to store and track request counts for each IP address over a given time window
    //using a Redis store allows rate limits to persist across server restarts and scale across multiple servers.
})

app.use(rateLimiting)

app.use((req,res, next) => {
    logger.info(`Recieved ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`)
    next()
})

const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, '/api')
    },
    proxyErrorHandler : (err,res,next) => {
        logger.error(`Proxy error : ${err.message}`)
        res.status(500).json({
            message: "Internal server Error",
            error: err.message
        })
        next(err)
    }
}

//setting up proxy for dentity service
app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-type"] = "application/json"
        return proxyReqOpts
    },
    userResDecorator: (proxyRes,proxyResData, userReq, userRes) => {
        logger.info(`Response recieved from Identity service: ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

app.use(errorHandler)

app.listen(PORT, () => {
    logger.info(`API Gateway is running on port ${PORT}`)
    logger.info(`Identity Service is running on port ${process.env.IDENTITY_SERVICE_URL}`)
    logger.info(`Redis  url ${process.env.REDIS_URL}`)
})