import { Room } from '../models/index.js';

export const mockRoom = async () => {
  // 假设 Building ID 1-4, RoomType ID 1-5 已存在
  // Building: 1:1号教学楼, 2:2号实验楼, 3:图书馆, 4:艺术楼
  // RoomType: 1:普通教室, 2:多媒体教室, 3:机房, 4:实验室, 5:阶梯教室
  
  const data = [
    // --- 1号教学楼 (共12间) ---
    // 1层: 普通教室
    { room_number: '1-101', capacity: 50, equipment: '黑板, 风扇', building_id: 1, room_type_id: 1, is_active: true },
    { room_number: '1-102', capacity: 50, equipment: '黑板, 风扇', building_id: 1, room_type_id: 1, is_active: true },
    { room_number: '1-103', capacity: 50, equipment: '黑板, 风扇', building_id: 1, room_type_id: 1, is_active: true },
    { room_number: '1-104', capacity: 50, equipment: '黑板, 风扇', building_id: 1, room_type_id: 1, is_active: true },
    { room_number: '1-105', capacity: 60, equipment: '黑板, 空调', building_id: 1, room_type_id: 1, is_active: true },
    // 2层: 多媒体教室
    { room_number: '1-201', capacity: 80, equipment: '投影仪, 电脑, 音响', building_id: 1, room_type_id: 2, is_active: true },
    { room_number: '1-202', capacity: 80, equipment: '投影仪, 电脑, 音响', building_id: 1, room_type_id: 2, is_active: true },
    { room_number: '1-203', capacity: 80, equipment: '投影仪, 电脑, 音响', building_id: 1, room_type_id: 2, is_active: true },
    { room_number: '1-204', capacity: 80, equipment: '投影仪, 电脑, 音响', building_id: 1, room_type_id: 2, is_active: true },
    { room_number: '1-205', capacity: 100, equipment: '双投影, 电脑, 环绕音响', building_id: 1, room_type_id: 2, is_active: true },
    // 3层: 混合
    { room_number: '1-301', capacity: 50, equipment: '黑板', building_id: 1, room_type_id: 1, is_active: true },
    { room_number: '1-302', capacity: 120, equipment: '投影仪, 阶梯座位', building_id: 1, room_type_id: 5, is_active: true },

    // --- 2号实验楼 (共8间) ---
    // 机房
    { room_number: '2-201', capacity: 40, equipment: 'i5电脑40台', building_id: 2, room_type_id: 3, is_active: true },
    { room_number: '2-202', capacity: 40, equipment: 'i7电脑40台, GPU工作站', building_id: 2, room_type_id: 3, is_active: true },
    { room_number: '2-203', capacity: 60, equipment: 'i5电脑60台', building_id: 2, room_type_id: 3, is_active: true },
    // 实验室
    { room_number: '2-301', capacity: 30, equipment: '物理实验器材', building_id: 2, room_type_id: 4, is_active: true },
    { room_number: '2-302', capacity: 30, equipment: '化学实验台, 通风橱', building_id: 2, room_type_id: 4, is_active: true },
    { room_number: '2-303', capacity: 30, equipment: '显微镜, 生物标本', building_id: 2, room_type_id: 4, is_active: true },
    // 维修中
    { room_number: '2-401', capacity: 50, equipment: '旧设备', building_id: 2, room_type_id: 1, is_active: false }, // 永久停用或长期维修

    // --- 图书馆 (共3间) ---
    { room_number: '3-L101', capacity: 200, equipment: '专业音响, 大屏LED', building_id: 3, room_type_id: 5, is_active: true },
    { room_number: '3-L201', capacity: 20, equipment: '圆桌, 白板', building_id: 3, room_type_id: 1, is_active: true }, // 研讨室归为普通教室或新增类型
    { room_number: '3-L301', capacity: 300, equipment: '报告厅级配置', building_id: 3, room_type_id: 5, is_active: true },

    // --- 艺术楼 (共2间) ---
    { room_number: '4-A101', capacity: 40, equipment: '钢琴, 镜子', building_id: 4, room_type_id: 1, is_active: true },
    { room_number: '4-A102', capacity: 40, equipment: '画架, 模特台', building_id: 4, room_type_id: 1, is_active: true }
  ];

  await Room.bulkCreate(data);
  console.log('Room mock data created (Total: ' + data.length + ')');
};
