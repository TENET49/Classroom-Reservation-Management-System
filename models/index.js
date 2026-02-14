import User from './User.js';
import Admin from './Admin.js';
import AdminScope from './AdminScope.js';
import Building from './Building.js';
import RoomType from './RoomType.js';
import Room from './Room.js';
import TimeSlot from './TimeSlot.js';
import Course from './Course.js';
import TeacherSchedule from './TeacherSchedule.js';
import Reservation from './Reservation.js';
import ReservationAudit from './ReservationAudit.js';
import RoomUnavailable from './RoomUnavailable.js';
import SystemLog from './SystemLog.js';
import sequelize from './db.js';

// 1. User - Admin (One-to-One)
User.hasOne(Admin, { foreignKey: 'user_id' });
Admin.belongsTo(User, { foreignKey: 'user_id' });

// 2. Admin - AdminScope (One-to-Many)
Admin.hasMany(AdminScope, { foreignKey: 'admin_id' });
AdminScope.belongsTo(Admin, { foreignKey: 'admin_id' });

// 3. Building - Room (One-to-Many)
Building.hasMany(Room, { foreignKey: 'building_id' });
Room.belongsTo(Building, { foreignKey: 'building_id' });

// 4. RoomType - Room (One-to-Many)
RoomType.hasMany(Room, { foreignKey: 'room_type_id' });
Room.belongsTo(RoomType, { foreignKey: 'room_type_id' });

// 5. Room - Course (One-to-Many)
Room.hasMany(Course, { foreignKey: 'room_id' });
Course.belongsTo(Room, { foreignKey: 'room_id' });

// 6. User (Teacher) - Course (One-to-Many)
User.hasMany(Course, { foreignKey: 'teacher_id' });
Course.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// 7. TimeSlot - Course (One-to-Many)
TimeSlot.hasMany(Course, { foreignKey: 'time_slot_id' });
Course.belongsTo(TimeSlot, { foreignKey: 'time_slot_id' });

// 8. User (Teacher) - TeacherSchedule (One-to-Many)
User.hasMany(TeacherSchedule, { foreignKey: 'teacher_id' });
TeacherSchedule.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// 9. TimeSlot - TeacherSchedule (One-to-Many)
TimeSlot.hasMany(TeacherSchedule, { foreignKey: 'time_slot_id' });
TeacherSchedule.belongsTo(TimeSlot, { foreignKey: 'time_slot_id' });

// 10. User - Reservation (One-to-Many)
User.hasMany(Reservation, { foreignKey: 'user_id' });
Reservation.belongsTo(User, { foreignKey: 'user_id' });

// 11. Room - Reservation (One-to-Many)
Room.hasMany(Reservation, { foreignKey: 'room_id' });
Reservation.belongsTo(Room, { foreignKey: 'room_id' });

// 12. TimeSlot - Reservation (One-to-Many)
TimeSlot.hasMany(Reservation, { foreignKey: 'time_slot_id' });
Reservation.belongsTo(TimeSlot, { foreignKey: 'time_slot_id' });

// 13. Reservation - ReservationAudit (One-to-Many)
Reservation.hasMany(ReservationAudit, { foreignKey: 'reservation_id' });
ReservationAudit.belongsTo(Reservation, { foreignKey: 'reservation_id' });

// 14. Admin - ReservationAudit (One-to-Many)
Admin.hasMany(ReservationAudit, { foreignKey: 'admin_id' });
ReservationAudit.belongsTo(Admin, { foreignKey: 'admin_id' });

// 15. Room - RoomUnavailable (One-to-Many)
Room.hasMany(RoomUnavailable, { foreignKey: 'room_id' });
RoomUnavailable.belongsTo(Room, { foreignKey: 'room_id' });

// 16. TimeSlot - RoomUnavailable (One-to-Many)
TimeSlot.hasMany(RoomUnavailable, { foreignKey: 'time_slot_id' });
RoomUnavailable.belongsTo(TimeSlot, { foreignKey: 'time_slot_id' });

// 17. User - SystemLog (One-to-Many, Optional)
User.hasMany(SystemLog, { foreignKey: 'user_id' });
SystemLog.belongsTo(User, { foreignKey: 'user_id' });

export {
  User,
  Admin,
  AdminScope,
  Building,
  RoomType,
  Room,
  TimeSlot,
  Course,
  TeacherSchedule,
  Reservation,
  ReservationAudit,
  RoomUnavailable,
  SystemLog,
  sequelize
};
