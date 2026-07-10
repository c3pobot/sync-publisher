import { MongoCache, MongoCacheShared } from 'mongo-cache'
const NAME_SPACE = process.env.NAME_SPACE || 'default'

MongoCacheShared.connect('mongodb://mongo-data.datastore.svc.cluster.local?replicaSet=rs1&ssl=false&compressors=snappy&retryReads=true&retryWrites=true')

const swgohCache = new MongoCache({
  connection_string: `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}/?compressors=zlib&retryReads=true&retryWrites=true&maxPoolSize=200&authSource=${process.env.MONGO_AUTH_DB}&replicaSet=${process.env.MONGO_REPSET}`,
  db_name: process.env.MONGO_DB
})

const arenaCache = new MongoCache({
  connection_string: `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}/?compressors=zlib&retryReads=true&retryWrites=true&maxPoolSize=200&authSource=${process.env.MONGO_AUTH_DB}&replicaSet=${process.env.MONGO_REPSET}`,
  //connection_string: `mongodb://mongo-arena-internal.datastore.svc.cluster.local:27020?replicaSet=rs4&ssl=false&compressors=snappy&retryReads=true&retryWrites=true`,
  db_name: process.env.MONGO_DB
  //db_name: `arena_${NAME_SPACE}`
})

function status(){
  let status = swgohCache.status()
  if(status) return arenaCache.status()
}
export { arenaCache, swgohCache }
export default { status }
