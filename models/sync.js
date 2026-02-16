import { sequelize } from './index.js';

const mode = String(process.env.DB_SYNC_MODE || '').toLowerCase()
const options = mode === 'force' ? { force: true } : mode === 'alter' ? { alter: true } : {}

sequelize
  .sync(options)
  .then(() => {
    console.log('数据库同步完成');
  })
  .catch((err) => {
    console.error('数据库同步失败:', err);
  });
