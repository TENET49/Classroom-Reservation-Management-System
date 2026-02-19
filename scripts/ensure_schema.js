import { ensureSchema } from '../models/ensureSchema.js'
import sequelize from '../models/db.js'

async function main() {
  await ensureSchema()
  console.log('schema ok')
  await sequelize.close()
}

main().catch(async (e) => {
  console.error(e)
  try {
    await sequelize.close()
  } catch {}
  process.exit(1)
})

