import { sequelize } from './index.js';

// Sync all models
sequelize.sync({ alter: true }).then(() => {
  console.log('数据库同步完成');
}).catch((err) => {
  console.error('数据库同步失败:', err);
});
