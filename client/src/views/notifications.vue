<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>消息通知</span>
          <div class="header-actions">
            <el-button :loading="notificationStore.isLoading" @click="notificationStore.refresh">刷新</el-button>
            <el-button type="success" :disabled="notificationStore.items.length === 0" @click="markAllRead"
              >全部已读</el-button
            >
            <el-button @click="goMyReservations">查看我的预约</el-button>
          </div>
        </div>
      </template>

      <template v-if="!user">
        <el-empty description="未登录" />
      </template>

      <template v-else>
        <el-row :gutter="16" class="filters">
          <el-col :xs="24" :sm="12" :md="10">
            <el-switch v-model="onlyUnread" active-text="仅未读" />
          </el-col>
          <el-col :xs="24" :sm="12" :md="14">
            <el-input v-model="keyword" clearable placeholder="搜索：教室/原因" />
          </el-col>
        </el-row>

        <el-timeline v-loading="notificationStore.isLoading">
          <el-timeline-item v-for="item in filteredItems" :key="item.key" :timestamp="item.timeText" :type="item.type">
            <div class="item-title">
              <el-tag :type="item.tagType" effect="plain">{{ item.tagText }}</el-tag>
              <span class="item-main">{{ item.title }}</span>
            </div>
            <div class="item-sub">{{ item.subtitle }}</div>
            <div v-if="item.reason" class="item-reason">{{ item.reason }}</div>
          </el-timeline-item>
        </el-timeline>

        <el-empty v-if="!notificationStore.isLoading && filteredItems.length === 0" description="暂无通知" />
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNotificationStore } from '@/stores/useNotificationStore'

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const notificationStore = useNotificationStore()
const onlyUnread = ref(true)
const keyword = ref('')

const filteredItems = computed(() => {
  let arr = Array.isArray(notificationStore.items) ? [...notificationStore.items] : []
  if (onlyUnread.value) {
    const seen = notificationStore.lastSeenAt || 0
    arr = arr.filter((x) => (x?.time || 0) > seen)
  }
  const kw = String(keyword.value || '')
    .trim()
    .toLowerCase()
  if (kw) {
    arr = arr.filter((x) => (x.title || '').toLowerCase().includes(kw) || (x.reason || '').toLowerCase().includes(kw))
  }
  return arr
})

function goMyReservations() {
  router.push('/my-reservation')
}

function markAllRead() {
  notificationStore.markAllRead()
}

onMounted(() => {
  if (user.value?.id) notificationStore.refresh()
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

.filters {
  margin-bottom: 12px;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-main {
  font-weight: 600;
}

.item-sub {
  margin-top: 6px;
  color: #606266;
}

.item-reason {
  margin-top: 6px;
  color: #606266;
}
</style>
