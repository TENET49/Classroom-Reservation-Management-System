<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>个人信息</span>
          <div class="header-actions">
            <el-button :loading="authStore.isLoading" @click="refresh">刷新</el-button>
            <el-button type="danger" @click="logout">退出登录</el-button>
          </div>
        </div>
      </template>

      <template v-if="!user">
        <el-empty description="未登录" />
      </template>

      <template v-else>
        <el-row :gutter="16">
          <el-col :xs="24" :md="14">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="姓名">{{ user.name }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ user.email }}</el-descriptions-item>
              <el-descriptions-item label="角色">{{ roleText(user.role) }}</el-descriptions-item>
              <el-descriptions-item label="用户ID">{{ user.id }}</el-descriptions-item>
            </el-descriptions>
          </el-col>

          <el-col :xs="24" :md="10">
            <el-card shadow="never" class="side-card">
              <template #header>
                <div class="side-header">我的预约概览</div>
              </template>

              <div class="stats">
                <div class="stat">
                  <div class="stat-value">{{ stats.pending }}</div>
                  <div class="stat-label">待审核</div>
                </div>
                <div class="stat">
                  <div class="stat-value">{{ stats.approved }}</div>
                  <div class="stat-label">已通过</div>
                </div>
                <div class="stat">
                  <div class="stat-value">{{ stats.rejected }}</div>
                  <div class="stat-label">已驳回</div>
                </div>
                <div class="stat">
                  <div class="stat-value">{{ stats.cancelled }}</div>
                  <div class="stat-label">已取消</div>
                </div>
              </div>

              <el-divider />

              <div class="side-actions">
                <el-button type="primary" @click="goCreate">发起预约</el-button>
                <el-button @click="goMyReservations">查看我的预约</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/useAuthStore'
import reservationService from '@/service/reservationService'

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const stats = ref({
  pending: 0,
  approved: 0,
  rejected: 0,
  cancelled: 0,
})

function roleText(role) {
  if (role === 'admin') return '管理员'
  if (role === 'teacher') return '教师'
  if (role === 'student') return '学生'
  return role || '—'
}

async function refresh() {
  await authStore.whoAmI()
}

function logout() {
  authStore.logout()
  router.push('/login')
}

function goCreate() {
  router.push('/reservation/create')
}

function goMyReservations() {
  router.push('/my-reservation')
}

async function loadStats() {
  if (!user.value?.id) {
    stats.value = { pending: 0, approved: 0, rejected: 0, cancelled: 0 }
    return
  }
  try {
    const resp = await reservationService.getMyReservations({ userId: user.value.id })
    const list = resp?.code === 0 ? resp?.data || [] : []
    const count = { pending: 0, approved: 0, rejected: 0, cancelled: 0 }
    for (const r of list) {
      if (r?.status && count[r.status] !== undefined) count[r.status] += 1
    }
    stats.value = count
  } catch (e) {
    stats.value = { pending: 0, approved: 0, rejected: 0, cancelled: 0 }
  }
}

watch(
  () => user.value?.id,
  () => {
    loadStats()
  }
)

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.page {
  padding: 20px;
}

.card {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.side-card {
  height: 100%;
}

.side-header {
  font-weight: 600;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  margin-top: 6px;
  color: #606266;
}

.side-actions {
  display: flex;
  gap: 10px;
}
</style>

