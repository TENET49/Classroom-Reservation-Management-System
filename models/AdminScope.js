import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const AdminScope = sequelize.define('AdminScope', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  scope_type: {
    type: DataTypes.ENUM('building', 'room_type'),
    allowNull: false
  },
  scope_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  underscored: true,
  timestamps: false
});

export default AdminScope;
