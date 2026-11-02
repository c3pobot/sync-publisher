import log from './logger.js'
import { arenaCache, swgohCache } from './cache.js'
import rabbitmq from './rabbitmq/index.js'

async function syncPatreon(){
  try{
    let patreons = await swgohCache.all('patreon', {}, { _id: 1, status: 1 })
    if(!patreons || patreons?.length == 0) return
    for(let i in patreons){
      if(!patreons[i].status) continue
      let status = await rabbitmq.add('sync.arena', { id: patreons[i]._id, name: 'arena', patreonId: patreons[i]._id })
      if(!status) log.debug(`Error adding ${patreons[i]._id} to patreon que...`)
    }
    return true
  }catch(e){
    log.error(e)
  }
}
async function syncShards(){
  try{
    let shards = await arenaCache.all('payoutServers', {})
    if(!shards || shards?.length == 0) return
    for(let i in shards){
      if(!shards[i].status || shards[i].type == 'char') continue
      let status = await rabbitmq.add('sync.arena', { id: shards[i]._id, name: 'shard', shardId: shards[i]._id})
      if(!status) log.debug(`Error adding ${shards[i]._id} to shard que...`)
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
      await syncShards()
      await syncPatreon()
      syncTime = 30
    }
    setTimeout(sync, syncTime * 1000)
  }catch(e){
    log.error(e)
    setTimeout(sync, 5)
  }
}
export default { start: sync }
