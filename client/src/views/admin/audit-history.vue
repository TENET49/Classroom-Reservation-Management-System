<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>历史审核记录</span>
          <div class="header-actions">
            <el-button :loading="isLoading" @click="refresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="16" class="filters">
        <el-col :xs="24" :sm="12" :md="6">
          <el-select v-model="filters.action" clearable placeholder="全部结果" style="width: 100%">
            <el-option label="通过" value="approve" />
            <el-option label="驳回" value="reject" />
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
          <el-input v-model="filters.keyword" clearable placeholder="搜索：教室/用户/邮箱/理由" />
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
        <el-table-column label="结果" width="110">
          <template #default="{ row }">
            <el-tag :type="row.action === 'approve' ? 'success' : 'danger'" effect="plain">
              {{ row.action === 'approve' ? '通过' : '驳回' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核人" width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-name">{{ row?.Admin?.User?.name || '—' }}</div>
              <div class="user-sub">{{ row?.Admin?.User?.email || '—' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="申请人" width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-name">{{ row?.Reservation?.User?.name || '—' }}</div>
              <div class="user-sub">{{ row?.Reservation?.User?.email || '—' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="教室" width="140">
          <template #default="{ row }">
            <span>{{ row?.Reservation?.Room?.room_number || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="日期/节次" min-width="220">
          <template #default="{ row }">
            <span>{{ row?.Reservation?.date || '—' }}</span>
            <span class="muted">｜</span>
            <span>{{ formatTimeSlot(row?.Reservation) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="理由" min-width="260">
          <template #default="{ row }">
            <span class="reason">{{ row.reason || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!isLoading && list.length === 0" description="暂无审核记录" />

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
          <el-descriptions-item label="审核时间">{{
            formatDateTime(detailRow.createdAt || detailRow.created_at)
          }}</el-descriptions-item>
          <el-descriptions-item label="审核结果">{{
            detailRow.action === 'approve' ? '通过' : '驳回'
          }}</el-descriptions-item>
          <el-descriptions-item label="审核理由">{{ detailRow.reason || '—' }}</el-descriptions-item>
        </el-descriptions>

        <div class="drawer-section">预约信息</div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="教室">{{
            detailRow?.Reservation?.Room?.room_number || '—'
          }}</el-descriptions-item>
          <el-descriptions-item label="楼栋">{{
            detailRow?.Reservation?.Room?.Building?.name || '—'
          }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{
            detailRow?.Reservation?.Room?.RoomType?.name || '—'
          }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ detailRow?.Reservation?.date || '—' }}</el-descriptions-item>
          <el-descriptions-item label="节次">{{ formatTimeSlot(detailRow?.Reservation) }}</el-descriptions-item>
          <el-descriptions-item label="人数">{{ detailRow?.Reservation?.people_count ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="申请人"
            >{{ detailRow?.Reservation?.User?.name || '—' }}（{{
              detailRow?.Reservation?.User?.email || '—'
            }}）</el-descriptions-item
          >
        </el-descriptions>
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
  action: null,
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

async function refresh() {
  isLoading.value = true
  try {
    const range = Array.isArray(filters.value.dateRange) ? filters.value.dateRange : null
    const startDate = range && range[0] ? range[0] : undefined
    const endDate = range && range[1] ? range[1] : undefined
    const resp = await adminService.getAuditHistory({
      page: page.value,
      pageSize: pageSize.value,
      action: filters.value.action || undefined,
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
  if (!detailRow.value) return '审核详情'
  const room = detailRow.value?.Reservation?.Room?.room_number || ''
  return `审核详情 - ${room}`
})

function openDetail(row) {
  detailRow.value = row
  detailVisible.value = true
}

watch(
  () => [filters.value.action, filters.value.dateRange, filters.value.keyword],
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

.reason {
  color: #606266;
}

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.drawer-section {
  margin: 16px 0 8px;
  font-weight: 600;
}
</style>
