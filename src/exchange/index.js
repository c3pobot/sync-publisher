import log from '../logger.js'
import client from '../rabbitmq/client.js'
import exchangeProcessor from './exchange_processor.js'

let POD_NAME = process.env.POD_NAME || 'worker'
let QUE_NAME = `xtopic.${POD_NAME}`, consumerStatus = false, NAME_SPACE = process.env.NAME_SPACE || 'default'

let exchanges = [{ exchange: `${NAME_SPACE}.cmds`, type: 'topic' }]
let queueBindings = [{ exchange: `${NAME_SPACE}.cmds`, queue: QUE_NAME }]

const processCmd = async(msg = {})=>{
  try{
    if(!msg.body) return
    let data = msg.body
    if(msg?.headers?.from_web_ui) data = JSON.parse(data)
    exchangeProcessor({...data,...{ routingKey: msg.routingKey, exchange: msg.exchange, timestamp: msg.timestamp }})
  }catch(e){
    log.error(e)
  }
}
let consumer = client.createConsumer({
  consumerTag: POD_NAME,
  queue: QUE_NAME,
  lazy: true,
  exchanges: exchanges,
  queueBindings: queueBindings,
  queueOptions: { queue: QUE_NAME, durable: false, exclusive: true, arguments: { 'x-message-ttl': 60000 } }
}, processCmd)

consumer.on('error', (err)=>{
  log.error(err)
})
consumer.on('ready', ()=>{
  log.info(`${POD_NAME} topic consumer created...`)
})

async function init(){
  try{
    if(!client.ready) setTimeout(init, 5000)
    await consumer.start()
    log.info(`exchange consumer started...`)
  }catch(e){
    log.error(e)
    setTimeout(init, 5000)
  }
}
init()
