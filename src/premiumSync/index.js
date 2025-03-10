'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const fetch = require('./fetch')
const API_URI = process.env.DISCORD_PROXY || 'https://discord.com'
const BOT_TOKEN = process.env.BOT_TOKEN

const sleep = (ms = 500)=>{ return new Promise(resolve=>{ setTimeout(resolve, ms) }) }

const CheckMongo = ()=>{
  try{
    log.debug(`start up mongo check...`)
    let status = mongo.status()
    if(status){
      Sync()
      return
    }
    setTimeout(CheckMongo, 5000)
  }catch(e){
    log.error(e)
    setTimeout(CheckMongo, 5000)
  }
}
const Sync = async()=>{
  try{
    await getServers()
    setTimeout(Sync, 5000)
  }catch(e){
    log.error(e)
    setTimeout(Sync, 5000)
  }
}
const getServers = async()=>{
  let res = await mongo.find('serverSubscriptions', {})
  if(!res || res?.length == 0) return
  for(let i in res) await checkServer(res[i])
}
const checkServer = async(svr = {})=>{
  if(!svr.id) return
  let members = await getMembers(svr.id)
  if(!members || members?.length == 0) return
  let vip = [], guild = [], shard = [], arena = []
  for(let i in members){
    if(svr.guildRole && members[i].roles?.includes(svr.guildRole)){
      if(!vip.includes(members[i].id)) vip.push(members[i].id)
      guild.push(members[i].id)
    }
    if(svr.shardRole && members[i].roles?.includes(svr.shardRole)){
      if(!vip.includes(members[i].id)) vip.push(members[i].id)
      shard.push(members[i].id)
    }
  }
  for(let i in members){
    if(svr.vipRole && members[i].roles?.includes(svr.vipRole)){
      if(!vip.includes(members[i].id)) vip.push(members[i].id)
      if(!guild.includes(members[i].id) && !shard.includes(members[i].id)) arena.push(members[i].id)
    }
  }
  await mongo.set('serverSubscriptions', { _id: svr.id }, { vip: vip, guild: guild, shard: shard, arena: arena })
  let patreons = await mongo.find('patreon', {}, { _id: 1, status: 1, subscriber: 1 })
  if(!patreons || patreons?.length == 0) return
  for(let i in patreons){
    if(!patreons[i].subscriber) continue
    if(guild.includes(patreons[i]._id) && !patreons[i].status) await mongo.set('patreon', { _id: patreons[i]._id }, { status: 1 })
    if(!guild.includes(patreons[i]._id) && patreons[i].status) await mongo.set('patreon', { _id: patreons[i]._id }, { status: 0 })
  }
}
const getMembers = async(sId)=>{
  let res = [], nextMembers = false, lastMember
  while(!nextMembers){
    let uri = `${API_URI}/api/guilds/${sId}/members?limit=1000`
    if(lastMember) uri += `&after=${lastMember}`
    let data = await fetch(uri, { headers: { 'Authorization': `Bot ${BOT_TOKEN}` }, timeout: 30000, compress: true, method: 'GET' })
      if(data && data?.length === 0) nextMembers = true
      if(data?.length > 0){
        for(let i in data){
          if(data[i].roles?.length > 0) res.push({ id: data[i].user?.id, roles: data[i].roles })
        }
        let tempMemmber = data.pop()
        lastMember = tempMemmber?.user?.id
      }
      await sleep()
  }
  return res
}
CheckMongo()
