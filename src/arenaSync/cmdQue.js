const log = require('logger')
const rabbitmq = require('src/rabbitmq')
const msgTTL = +process.env.RABBIT_MQ_TTL || 60

let QUE_NAME = process.env.WORKER_QUE_NAME_SPACE || process.env.NAME_SPACE || 'default', POD_NAME = process.env.POD_NAME || 'sync-publisher', publisher, publisherReady
QUE_NAME += `.sync.arena`


const start = async()=>{
  if(!rabbitmq.ready) return
  let status = await rabbitmq.queueDelete(QUE_NAME)
  publisher = rabbitmq.createPublisher({ confirm: true, queues: [{ queue: QUE_NAME, durable: true, arguments: { 'x-queue-type': 'quorum' } }]})
  log.info(`${POD_NAME} arena publisher started...`)
  publisherReady = true
  return true
}
module.exports.start = start
module.exports.status = ()=>{
  return publisherReady
}
module.exports.send = async(payload = {})=>{
  if(!publisherReady) return
  await publisher.send(QUE_NAME, payload )
  return true
}
