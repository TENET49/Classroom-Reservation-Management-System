import { Course } from '../models/index.js';

export const mockCourse = async () => {
  // Room: 1-25 (based on mockRoom.js)
  // Teacher: 3 (王老师), 4 (赵老师)
  // TimeSlot: 1-5
  // Date: 2023-10-30 (周一), 2023-10-31 (周二)
  
  const data = [
    // --- 2023-10-30 (周一) 课程 ---
    // 101教室 - 全天满课
    { room_id: 1, teacher_id: 3, date: '2023-10-30', time_slot_id: 1, course_name: '高等数学A' },
    { room_id: 1, teacher_id: 3, date: '2023-10-30', time_slot_id: 2, course_name: '高等数学A' },
    { room_id: 1, teacher_id: 4, date: '2023-10-30', time_slot_id: 3, course_name: '大学英语' },
    { room_id: 1, teacher_id: 4, date: '2023-10-30', time_slot_id: 4, course_name: '大学英语' },

    // 201 多媒体 - 上午有课
    { room_id: 6, teacher_id: 3, date: '2023-10-30', time_slot_id: 1, course_name: '线性代数' },
    { room_id: 6, teacher_id: 3, date: '2023-10-30', time_slot_id: 2, course_name: '线性代数' },

    // 2-201 机房 - 下午有实验课
    { room_id: 13, teacher_id: 4, date: '2023-10-30', time_slot_id: 3, course_name: 'C语言程序设计' },
    { room_id: 13, teacher_id: 4, date: '2023-10-30', time_slot_id: 4, course_name: 'C语言程序设计' },

    // L-101 阶梯教室 - 晚上有讲座
    { room_id: 23, teacher_id: 3, date: '2023-10-30', time_slot_id: 5, course_name: '新生入学教育' },

    // --- 2023-10-31 (周二) 课程 ---
    // 102教室
    { room_id: 2, teacher_id: 4, date: '2023-10-31', time_slot_id: 1, course_name: '马克思主义原理' },
    { room_id: 2, teacher_id: 4, date: '2023-10-31', time_slot_id: 2, course_name: '马克思主义原理' },
    
    // 202 多媒体
    { room_id: 7, teacher_id: 3, date: '2023-10-31', time_slot_id: 3, course_name: '概率论与数理统计' },
    { room_id: 7, teacher_id: 3, date: '2023-10-31', time_slot_id: 4, course_name: '概率论与数理统计' },
    
    // 2-301 实验室 - 全天实验
    { room_id: 16, teacher_id: 4, date: '2023-10-31', time_slot_id: 1, course_name: '大学物理实验' },
    { room_id: 16, teacher_id: 4, date: '2023-10-31', time_slot_id: 2, course_name: '大学物理实验' },
    { room_id: 16, teacher_id: 4, date: '2023-10-31', time_slot_id: 3, course_name: '大学物理实验' },
    { room_id: 16, teacher_id: 4, date: '2023-10-31', time_slot_id: 4, course_name: '大学物理实验' },
  ];

  await Course.bulkCreate(data);
  console.log('Course mock data created (Total: ' + data.length + ')');
};
