import { ReservationAudit } from '../models/index.js';

export const mockReservationAudit = async () => {
  // 假设 Reservation 1 是 pending, Reservation 2 是 approved
  // 假设 Admin 1 (id: 1) 是系统管理员

  const data = [
    {
      reservation_id: 2, // 对应那个 approved 的预约
      admin_id: 1,       // 由管理员1审核
      action: 'approve',
      reason: '符合申请条件，予以批准'
    }
  ];

  await ReservationAudit.bulkCreate(data);
  console.log('ReservationAudit mock data created');
};
