<template>
  <div class="header-content">
    <div class="left-panel">
      <el-page-header :icon="null">
        <template #title>
          <span class="home-link" @click="goHome">首页</span>
        </template>
        <template v-if="showPageTitle" #content>
          <span class="page-title">{{ pageTitle }}</span>
        </template>
      </el-page-header>
    </div>

    <div class="right-panel">
      <span v-if="isLoading">Loading...</span>
      <template v-else-if="user">
        <span class="current-time">{{ currentTime }}</span>
        <span class="user-name">{{ welcomeMessage }}</span>
        <el-button type="info" round @click="handleLogout">注销</el-button>
      </template>
      <template v-else>
        <router-link to="/login">去登录</router-link>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'

const authStore = useAuthStore()
// 注意：我们在 useAuthStore 中把 data 重命名为了 user
const { user, isLoading } = storeToRefs(authStore)
const router = useRouter()
const route = useRoute()

const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
let timer = null

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// 计算欢迎语
const welcomeMessage = computed(() => {
  if (!user.value) return ''

  const role = user.value.role
  const name = user.value.name

  if (role === 'admin') {
    return `欢迎，${name}（管理员）`
  } else if (role === 'teacher') {
    return `欢迎，${name}老师`
  } else {
    return `欢迎，${name}同学`
  }
})

const pageTitle = computed(() => {
  const metaTitle = route.meta?.title
  if (typeof metaTitle === 'string') return metaTitle

  const map = {
    '/search': '查询可用教室',
    '/reservation/create': '发起预约申请',
    '/my-reservation': '我的预约记录',
    '/notifications': '通知中心',
    '/admin/audit': '预约审核',
    '/admin/occupancy': '占用状态总览',
    '/admin/maintenance': '教室状态维护',
    '/admin/statistics': '使用率统计',
  }
  return map[route.path] || ''
})

const showPageTitle = computed(() => !['/', '/index'].includes(route.path) && !!pageTitle.value)

const goHome = () => {
  router.push('/')
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}
.right-panel {
  display: flex;
  align-items: center;
}
.home-link {
  cursor: pointer;
  font-weight: bold;
}
.home-link:hover {
  color: #409eff;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
}
.current-time {
  margin-right: 15px;
  color: #606266;
  font-weight: normal;
}
.user-name {
  margin-right: 15px;
  font-weight: normal;
}
</style>
