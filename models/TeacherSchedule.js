import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const TeacherSchedule = sequelize.define('TeacherSchedule', {
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

export default TeacherSchedule;
