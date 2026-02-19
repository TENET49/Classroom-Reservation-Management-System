import { User, Admin, AdminScope } from '../models/index.js';

export const mockUser = async () => {
  const users = [
    { name: '张三', email: 'student1@test.com', password_hash: '123456', role: 'student' },
    { name: '李四', email: 'student2@test.com', password_hash: '123456', role: 'student' },
    { name: '王老师', email: 'teacher1@test.com', password_hash: '123456', role: 'teacher' },
    { name: '赵老师', email: 'teacher2@test.com', password_hash: '123456', role: 'teacher' },
    { name: '系统管理员', email: 'admin@test.com', password_hash: '123456', role: 'admin' },
    { name: '楼栋管理员', email: 'building_admin@test.com', password_hash: '123456', role: 'admin' }
  ];

  const createdUsers = await User.bulkCreate(users);

  // 创建管理员详情
  // 假设 createdUsers[4] 是系统管理员，createdUsers[5] 是楼栋管理员
  const sysAdmin = await Admin.create({ user_id: createdUsers[4].id, is_system: true });
  const buildAdmin = await Admin.create({ user_id: createdUsers[5].id });

  // 分配权限范围
  // 楼栋管理员管理 1号楼 (id: 1)
  await AdminScope.create({
    admin_id: buildAdmin.id,
    scope_type: 'building',
    scope_id: 1
  });

  console.log('User & Admin mock data created');
};
