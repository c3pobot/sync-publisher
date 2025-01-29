'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const cmdQue = require('./cmdQue')
const exchange = require('./exchange')
let guildSet = new Set(), producerReady, mongoReady

const checkQue = async()=>{
  let status = await cmdQue.check()
  if(status) return
  log.info(`Player Que is empty recreating....`)
  guildSet = new Set()
  await exchange.send('restart')
}

const syncGuild = async()=>{
  try{
    if(!producerReady || !mongoReady) return
    let guilds = await mongo.find('guilds', { sync: 1 }, { _id: 1, sync: 1 })
    for(let i in guilds){
      if(!guilds[i].sync) continue
      if(guildSet.has(guilds[i]._id)) continue
      let status = await cmdQue.send({ name: 'guild', guildId: guilds[i]._id })
      if(status){
        guildSet.add(guilds[i]._id)
        log.debug(`Added ${guilds[i]._id} to player que...`)
      }
    }
    return true
  }catch(e){
    log.error(e)
  }
}
const sync = async()=>{
  try{
    let syncTime = 30
    if(!producerReady) producerReady = cmdQue.status()
    if(!mongoReady) mongoReady = mongo.status()
    if(!mongoReady || !producerReady) syncTime = 5
    await checkQue()
    await syncGuild()
    setTimeout(sync, syncTime * 1000)
  }catch(e){
    log.error(e)
    setTimeout(sync, 5000)
  }
}
module.exports = sync
