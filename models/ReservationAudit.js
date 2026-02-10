import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const ReservationAudit = sequelize.define('ReservationAudit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  action: {
    type: DataTypes.ENUM('approve', 'reject'),
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING
  }
}, {
  underscored: true,
  timestamps: true
});

export default ReservationAudit;
