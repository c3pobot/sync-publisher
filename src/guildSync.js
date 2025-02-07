'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const rabbitmq = require('./rabbitmq')
const reportError = require('./reportError')

const syncGuild = async()=>{
  try{
    let guilds = await mongo.find('guilds', { 'auto.guildId': { $exists: true } }, { auto: 1 })
    if(!guilds || guilds?.length == 0) return
    for(let i in guilds){
      if(!guilds[i]?.auto || !guilds[i]?.auto?.guildId) continue
      let status = await rabbitmq.add('sync.guild', { id: guilds[i].auto.guildId, name: 'message', guildId: guilds[i].auto.guildId })
      if(!status) log.debug(`Error adding ${guilds[i].auto.guildId} to guild que...`)
    }
    return true
  }catch(e){
    reportError(e)
  }
}
const sync = async()=>{
  try{
    let syncTime = 5
    if(rabbitmq?.status){
      await syncGuild()
      syncTime = 30
    }
    setTimeout(sync, syncTime * 1000)
  }catch(e){
    reportError(e)
    setTimeout(sync, 5)
  }
}
module.exports.start = sync
