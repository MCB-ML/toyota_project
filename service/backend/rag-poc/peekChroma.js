import 'dotenv/config'
import { COLLECTIONS, getClient } from './chromaClient.js'

const collectionArg = process.argv[2] || 'all'
const limit = Number(process.argv[3]) || 5

function collectionNames() {
  if (collectionArg === 'all') return Object.values(COLLECTIONS)
  if (COLLECTIONS[collectionArg.toUpperCase()]) return [COLLECTIONS[collectionArg.toUpperCase()]]
  return [collectionArg]
}

async function main() {
  const client = getClient()

  for (const name of collectionNames()) {
    try {
      const collection = await client.getCollection({ name })
      const count = await collection.count()
      const peek = await collection.peek({ limit })
      console.log(JSON.stringify({
        collection: name,
        count,
        rows: peek.ids.map((id, index) => ({
          id,
          document: peek.documents?.[index] || null,
          metadata: peek.metadatas?.[index] || null,
        })),
      }, null, 2))
    } catch (err) {
      console.log(JSON.stringify({
        collection: name,
        status: 'missing_or_unreadable',
        message: err.message,
      }, null, 2))
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
