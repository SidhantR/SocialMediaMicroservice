const amqp = require('amqplib')
const logger = require('../utils/logger')

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'facebook_events'

module.exports = {
    async connectRabbitMQ (){
        try{
          // establishes a TCP connection
          connection = await amqp.connect(process.env.RABBITMQ_URL);
          //virtual connection within a RabbitMQ connection.
          channel = await connection.createChannel();
        
          await channel.assertExchange(
            EXCHANGE_NAME,
            //Routes messages using wildcard patterns (* and #) in the routing key
            'topic',
            //Exchange won't persist after RabbitMQ restarts
            {durable: false}
          )
          logger.info('Connected to rabbit mq')

          return channel
        } catch(err){
            logger.error('Error connecting to rabbit mq', err)
        }
     }
}
