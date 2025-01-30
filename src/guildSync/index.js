'use strict'
const log = require('logger')
const cmdQue = require('./cmdQue')
const sync = require('./sync')

const startCmdQue = async()=>{
  try{
    let status = await cmdQue.start()
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
startCmdQue()
