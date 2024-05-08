'use strict'
const log = require('logger')
const rabbitmq = require('src/rabbitmq')

let POD_NAME = process.env.POD_NAME || 'sync-publisher', NAME_SPACE = process.env.NAME_SPACE || 'default'
let EXCHANGE_NAME = process.env.CONTROL_EXCHANGE_NAME || 'control'
let ROUTING_KEY = `${NAME_SPACE}.${EXCHANGE_NAME}.player`

let publisher, publisherReady, producerReady
const start = async()=>{
  try{
    if(!rabbitmq.ready){
      setTimeout(start, 5000)
      return
    }
    publisher = rabbitmq.createPublisher({ confirm: true, exchanges: [{ exchange: EXCHANGE_NAME, type: 'topic', durable: true, maxAttempts: 5 }]})
    publisherReady = true
    publisher.on('basic.return', (msg)=>{
      log.info('basic.return')
      log.info(msg)
    })
    publisher.on('retry', (err, envelope, body)=>{
      log.info('retry')
      log.info(err)
    })
    log.info(`${POD_NAME} ${ROUTING_KEY} publisher is ready...`)
    return true
  }catch(e){
    log.error(e)
    setTimeout(start, 5000)
  }
}
start()
module.exports.status = ()=>{
  return publisherReady
}
module.exports.send = async(cmd)=>{
  if(!publisherReady || !cmd) return
  await publisher.send({ exchange: EXCHANGE_NAME, routingKey: ROUTING_KEY }, { cmd: cmd, set: 'player', timestamp: Date.now() })
  return true
}
