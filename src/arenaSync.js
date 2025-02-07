'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const rabbitmq = require('./rabbitmq')
const reportError = require('./reportError')

const syncPatreon = async()=>{
  try{
    let patreons = await mongo.find('patreon', {status: 1}, {_id: 1, status: 1})
    if(!patreons || patreons?.length == 0) return
    for(let i in patreons){
      let status = await rabbitmq.add('sync.arena', { id: patreons[i]._id, name: 'arena', patreonId: patreons[i]._id })
      if(!status) log.debug(`Error adding ${patreons[i]._id} to patreon que...`)
    }
    return true
  }catch(e){
    reportError(e)
  }
}
const syncShards = async()=>{
  try{
    let shards = await mongo.find('payoutServers', { status: 1 })
    if(!shards || shards?.length == 0) return
    for(let i in shards){
      let status = await rabbitmq.add('sync.arena', { id: shards[i]._id, name: 'shard', shardId: shards[i]._id})
      if(!status) log.debug(`Error adding ${shards[i]._id} to shard que...`)
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
      await syncShards()
      await syncPatreon()
      syncTime = 30
    }
    setTimeout(sync, syncTime * 1000)
  }catch(e){
    reportError(e)
    setTimeout(sync, 5)
  }
}
module.exports.start = sync
