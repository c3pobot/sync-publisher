'use strict'
const log = require('logger')
const fetch = require('node-fetch')
const parseResponse = async(res)=>{
  try{
    if(!res) return
    if (res?.status?.toString().startsWith('5')) {
      throw('Bad status code '+res.status)
    }
    let body

    if (res?.status === 204) {
      body = null
    } else if (res?.headers?.get('Content-Type')?.includes('application/json')) {
      body = await res?.json()
    } else {
      body = await res?.text()
    }
    return {
      status: res?.status,
      body: body
    }
  }catch(e){
    throw(e);
  }
}
module.exports = async(uri, opts = {})=>{
  try{
    let res = await fetch(uri, opts)
    res = await parseResponse(res)
    return res?.body
  }catch(e){
    log.error(e)
  }
}
