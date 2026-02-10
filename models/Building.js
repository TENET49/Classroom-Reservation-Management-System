import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const Building = sequelize.define('Building', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  underscored: true,
  timestamps: true,
  paranoid: true
});

export default Building;
