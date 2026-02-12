<template>
  <div class="header-content">
    <div class="left-panel">
      <el-page-header :icon="null">
        <template #title>
          <span class="home-link" @click="goHome">首页</span>
        </template>
        <template #content>
          <span class="text-large font-600 mr-3"> 教室预约 </span>
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
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

const authStore = useAuthStore()
// 注意：我们在 useAuthStore 中把 data 重命名为了 user
const { user, isLoading } = storeToRefs(authStore)
const router = useRouter()

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
    // 这里假设管理员有更细分的职位，如果目前只有一个 admin 角色，暂时统称管理员
    // 如果后续 user 对象里有 position 字段，可以改成 user.value.position
    return `欢迎，${name}（管理员）`
  } else if (role === 'teacher') {
    return `欢迎，${name}老师`
  } else {
    // 默认为学生
    return `欢迎，${name}同学`
  }
})

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
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center;
  height: 100%;
  padding: 0 20px; /* 增加左侧 padding */
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
  color: #409eff; /* Element Plus 默认蓝色 */
}
.current-time {
  margin-right: 15px;
  color: #606266;
  font-weight: normal;
}
.user-name {
  margin-right: 15px;
  font-weight: bold;
}
</style>
