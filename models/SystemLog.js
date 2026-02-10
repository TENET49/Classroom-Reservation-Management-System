import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const SystemLog = sequelize.define('SystemLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  target_type: {
    type: DataTypes.STRING
  },
  target_id: {
    type: DataTypes.INTEGER
  }
}, {
  underscored: true,
  timestamps: true
});

export default SystemLog;
