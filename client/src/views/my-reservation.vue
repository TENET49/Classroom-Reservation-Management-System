<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>我的预约记录</span>
          <div class="header-actions">
            <el-button type="primary" @click="goCreate">发起预约</el-button>
            <el-button :loading="isLoading" @click="refresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="16" class="filters">
        <el-col :xs="24" :sm="12" :md="8">
          <el-select v-model="statusFilter" clearable placeholder="全部状态" style="width: 100%">
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="10">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-col>
        <el-col :xs="24" :sm="24" :md="6">
          <el-input v-model="keyword" clearable placeholder="搜索：教室/原因" />
        </el-col>
      </el-row>

      <el-table
        v-loading="isLoading"
        :data="filteredList"
        stripe
        style="width: 100%"
        :height="520"
        table-layout="auto"
        scrollbar-always-on
      >
        <el-table-column prop="date" label="日期" width="130" />
        <el-table-column label="节次" width="160">
          <template #default="{ row }">
            <span>{{ formatTimeSlot(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="Room.room_number" label="教室" width="130">
          <template #default="{ row }">
            <el-link type="primary" @click="openDetail(row)">{{ row?.Room?.room_number || '—' }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="人数" width="90">
          <template #default="{ row }">
            <span>{{ row.people_count ?? '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="plain">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最新审核意见" min-width="220">
          <template #default="{ row }">
            <template v-if="latestAudit(row)">
              <el-tag :type="latestAudit(row).action === 'approve' ? 'success' : 'danger'" effect="plain">
                {{ latestAudit(row).action === 'approve' ? '通过' : '驳回' }}
              </el-tag>
              <span class="audit-reason">{{ latestAudit(row).reason || '—' }}</span>
            </template>
            <template v-else>
              <span class="muted">—</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
              title="确认取消该预约？"
              confirm-button-text="确认"
              cancel-button-text="返回"
              @confirm="cancel(row)"
            >
              <template #reference>
                <el-button size="small" type="danger" :disabled="!canCancel(row)" :loading="cancelingId === row.id">
                  取消
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!isLoading && filteredList.length === 0" description="暂无预约记录" />
    </el-card>

    <el-drawer v-model="detailVisible" size="40%" :title="drawerTitle">
      <template v-if="detailRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="日期">{{ detailRow.date }}</el-descriptions-item>
          <el-descriptions-item label="节次">{{ formatTimeSlot(detailRow) }}</el-descriptions-item>
          <el-descriptions-item label="教室">{{ detailRow?.Room?.room_number || '—' }}</el-descriptions-item>
          <el-descriptions-item label="人数">{{ detailRow.people_count ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusText(detailRow.status) }}</el-descriptions-item>
        </el-descriptions>

        <div class="drawer-section">最新审核意见</div>
        <template v-if="latestAudit(detailRow)">
          <el-alert
            :title="latestAudit(detailRow).action === 'approve' ? '通过' : '驳回'"
            :type="latestAudit(detailRow).action === 'approve' ? 'success' : 'error'"
            show-icon
            :closable="false"
          />
          <div class="audit-detail">{{ latestAudit(detailRow).reason || '—' }}</div>
        </template>
        <template v-else>
          <el-empty description="暂无审核意见" />
        </template>
      </template>
      <template v-else>
        <el-empty description="暂无数据" />
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/useAuthStore'
import reservationService from '@/service/reservationService'

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const isLoading = ref(false)
const list = ref([])
const cancelingId = ref(null)

const statusFilter = ref(null)
const dateRange = ref(null)
const keyword = ref('')

const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已取消', value: 'cancelled' },
]

function statusText(v) {
  if (v === 'pending') return '待审核'
  if (v === 'approved') return '已通过'
  if (v === 'rejected') return '已驳回'
  if (v === 'cancelled') return '已取消'
  return v || '—'
}

function statusTagType(v) {
  if (v === 'pending') return 'warning'
  if (v === 'approved') return 'success'
  if (v === 'rejected') return 'danger'
  if (v === 'cancelled') return 'info'
  return 'info'
}

function latestAudit(row) {
  const a1 = row?.ReservationAudits
  if (Array.isArray(a1) && a1.length > 0) return a1[0]
  const a2 = row?.ReservationAudit
  if (Array.isArray(a2) && a2.length > 0) return a2[0]
  return null
}

function formatTimeSlot(row) {
  const ts = row?.TimeSlot
  if (!ts) return row?.time_slot_id ? `节次${row.time_slot_id}` : '—'
  const s = ts.start_time || ''
  const e = ts.end_time || ''
  if (!s && !e) return row?.time_slot_id ? `节次${row.time_slot_id}` : '—'
  return `${s} - ${e}`
}

const filteredList = computed(() => {
  let arr = Array.isArray(list.value) ? [...list.value] : []

  if (statusFilter.value) {
    arr = arr.filter((r) => r.status === statusFilter.value)
  }

  if (Array.isArray(dateRange.value) && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    const s = dayjs(start)
    const e = dayjs(end)
    arr = arr.filter((r) => {
      const d = dayjs(r.date)
      return d.isValid() && (d.isSame(s) || d.isAfter(s)) && (d.isSame(e) || d.isBefore(e))
    })
  }

  const kw = String(keyword.value || '')
    .trim()
    .toLowerCase()
  if (kw) {
    arr = arr.filter((r) => {
      const room = (r?.Room?.room_number || '').toLowerCase()
      const reason = (latestAudit(r)?.reason || '').toLowerCase()
      return room.includes(kw) || reason.includes(kw)
    })
  }

  return arr
})

function goCreate() {
  router.push('/reservation/create')
}

async function refresh() {
  if (!user.value?.id) return
  isLoading.value = true
  try {
    const resp = await reservationService.getMyReservations({ userId: user.value.id })
    if (resp?.code === 0) list.value = resp?.data || []
    else list.value = []
  } catch (e) {
    list.value = []
  } finally {
    isLoading.value = false
  }
}

function canCancel(row) {
  return row?.status === 'pending' || row?.status === 'approved'
}

async function cancel(row) {
  if (!row?.id || !user.value?.id) return
  if (!canCancel(row)) return
  cancelingId.value = row.id
  try {
    const resp = await reservationService.cancelReservation(row.id, { userId: user.value.id })
    if (resp?.code === 0) await refresh()
  } finally {
    cancelingId.value = null
  }
}

const detailVisible = ref(false)
const detailRow = ref(null)
const drawerTitle = computed(() => {
  if (!detailRow.value) return '预约详情'
  return `预约详情 - ${detailRow.value?.Room?.room_number || ''}`
})

function openDetail(row) {
  detailRow.value = row
  detailVisible.value = true
}

watch(
  () => user.value?.id,
  (id) => {
    if (id) refresh()
  },
  { immediate: true },
)

onMounted(() => {
  if (user.value?.id) refresh()
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

.muted {
  color: #909399;
}

.audit-reason {
  margin-left: 10px;
  color: #606266;
}

.drawer-section {
  margin: 16px 0 8px;
  font-weight: 600;
}

.audit-detail {
  margin-top: 10px;
  color: #606266;
}
</style>
