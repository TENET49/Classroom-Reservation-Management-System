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
