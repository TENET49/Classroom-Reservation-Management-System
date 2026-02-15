import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  underscored: true,
  timestamps: false
});

export default Admin;
