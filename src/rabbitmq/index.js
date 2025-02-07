'use strict'
const log = require('logger')
const client = require('./client')
const reportError = require('src/reportError')
const exchange = require('./exchange')

let POD_NAME = process.env.POD_NAME || 'sync-publisher', NAME_SPACE = process.env.NAME_SPACE || 'default'
let DEFAULT_EXCHANGE = `${NAME_SPACE}.cmds`

let queues = [{ queue: 'sync.arena', arguments: { 'x-message-deduplication': true } }, { queue: 'sync.guild', arguments: { 'x-message-deduplication': true } }]
let exchanges = [{ exchange: DEFAULT_EXCHANGE, type: 'topic', maxAttempts: 5 }]

log.info(`${POD_NAME} topic exchange publisher created...`)
log.info(`${POD_NAME} queue publisher created...`)

let publisher = client.createPublisher({ exchanges: exchanges, queues: queues })
publisher.on('close', ()=>{
  log.info(`${POD_NAME} topic exchange publisher disconnected...`)
})
module.exports = {
  get status(){
    return client?.ready
  }
}
module.exports.add = async(queName, payload)=>{
  try{
    if(!queName || !payload || !payload?.id || !client.ready) return
    await publisher.send ({ routingKey: queName, headers: { 'x-deduplication-header': payload.id } }, payload)
    return true
  }catch(e){
    if(e?.message?.includes('message rejected by server')) return true
    reportError(e)
  }
}
module.exports.check = async(queName)=>{
  try{
    if(!client.ready) return
    let queProps = queues.find(x=>x.queue === queName)
    if(!queProps) return
    return await client.queueDeclare(queProps)
  }catch(e){
    reportError(e)
  }
}
module.exports.notify = async( data, routingKey, exchange )=>{
  try{
    if(!data || !client.ready) return
    if(!exchange) exchange = DEFAULT_EXCHANGE
    await publisher.send({ exchange: exchange, routingKey: routingKey }, data)
    return true
  }catch(e){
    reportError(e)
  }
}
module.exports.start = () =>{
  exchange.start()
}
