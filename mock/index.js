import { sequelize } from '../models/index.js';
import { mockBuilding } from './mockBuilding.js';
import { mockRoomType } from './mockRoomType.js';
import { mockRoom } from './mockRoom.js';
import { mockUser } from './mockUser.js';
import { mockTimeSlot } from './mockTimeSlot.js';
import { mockCourse } from './mockCourse.js';
import { mockReservation } from './mockReservation.js';
import { mockReservationAudit } from './mockReservationAudit.js';
import { mockRoomUnavailable } from './mockRoomUnavailable.js';
import { mockTeacherSchedule } from './mockTeacherSchedule.js';

const runMock = async () => {
  try {
    // 强制同步数据库 (会清空现有数据!)
    await sequelize.sync({ force: true });
    console.log('Database synced (force: true)');

    // 按依赖顺序执行
    await mockBuilding();
    await mockRoomType();
    await mockRoom();
    await mockUser(); // 会同时创建 Admin 和 AdminScope
    await mockTimeSlot();
    await mockCourse();
    await mockReservation();
    await mockReservationAudit();
    await mockRoomUnavailable();
    await mockTeacherSchedule();

    console.log('All mock data created successfully!');
  } catch (error) {
    console.error('Mock data creation failed:', error);
  } finally {
    await sequelize.close();
  }
};

runMock();
