import log from './logger.js'
import { swgohCache } from './cache.js'
import rabbitmq from './rabbitmq/index.js'

async function syncGuild(){
  try{
    let guilds = await swgohCache.all('guilds', {}, { auto: { guildId: 1 } })
    if(!guilds || guilds?.length == 0) return
    for(let i in guilds){
      if(!guilds[i]?.auto || !guilds[i]?.auto?.guildId) continue
      let status = await rabbitmq.add('sync.guild', { id: guilds[i].auto.guildId, name: 'message', guildId: guilds[i].auto.guildId })
      if(!status) log.debug(`Error adding ${guilds[i].auto.guildId} to guild que...`)
    }
    return true
  }catch(e){
    log.error(e)
  }
}
async function sync(){
  try{
    let syncTime = 5
    if(rabbitmq?.status){
      await syncGuild()
      syncTime = 30
    }
    setTimeout(sync, syncTime * 1000)
  }catch(e){
    log.error(e)
    setTimeout(sync, 5)
  }
}
export default { start: sync }
