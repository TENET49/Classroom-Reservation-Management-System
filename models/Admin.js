import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
}, {
  underscored: true,
  timestamps: false
});

export default Admin;
