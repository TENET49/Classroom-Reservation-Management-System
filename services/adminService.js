import { Admin, AdminScope, User, Building, RoomType } from '../models/index.js';

class AdminService {
  /**
   * 注册管理员并分配权限范围
   * @param {number} userId - 关联的用户ID
   * @param {Array} scopes - 权限范围数组 [{ type: 'building', id: 1 }, ...]
   */
  async createAdmin(userId, scopes) {
    const admin = await Admin.create({ user_id: userId });

    if (scopes && scopes.length > 0) {
      const scopeRecords = scopes.map(s => ({
        admin_id: admin.id,
        scope_type: s.type,
        scope_id: s.id
      }));
      await AdminScope.bulkCreate(scopeRecords);
    }

    return admin;
  }

  /**
   * 获取管理员详情及其管辖范围
   */
  async getAdminDetails(adminId) {
    return await Admin.findByPk(adminId, {
      include: [
        { model: User },
        { model: AdminScope }
      ]
    });
  }

  // 资源管理与审核逻辑已分别委托给 roomService 和 reservationService
  // 这里可以作为统一入口，或者前端直接调用各 Service
}

export default new AdminService();
