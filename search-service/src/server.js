require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./middlewares/errorHandler')
const logger = require('./utils/logger')
const {connectRabbitMQ, consumeEvent} = require('./utils/rabbitmq')
const seachRoutes = require('./routes/search-routes')
const { handlePostCreate } = require('./eventHandlers/search-event-handlers')

const app = express()
const PORT = process.env.PORT || 3004

// connect to db
mongoose
.connect(process.env.MONGO_URI)
.then(() => logger.info('Db Connected'))
.catch((e) => logger.error('Mongo connection error', e)) 

//redis
const redisClient = new Redis(process.env.REDIS_URL)

//middleware
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
        logger.warn(`Sensitive endpoint rate limit exceeded for ${req.ip}`)
        res.status(429).json({success: false, message: 'Too many request'})
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
})

// apply this sensetiveEndpointsLimiter to our routes
app.use('/api/search/posts', sensetiveEndpointsLimiter)

app.use('/api/search', seachRoutes)

app.use(errorHandler)

async function startServer() {
    try {
        await connectRabbitMQ()

        //consume the event / subscribe to the event
        await consumeEvent('post:created',handlePostCreate)

        app.listen(PORT, () => {
            logger.info(`Search service running on PORT', ${PORT}`)
        })
    } catch (error) {
        logger.error('Failed to start server', error)
        process.exit(1)
    }
}
startServer()

// unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection at', promise, 'reason:', reason)
})