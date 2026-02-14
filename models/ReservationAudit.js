import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const ReservationAudit = sequelize.define('ReservationAudit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reservation_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false
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
