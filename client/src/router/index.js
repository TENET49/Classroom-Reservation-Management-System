// 前端路由配置文件
import { createRouter, createWebHistory } from 'vue-router'
// 页面组件
import Home from '../views/Home.vue'
import Layout from '../layout/Layout.vue'
import { useAuthStore } from '@/stores/useAuthStore'

// 该方法会创建一个路由的实例
// 在创建路由实例的时候，可以传入一个配置对象
const router = createRouter({
  history: createWebHistory(), // 指定前端路由的模式，常见的有 hash 和 history 两种模式
  // 路由和组件的映射
  routes: [
    {
      path: '/', // 路由的路径
      name: 'Home',
      component: Layout,// 路由对应的组件
      children: [
        {
          path: '/',
          name: 'Index',
          component: () => import('../views/index.vue'),
          meta: { title: '' }
        },
        {
          path: '/search',
          name: 'Search',
          component: () => import('../views/search.vue'),
          meta: { title: '查询可用教室' }
        },
        {
          path: '/profile',
          name: 'Profile',
          component: () => import('../views/profile.vue'),
          meta: { title: '个人信息' }
        },
        {
          path: '/reservation/create',
          name: 'ReservationCreate',
          component: () => import('../views/reservation-create.vue'),
          meta: { title: '发起预约申请' }
        },
        {
          path: '/my-reservation',
          name: 'MyReservation',
          component: () => import('../views/my-reservation.vue'),
          meta: { title: '我的预约记录' }
        },
        {
          path: '/notifications',
          name: 'Notifications',
          component: () => import('../views/notifications.vue'),
          meta: { title: '通知中心' }
        },
        {
          path: '/admin/audit',
          name: 'AdminAudit',
          component: () => import('../views/admin/audit.vue'),
          meta: { title: '预约审核' }
        },
        {
          path: '/admin/audit-history',
          name: 'AdminAuditHistory',
          component: () => import('../views/admin/audit-history.vue'),
          meta: { title: '历史审核记录' }
        },
        {
          path: '/admin/buildings',
          name: 'AdminBuildings',
          component: () => import('../views/admin/buildings.vue'),
          meta: { title: '楼栋管理' }
        },
        {
          path: '/admin/user-management',
          name: 'AdminUserManagement',
          component: () => import('../views/admin/user-management.vue'),
          meta: { title: '用户管理' }
        },
        {
          path: '/admin/resources',
          name: 'AdminResources',
          component: () => import('../views/admin/resources.vue'),
          meta: { title: '教室资源管理' }
        },
        {
          path: '/admin/occupancy',
          name: 'AdminOccupancy',
          component: () => import('../views/admin/occupancy.vue'),
          meta: { title: '占用状态总览' }
        },
        {
          path: '/admin/import/teacher-schedules',
          name: 'AdminImportTeacherSchedules',
          component: () => import('../views/admin/import-teacher-schedules.vue'),
          meta: { title: '导入教师占用事项' }
        },
        {
          path: '/admin/import/courses',
          name: 'AdminImportCourses',
          component: () => import('../views/admin/import-courses.vue'),
          meta: { title: '导入教室课表' }
        },
        {
          path: '/admin/maintenance',
          name: 'AdminMaintenance',
          component: () => import('../views/admin/maintenance.vue'),
          meta: { title: '教室状态维护' }
        },
        {
          path: '/admin/statistics',
          name: 'AdminStatistics',
          component: () => import('../views/admin/statistics.vue'),
          meta: { title: '使用率统计' }
        },
        { path: '/admin/export', redirect: '/admin/statistics?tab=export' },
        {
          path: '/admin/system-logs',
          name: 'AdminSystemLogs',
          component: () => import('../views/admin/system-logs.vue'),
          meta: { title: '系统日志' }
        }
      ],
      beforeEnter: async (to, from, next) => {
        const authStore = useAuthStore()
        if (authStore.user) {
          next()
          return
        }
        const token = localStorage.getItem('token')
        if (token) {
          try {
            await authStore.whoAmI()
            if (authStore.user) {
              next()
              return
            }
          } catch (e) {
            console.error(e)
          }
        }
        next('/login')
      }
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    },
  ]
})
export default router
