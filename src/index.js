'use strict'
const log = require('logger')
const mongo = require('mongoclient')
const rabbitmq = require('./rabbitmq')
const arenaSync = require('./arenaSync')
const guildSync = require('./guildSync')
const reportError = require('./reportError')

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
    reportError(e)
    setTimeout(CheckMongo, 5000)
  }
}
const CheckRabbitMQ = ()=>{
  try{
    if(!rabbitmq?.status) log.debug(`rabbitmq is not ready...`)
    if(rabbitmq?.status){
      log.debug(`rabbitmq is ready...`)
      rabbitmq.start()
      arenaSync.start()
      guildSync.start()
      return
    }
    setTimeout(CheckRabbitMQ, 5000)
  }catch(e){
    reportError(e)
    setTimeout(CheckRabbitMQ, 5000)
  }
}
CheckMongo()
