import userService from '../services/userService.js'
import sequelize from '../models/db.js'

async function main() {
  const user = await userService.login('student1@test.com', '123456')
  console.log('login ok:', user.id)
  await sequelize.close()
}

main().catch(async (e) => {
  console.error(e)
  try {
    await sequelize.close()
  } catch {}
  process.exit(1)
})

