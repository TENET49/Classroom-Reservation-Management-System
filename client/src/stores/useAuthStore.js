import authService from '@/service/authService'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoading = ref(false)

  // 登录
  async function login({ email, password }) {
    isLoading.value = true
    try {
      // 我们的 request.js 拦截器已经解包了 response.data
      // 所以 resp 结构应该是 { code: 0, msg: "", data: { token: "...", user: {...} } }
      const resp = await authService.login({ email, password })
      if (resp.code === 0) {
        user.value = resp.data.user
        // Token 已经在 request.js 的响应拦截器中自动存入 localStorage
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 退出登录
  function logout() {
    user.value = null
    localStorage.removeItem('token')
    // 可以选择跳转到登录页，或者由组件层处理
  }

  // 获取当前用户信息 (WhoAmI)
  async function whoAmI() {
    // 如果本地没有 token，直接视为未登录，不发请求节省资源
    if (!localStorage.getItem('token')) {
      user.value = null
      return
    }

    isLoading.value = true
    try {
      const resp = await authService.whoami()
      if (resp.code === 0) {
        user.value = resp.data
      } else {
        user.value = null
        // Token 可能过期或无效，清理掉
        localStorage.removeItem('token')
      }
    } catch (error) {
      user.value = null
      localStorage.removeItem('token')
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    isLoading,
    login,
    logout,
    whoAmI
  }
})
