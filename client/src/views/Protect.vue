<template>
  <div>
    <h1>这是一个受保护的页面</h1>
    <p>必须要登录才能访问。</p>
    <div v-if="authStore.user">
      <p>当前登录用户：{{ authStore.user.name }} ({{ authStore.user.role }})</p>
      <p>邮箱：{{ authStore.user.email }}</p>
    </div>
    <div v-else>
      <p>正在加载用户信息...</p>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/useAuthStore'
const authStore = useAuthStore()
</script>

<style scoped></style>
