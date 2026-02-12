
import sequelize from '../models/db.js';
import { User } from '../models/index.js';

async function checkUser() {
  try {
    const email = 'student1@test.com';
    const user = await User.findOne({ where: { email } });
    if (user) {
      console.log('User found:', user.toJSON());
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkUser();
