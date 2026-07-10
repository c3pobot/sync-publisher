let logLevel = process.env.LOG_LEVEL || 'info';
import  { workerData } from 'worker_threads'
const POD_NAME = process.env.POD_NAME

function getName(){
  if(workerData?.POD_NAME) return workerData?.POD_NAME
  return `${POD_NAME}-manager`
}

const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Etc/GMT+5',
  hour12: false,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

function getTimeStamp(timestamp = Date.now()) {
  return timestampFormatter.format(new Date(timestamp));
}

function error(err){
  try{
    console.error(`${getTimeStamp(Date.now())} ERROR [${getName()}] ${err}`)
    if(err?.stack && logLevel == 'debug') console.error(err)
  }catch(e){
    console.error(e)
  }
}
function info(msg){
  try{
    console.log(`${getTimeStamp(Date.now())} INFO [${getName()}] ${msg}`)
  }catch(e){
    console.error(e)
  }
}
function debug(msg){
  try{
    if(logLevel?.toLowerCase() !== 'debug') return
    console.log(`${getTimeStamp(Date.now())} DEBUG [${getName()}] ${msg}`)
  }catch(e){
    console.error(e)
  }
}
export default { info, error, debug }
