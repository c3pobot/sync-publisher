'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const rabbitmq = require('./rabbitmq')

const getPrimaryAllyCode = async(discordId)=>{
  try{
    if(!discordId) return
    let dObj = (await mongo.find('discordId', { _id: discordId }, { allyCodes: 1 }))[0]
    if(!dObj?.allyCodes || dObj.allyCodes?.length == 0) return
    let pAllyCode = dObj.allyCodes?.find(x=>x.opt == 'primary')
    if(pAllyCode) return pAllyCode.allyCode
    return dObj.allyCodes[0]?.allyCode
  }catch(e){
    log.error(e)
  }
}
const syncSubs = async()=>{
  try{
    let subs = await mongo.find('serverSubscriptions', {}, { id: 1, arena: 1, vip: 1 })
    if(!subs || subs?.length == 0) return

    for(let i in subs){
      await getArenaSubAllyCodes(subs[i])
      await getVIPAllyCodes(subs[i])
    }
  }catch(e){
    log.error(e)
  }
}
const getArenaSubAllyCodes = async(svr = {})=>{
  try{
    if(!svr.arena || svr.arena?.length == 0) return
    let botSettings = (await mongo.find('botSettings', { _id: '1' }, { botSID: 1, arenaLogChId: 1 }))[0]
    for(let i in svr.arena){
      let allyCode = await getPrimaryAllyCode(svr.arena[i])

      if(!allyCode) continue
      let status = await rabbitmq.add('sync.arena', { id: `${svr.id}-${allyCode}`, name: 'arena-sub', allyCode: allyCode, sId: botSettings?.botSID, chId: botSettings?.arenaLogChId })
      if(!status) log.debug(`Error adding ${svr.id}-${allyCode} to arena-sub que...`)
    }
  }catch(e){
    log.error(e)
  }
}
const getVIPAllyCodes = async(svr = {})=>{
  try{
    if(!svr.vip || svr.vip?.length == 0) return
    for(let i in svr.vip){
      let allyCode = await getPrimaryAllyCode(svr.vip[i])
      if(!allyCode) continue
      let status = await rabbitmq.add('sync.player', { id: allyCode, name: 'player-sub', allyCode: allyCode })
      if(!status) log.debug(`Error adding ${allyCode} to player-sub que...`)
    }
  }catch(e){
    log.error(e)
  }
}
const sync = async()=>{
  try{
    let syncTime = 5
    if(rabbitmq?.status){
      await syncSubs()
      syncTime = 30
    }
    setTimeout(sync, syncTime * 1000)
  }catch(e){
    log.error(e)
    setTimeout(sync, 5)
  }
}
module.exports.start = sync
