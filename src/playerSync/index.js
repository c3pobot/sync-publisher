'use strict'
const log = require('logger')
const cmdQue = require('./cmdQue')
const exchange = require('./exchange')
const sync = require('./sync')

let POD_NAME = process.env.POD_NAME || 'sync-publisher'

const startCheck = ()=>{
  try{
    let status = exchange.status()
    if(status){
      startCmdQue()
      return
    }
    setTimeout(startCheck, 5000)
  }catch(e){
    log.error(e)
    setTimeout(startCheck, 5000)
  }
}
const startCmdQue = async()=>{
  try{
    let status = await cmdQue.start()
    if(status) status = await exchange.send('restart')
    if(status){
      sync()
      return
    }
    setTimeout(startCmdQue, 5000)
  }catch(e){
    log.error(e)
    setTimeout(startCmdQue, 5000)
  }
}
startCheck()
