import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const RoomUnavailable = sequelize.define('RoomUnavailable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING
  }
}, {
  underscored: true,
  timestamps: true,
  paranoid: true
});

export default RoomUnavailable;
