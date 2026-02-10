<template>
  <div class="home-container">
    <h1>首页</h1>
    <div v-if="authStore.user">
      <p>欢迎回来，{{ authStore.user.name }}！</p>
      <button @click="handleLogout">退出登录</button>
      <button @click="router.push('/protect')">去受保护页面</button>
    </div>
    <div v-else>
      <p>您尚未登录</p>
      <button @click="router.push('/login')">去登录</button>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  // 退出后刷新或停留在当前页
  router.push('/login')
}
</script>

<style scoped>
.home-container {
  padding: 20px;
}
button {
  margin: 5px;
}
</style>
