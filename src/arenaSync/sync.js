'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const cmdQue = require('./cmdQue')
let producerReady, mongoReady

const checkQue = async()=>{
  let status = await cmdQue.check()
  if(status) return
  log.debug(`Arena Que is empty re adding....`)
  return true
}

const syncPatreon = async()=>{
  try{
    if(!producerReady || !mongoReady) return
    let patreons = await mongo.find('patreon', {status: 1}, {_id: 1, status: 1})
    if(!patreons || patreons?.length == 0) return
    for(let i in patreons){
      let status = await cmdQue.send({ name: 'arena', patreonId: patreons[i]._id })
      if(status) log.debug(`Added ${patreons[i]._id} to patreon que...`)
    }
    return true
  }catch(e){
    log.error(e)
  }
}
const syncShards = async()=>{
  try{
    if(!producerReady || !mongoReady) return
    let shards = await mongo.find('payoutServers', { status: 1 })
    if(shards?.length == 0) return
    for(let i in shards){
      let status = await cmdQue.send({ name: 'shard', shardId: shards[i]._id})
      if(status) log.debug(`Added ${shards[i]._id} to shard que...`)
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
    await syncShards()
    await syncPatreon()
    setTimeout(sync, syncTime * 1000)
  }catch(e){
    log.error(e)
    setTimeout(sync, 5000)
  }
}
module.exports = sync
