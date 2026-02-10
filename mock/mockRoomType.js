import { RoomType } from '../models/index.js';

export const mockRoomType = async () => {
  const data = [
    { name: '普通教室', description: '配备黑板、简单音响' },
    { name: '多媒体教室', description: '配备投影仪、电脑、音响系统' },
    { name: '机房', description: '配备学生电脑' },
    { name: '实验室', description: '各类专业实验设备' },
    { name: '阶梯教室', description: '大容量，适合讲座和合班课' }
  ];

  await RoomType.bulkCreate(data);
  console.log('RoomType mock data created');
};
