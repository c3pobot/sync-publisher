'use strict'
const log = require('logger')
module.exports = (err) =>{
  try{
    if(err?.message){
      log.error(err.message)
      log.debug(err)
    }else{
      log.error(err)
    }
  }catch(e){
    log.error(e)
  }
}
