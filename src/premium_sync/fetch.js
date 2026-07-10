import log from '../logger.js'

async function parseResponse( res ){
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
async function fetchRequest(uri, opts){
  try{
    opts.signal = AbortSignal.timeout(10000)
    let res = await fetch(uri, opts)
    return await parseResponse(res)
  }catch(e){
    if(e?.name) return { error: e.name, message: e.message }
    if(e?.status) return await parseResponse(e)
    throw(e)
  }
}
export default async function( uri, opts ){
  try{
    let res = await fetchRequest(uri, opts)
    return res?.body
  }catch(e){
    log.error(e)
  }
}
