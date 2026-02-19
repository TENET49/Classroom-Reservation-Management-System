import { Admin, AdminScope, User } from '../models/index.js';

class UserService {
  /**
   * 创建用户 (注册)
   * @param {Object} userData - 用户数据
   * @returns {Promise<User>}
   */
  async createUser(userData) {
    try {
      // 检查邮箱是否存在
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (existingUser) {
        throw new Error('邮箱已被注册');
      }
      
      // 映射 password 到 password_hash (如果传入的是 password)
      const dataToCreate = { ...userData };
      if (userData.password && !userData.password_hash) {
        dataToCreate.password_hash = userData.password;
        delete dataToCreate.password;
      }

      const user = await User.create(dataToCreate);
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 用户登录验证
   * @param {string} loginInput - 邮箱或用户名
   * @param {string} password 
   * @returns {Promise<User>}
   */
  async login(loginInput, password) {
    // 尝试用邮箱查找
    let user = await User.findOne({ where: { email: loginInput } });
    
    // 如果邮箱没找到，尝试用用户名查找
    if (!user) {
      user = await User.findOne({ where: { name: loginInput } });
    }

    if (!user) {
      throw new Error('用户不存在');
    }
    // TODO: 实际生产环境应使用 bcrypt 验证哈希密码
    if (user.password_hash !== password) {
      throw new Error('密码错误');
    }
    return user;
  }

  /**
   * 获取用户信息
   * @param {number} id 
   * @returns {Promise<User>}
   */
  async getUserById(id) {
    return await User.findByPk(id, {
      include: [
        {
          model: Admin,
          include: [
            {
              model: AdminScope,
              required: false
            }
          ],
          required: false
        }
      ]
    });
  }
}

export default new UserService();
