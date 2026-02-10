import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  course_name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  underscored: true,
  timestamps: true,
  paranoid: true
});

export default Course;
