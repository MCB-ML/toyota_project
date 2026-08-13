import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { getPool } from './db.js'
import { dbSchemaPath } from './dbSchemaDir.js'

const files = [
  '001_app_schema.sql',
  '005_dashboard_object_store.sql',
  '006_table_column_visibility.sql',
  '007_dashboard_page_owner.sql',
]

async function main() {
  const pool = getPool()
  try {
    for (const file of files) {
      const sql = readFileSync(dbSchemaPath(file), 'utf8')
      await pool.query(sql)
      console.log(`Applied ${file}.`)
    }
    console.log('App schema seed complete.')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
