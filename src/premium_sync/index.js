import log from '../logger.js'
import fetch from './fetch.js'
import { swgohCache, sharedCache } from '../cache.js'

const API_URI = process.env.DISCORD_PROXY || 'https://discord.com'
const BOT_TOKEN = process.env.BOT_TOKEN

const sleep = (ms = 500)=>{ return new Promise(resolve=>{ setTimeout(resolve, ms) }) }

async function getMembers(sId){
  let res = [], nextMembers = false, lastMember
  while(!nextMembers){
    let uri = `${API_URI}/api/guilds/${sId}/members?limit=1000`
    if(lastMember) uri += `&after=${lastMember}`
    let data = await fetch(uri, { headers: { 'Authorization': `Bot ${BOT_TOKEN}` }, compress: true, method: 'GET' })
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

async function checkServer(svr = {}){
  if(!svr.id) return
  let members = await getMembers(svr.id)
  if(!members || members?.length == 0) return
  let vip = [], guild = [], shard = [], arena = []
  for(let m of members){
    if(svr.guildRole && m.roles?.includes(svr.guildRole)){
      if(!vip.includes(m.id)) vip.push(m.id)
      guild.push(m.id)
      await sharedCache.set('vipMemberList', { _id: m.id }, { id: m.id, status: true, allcode_limit: 200, subscriber: true })
    }
    if(svr.shardRole && m.roles?.includes(svr.shardRole)){
      if(!vip.includes(m.id)) vip.push(m.id)
      shard.push(m.id)
    }
  }
  for(let m in members){
    if(svr.vipRole && m.roles?.includes(svr.vipRole)){
      if(!vip.includes(m.id)) vip.push(m.id)
      if(!guild.includes(m.id) && !shard.includes(m.id)){
        await sharedCache.set('vipMemberList', { _id: m.id }, { id: m.id, status: true, allcode_limit: 0, subscriber: true })
        arena.push(m.id)
      }
    }
  }
  await swgohCache.set('serverSubscriptions', { _id: svr.id }, { vip, guild, shard, arena })
  let patreons = await sharedCache.all('vipMemberList', {}, { _id: 1, status: 1, subscriber: 1 })
  if(!patreons || patreons?.length == 0) return
  for(let i in patreons){
    if(!patreons[i].subscriber) continue
    if(!guild.includes(patreons[i]._id) && patreons[i].status) await sharedCache.set('vipMemberList', { _id: patreons[i]._id }, { status: false })
  }
}

async function getServers(){
  let res = await swgohCache.all('serverSubscriptions', {})
  if(!res || res?.length == 0) return
  for(let i in res) await checkServer(res[i])
}

async function sync(){
  try{
    await getServers()
    setTimeout(sync, 5000)
  }catch(e){
    log.error(e)
    setTimeout(sync, 5000)
  }
}
function checkMongo(){
  try{
    log.debug(`start up mongo check...`)
    if(swgohCache.status()) return sync()
    setTimeout(checkMongo, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkMongo, 5000)
  }
}

checkMongo()
