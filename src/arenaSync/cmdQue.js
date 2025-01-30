const log = require('logger')
const rabbitmq = require('src/rabbitmq')
const msgTTL = +process.env.RABBIT_MQ_TTL || 60

let QUE_NAME = process.env.WORKER_QUE_NAME_SPACE || process.env.NAME_SPACE || 'default', POD_NAME = process.env.POD_NAME || 'sync-publisher', publisher, publisherReady
QUE_NAME += `.sync.arena`

let queProps = { queue: QUE_NAME, arguments: { 'x-message-deduplication': true } }
const start = async()=>{
  if(!rabbitmq.ready) return
  publisher = rabbitmq.createPublisher({ confirm: true, queues: [queProps]})
  log.info(`${POD_NAME} arena publisher started...`)
  publisherReady = true
  return true
}
module.exports.start = start
module.exports.status = ()=>{
  return publisherReady
}
module.exports.send = async(payload = {})=>{
  try{
    if(!publisherReady) return
    let obj = { routingKey: QUE_NAME, headers: { 'x-deduplication-header': payload.patreonId || payload.shardId } }
    if(!obj.headers['x-deduplication-header']) return
    await publisher.send(obj, payload )
    return true
  }catch(e){
    if(e?.message?.includes('message rejected by server')) return
    throw(e)
  }
}
module.exports.check = async()=>{
  if(!publisherReady) return
  let status = await rabbitmq.queueDeclare(queProps)
  return status?.messageCount
}
