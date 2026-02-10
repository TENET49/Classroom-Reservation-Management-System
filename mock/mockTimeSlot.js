import { TimeSlot } from '../models/index.js';

export const mockTimeSlot = async () => {
  const data = [
    { name: '第1-2节', start_time: '08:00:00', end_time: '09:35:00' },
    { name: '第3-4节', start_time: '09:55:00', end_time: '11:30:00' },
    { name: '第5-6节', start_time: '14:00:00', end_time: '15:35:00' },
    { name: '第7-8节', start_time: '15:55:00', end_time: '17:30:00' },
    { name: '晚自习', start_time: '19:00:00', end_time: '21:00:00' }
  ];

  await TimeSlot.bulkCreate(data);
  console.log('TimeSlot mock data created');
};
