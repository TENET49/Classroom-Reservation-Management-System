import { RoomUnavailable } from '../models/index.js';

export const mockRoomUnavailable = async () => {
  // 假设 Room 1 (101) 
  // 假设 TimeSlot 2 (3-4节)
  
  const data = [
    {
      room_id: 1,
      date: '2023-11-01',
      time_slot_id: 2, // 第3-4节维修
      reason: '投影仪灯泡更换'
    },
    {
      room_id: 3, // 201 多媒体教室
      date: '2023-11-02',
      time_slot_id: null, // 整天不可用
      reason: '全楼停电检修'
    }
  ];

  await RoomUnavailable.bulkCreate(data);
  console.log('RoomUnavailable mock data created');
};
