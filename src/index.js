import log from './logger.js'
import cache from './cache.js'
import rabbitmq from './rabbitmq/index.js'
import arenaSync from './arena_sync.js'
import guildSync from './guild_sync.js'
import subSync from './sub_sync.js'
import './exchange/index.js'
import './premium_sync/index.js'

function checkMongo(){
  try{
    if(cache.status()) return checkRabbitMQ()
    setTimeout(checkMongo, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkMongo, 5000)
  }
}
function checkRabbitMQ(){
  try{
    if(rabbitmq?.status()){
      arenaSync.start()
      guildSync.start()
      subSync.start()
      return log.debug(`rabbitmq is ready...`)
    }
    setTimeout(checkRabbitMQ, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkRabbitMQ, 5000)
  }
}
checkMongo()
