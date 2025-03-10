'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const rabbitmq = require('./rabbitmq')
const arenaSync = require('./arenaSync')
const guildSync = require('./guildSync')
const subSync = require('./subSync')
require('./exchange')
require('./premiumSync')
const CheckMongo = ()=>{
  try{
    log.debug(`start up mongo check...`)
    let status = mongo.status()
    if(status){
      CheckRabbitMQ()
      return
    }
    setTimeout(CheckMongo, 5000)
  }catch(e){
    log.error(e)
    setTimeout(CheckMongo, 5000)
  }
}
const CheckRabbitMQ = ()=>{
  try{
    if(!rabbitmq?.status) log.debug(`rabbitmq is not ready...`)
    if(rabbitmq?.status){
      log.debug(`rabbitmq is ready...`)
      arenaSync.start()
      guildSync.start()
      subSync.start()
      return
    }
    setTimeout(CheckRabbitMQ, 5000)
  }catch(e){
    log.error(e)
    setTimeout(CheckRabbitMQ, 5000)
  }
}
CheckMongo()
