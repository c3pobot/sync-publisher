'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const cmdQue = require('./cmdQue')
let producerReady, mongoReady

const checkQue = async()=>{
  let status = await cmdQue.check()
  if(status) return
  log.debug(`Player Que is empty recreating....`)
  return true
}

const syncGuild = async()=>{
  try{
    if(!producerReady || !mongoReady) return
    let guilds = await mongo.find('guilds', { sync: 1 }, { _id: 1, sync: 1 })
    for(let i in guilds){
      if(!guilds[i].sync) continue
      let status = await cmdQue.send({ name: 'guild', guildId: guilds[i]._id })
      if(status) log.debug(`Added ${guilds[i]._id} to player que...`)
    }
    return true
  }catch(e){
    log.error(e)
  }
}
const sync = async()=>{
  try{
    let syncTime = 5
    if(!producerReady) producerReady = cmdQue.status()
    if(!mongoReady) mongoReady = mongo.status()
    await checkQue()
    await syncGuild()
    setTimeout(sync, syncTime * 1000)
  }catch(e){
    log.error(e)
    setTimeout(sync, 5000)
  }
}
module.exports = sync
