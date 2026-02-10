import { TeacherSchedule } from '../models/index.js';

export const mockTeacherSchedule = async () => {
  // Teacher: 3 (王老师), 4 (赵老师)
  // 除了 Course 表里的课（那是教室占用），老师还可能在其他地方上课（或者外聘、行政任务），
  // 这里模拟他们的个人日程，防止他们在这些时间段被预约或申请预约。

  const data = [
    // --- 王老师 (Teacher 3) ---
    // 已经在 mockCourse 中: 10-30 1-2节, 10-30 5节, 10-31 3-4节
    // 额外日程:
    { teacher_id: 3, date: '2023-10-30', time_slot_id: 3, course_name: '教研室会议' },
    { teacher_id: 3, date: '2023-11-01', time_slot_id: 1, course_name: '校外监考' },
    { teacher_id: 3, date: '2023-11-01', time_slot_id: 2, course_name: '校外监考' },

    // --- 赵老师 (Teacher 4) ---
    // 已经在 mockCourse 中: 10-30 3-4节, 10-31 1-2节, 10-31 全天实验
    // 额外日程:
    { teacher_id: 4, date: '2023-11-02', time_slot_id: 5, course_name: '晚自习辅导' }
  ];

  await TeacherSchedule.bulkCreate(data);
  console.log('TeacherSchedule mock data created (Total: ' + data.length + ')');
};
