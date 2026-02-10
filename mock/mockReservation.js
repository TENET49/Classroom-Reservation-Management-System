import { Reservation } from '../models/index.js';

export const mockReservation = async () => {
  // 假设:
  // User: 1 (张三)
  // Room: 2 (102)
  // TimeSlot: 1
  
  const data = [
    {
      user_id: 1,
      room_id: 2,
      date: '2023-10-31',
      time_slot_id: 1,
      people_count: 20,
      status: 'pending'
    },
    {
      user_id: 2,
      room_id: 4,
      date: '2023-10-31',
      time_slot_id: 5,
      people_count: 5,
      status: 'approved'
    }
  ];

  await Reservation.bulkCreate(data);
  console.log('Reservation mock data created');
};
