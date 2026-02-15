<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>系统日志</span>
          <div class="header-actions">
            <el-button :loading="isLoading" @click="refresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="16" class="filters">
        <el-col :xs="24" :sm="12" :md="6">
          <el-select v-model="filters.actionType" clearable placeholder="全部动作" style="width: 100%">
            <el-option label="预约提交" value="reservation.create" />
            <el-option label="预约取消" value="reservation.cancel" />
            <el-option label="审核通过" value="reservation.audit.approve" />
            <el-option label="审核驳回" value="reservation.audit.reject" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="10">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-col>
        <el-col :xs="24" :sm="24" :md="8">
          <el-input v-model="filters.keyword" clearable placeholder="搜索：动作/目标类型" />
        </el-col>
      </el-row>

      <el-table
        v-loading="isLoading"
        :data="list"
        stripe
        style="width: 100%"
        :height="560"
        table-layout="auto"
        scrollbar-always-on
      >
        <el-table-column label="时间" width="170">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.createdAt || row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作者" width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-name">{{ row?.User?.name || '—' }}</div>
              <div class="user-sub">{{ row?.User?.email || '—' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="动作" width="140">
          <template #default="{ row }">
            <el-tag :type="actionTagType(row.action)" effect="plain">{{ actionText(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标" min-width="260">
          <template #default="{ row }">
            <template v-if="row.target_type === 'Reservation' && row.reservation">
              <div class="target-main">
                <span class="target-strong">{{ row.reservation?.Room?.room_number || '—' }}</span>
                <span class="muted">｜</span>
                <span>{{ row.reservation?.date || '—' }}</span>
                <span class="muted">｜</span>
                <span>{{ formatTimeSlot(row.reservation) }}</span>
              </div>
              <div class="target-sub">
                <span>{{ row.reservation?.User?.name || '—' }}</span>
                <span class="muted">（{{ row.reservation?.User?.email || '—' }}）</span>
                <span class="muted">｜</span>
                <span>{{ statusText(row.reservation?.status) }}</span>
                <span class="muted">｜</span>
                <span>ID {{ row.reservation?.id }}</span>
              </div>
            </template>
            <template v-else>
              <span>{{ row.target_type || '—' }}</span>
              <span class="muted">｜</span>
              <span>{{ row.target_id ?? '—' }}</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!isLoading && list.length === 0" description="暂无日志" />

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          background
          layout="total, prev, pager, next, sizes"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="refresh"
          @size-change="refresh"
        />
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" size="40%" :title="drawerTitle">
      <template v-if="detailRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="时间">{{
            formatDateTime(detailRow.createdAt || detailRow.created_at)
          }}</el-descriptions-item>
          <el-descriptions-item label="操作者">
            {{ detailRow?.User?.name || '—' }}（{{ detailRow?.User?.email || '—' }}）
          </el-descriptions-item>
          <el-descriptions-item label="动作">{{ actionText(detailRow.action) }}</el-descriptions-item>
          <el-descriptions-item label="目标类型">{{ detailRow.target_type || '—' }}</el-descriptions-item>
          <el-descriptions-item label="目标ID">{{ detailRow.target_id ?? '—' }}</el-descriptions-item>
        </el-descriptions>

        <template v-if="detailRow.target_type === 'Reservation' && detailRow.reservation">
          <div class="drawer-section">预约详情</div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="教室">{{
              detailRow.reservation?.Room?.room_number || '—'
            }}</el-descriptions-item>
            <el-descriptions-item label="楼栋">{{
              detailRow.reservation?.Room?.Building?.name || '—'
            }}</el-descriptions-item>
            <el-descriptions-item label="类型">{{
              detailRow.reservation?.Room?.RoomType?.name || '—'
            }}</el-descriptions-item>
            <el-descriptions-item label="日期">{{ detailRow.reservation?.date || '—' }}</el-descriptions-item>
            <el-descriptions-item label="节次">{{ formatTimeSlot(detailRow.reservation) }}</el-descriptions-item>
            <el-descriptions-item label="人数">{{ detailRow.reservation?.people_count ?? '—' }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ statusText(detailRow.reservation?.status) }}</el-descriptions-item>
            <el-descriptions-item label="申请人">
              {{ detailRow.reservation?.User?.name || '—' }}（{{ detailRow.reservation?.User?.email || '—' }}）
            </el-descriptions-item>
          </el-descriptions>
        </template>
        <template v-else-if="detailRow.target_type === 'Reservation' && detailRow.target_id">
          <div class="drawer-tip">预约ID：{{ detailRow.target_id }}（详情已被删除或无权限）</div>
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
import dayjs from 'dayjs'
import adminService from '@/service/adminService'

const isLoading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filters = ref({
  actionType: null,
  dateRange: null,
  keyword: '',
})

function formatDateTime(v) {
  if (!v) return ''
  return dayjs(v).format('YYYY-MM-DD HH:mm')
}

function formatTimeSlot(reservation) {
  const ts = reservation?.TimeSlot
  if (!ts) return reservation?.time_slot_id ? `节次${reservation.time_slot_id}` : '—'
  const s = ts.start_time || ''
  const e = ts.end_time || ''
  if (!s && !e) return reservation?.time_slot_id ? `节次${reservation.time_slot_id}` : '—'
  return `${s} - ${e}`
}

function statusText(v) {
  if (v === 'pending') return '待审核'
  if (v === 'approved') return '已通过'
  if (v === 'rejected') return '已驳回'
  if (v === 'cancelled') return '已取消'
  return v || '—'
}

function actionText(action) {
  if (action === 'reservation.create') return '预约提交'
  if (action === 'reservation.cancel') return '预约取消'
  if (action === 'reservation.audit.approve') return '审核通过'
  if (action === 'reservation.audit.reject') return '审核驳回'
  return action || '—'
}

function actionTagType(action) {
  if (action === 'reservation.audit.approve') return 'success'
  if (action === 'reservation.audit.reject') return 'danger'
  if (action === 'reservation.create') return 'primary'
  if (action === 'reservation.cancel') return 'info'
  return 'info'
}

async function refresh() {
  isLoading.value = true
  try {
    const range = Array.isArray(filters.value.dateRange) ? filters.value.dateRange : null
    const startDate = range && range[0] ? range[0] : undefined
    const endDate = range && range[1] ? range[1] : undefined
    const resp = await adminService.getSystemLogs({
      page: page.value,
      pageSize: pageSize.value,
      action: filters.value.actionType || undefined,
      startDate,
      endDate,
      keyword: filters.value.keyword || undefined,
    })
    if (resp?.code === 0) {
      list.value = resp?.data?.list || []
      total.value = resp?.data?.total || 0
    } else {
      list.value = []
      total.value = 0
    }
  } catch (e) {
    list.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

const detailVisible = ref(false)
const detailRow = ref(null)
const drawerTitle = computed(() => {
  if (!detailRow.value) return '日志详情'
  return `日志详情 - ${actionText(detailRow.value.action)}`
})

function openDetail(row) {
  detailRow.value = row
  detailVisible.value = true
}

watch(
  () => [filters.value.actionType, filters.value.dateRange, filters.value.keyword],
  () => {
    page.value = 1
    refresh()
  },
)

onMounted(() => {
  refresh()
})
</script>

<style scoped>
.page {
  padding: 20px;
}

.card {
  max-width: 1400px;
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

.user-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-weight: 600;
}

.user-sub {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}

.muted {
  color: #909399;
}

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.target-main {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.target-strong {
  font-weight: 600;
}

.target-sub {
  margin-top: 6px;
  color: #606266;
  font-size: 12px;
}

.drawer-tip {
  margin-top: 12px;
  color: #606266;
}

.drawer-section {
  margin: 16px 0 8px;
  font-weight: 600;
}
</style>
