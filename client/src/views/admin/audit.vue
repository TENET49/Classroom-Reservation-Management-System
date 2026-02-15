<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>预约审核（待审核列表）</span>
          <div class="header-actions">
            <el-button :loading="isLoading" @click="refresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="16" class="filters">
        <el-col :xs="24" :sm="12" :md="6">
          <el-date-picker v-model="filters.date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-select v-model="filters.buildingId" clearable placeholder="全部楼栋" style="width: 100%">
            <el-option v-for="b in buildingOptions" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-select v-model="filters.roomTypeId" clearable placeholder="全部类型" style="width: 100%">
            <el-option v-for="t in roomTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-input v-model="filters.keyword" clearable placeholder="搜索：教室/用户/邮箱" />
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
        <el-table-column prop="created_at" label="提交时间" width="170">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.createdAt || row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="申请人" width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-name">{{ row?.User?.name || '—' }}</div>
              <div class="user-sub">{{ row?.User?.email || '—' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="教室" width="140">
          <template #default="{ row }">
            <span>{{ row?.Room?.room_number || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="楼栋/类型" min-width="220">
          <template #default="{ row }">
            <span>{{ row?.Room?.Building?.name || '—' }}</span>
            <span class="muted">｜</span>
            <span>{{ row?.Room?.RoomType?.name || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="日期" width="130" />
        <el-table-column label="节次" width="160">
          <template #default="{ row }">
            <span>{{ formatTimeSlot(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="人数" width="90">
          <template #default="{ row }">
            <span>{{ row.people_count ?? '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" :loading="submittingId === row.id" @click="openAudit(row, 'approve')">
              通过
            </el-button>
            <el-button size="small" type="danger" :loading="submittingId === row.id" @click="openAudit(row, 'reject')">
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!isLoading && list.length === 0" description="暂无待审核预约" />

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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form :model="dialogForm" label-width="90px">
        <el-form-item label="预约信息">
          <div class="dialog-summary">
            <div>{{ dialogRow?.Room?.room_number || '—' }}｜{{ dialogRow?.date || '' }}｜{{ formatTimeSlot(dialogRow) }}</div>
            <div class="muted">{{ dialogRow?.User?.name || '—' }}（{{ dialogRow?.User?.email || '—' }}）</div>
          </div>
        </el-form-item>
        <el-form-item label="理由">
          <el-input v-model="dialogForm.reason" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="submitAudit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import adminService from '@/service/adminService'
import roomService from '@/service/roomService'

const isLoading = ref(false)
const isSubmitting = ref(false)
const submittingId = ref(null)

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filters = ref({
  date: null,
  buildingId: null,
  roomTypeId: null,
  keyword: ''
})

const buildingOptions = ref([])
const roomTypeOptions = ref([])

async function initOptions() {
  try {
    const resp = await roomService.getAllRooms({ page: 1, pageSize: 500 })
    const rooms = resp?.data?.list || []

    const buildingMap = new Map()
    const typeMap = new Map()
    for (const r of rooms) {
      if (r?.Building?.id) buildingMap.set(r.Building.id, { id: r.Building.id, name: r.Building.name })
      if (r?.RoomType?.id) typeMap.set(r.RoomType.id, { id: r.RoomType.id, name: r.RoomType.name })
    }
    buildingOptions.value = Array.from(buildingMap.values()).sort((a, b) => a.id - b.id)
    roomTypeOptions.value = Array.from(typeMap.values()).sort((a, b) => a.id - b.id)
  } catch (e) {
    buildingOptions.value = []
    roomTypeOptions.value = []
  }
}

function formatDateTime(v) {
  if (!v) return ''
  return dayjs(v).format('YYYY-MM-DD HH:mm')
}

function formatTimeSlot(row) {
  const ts = row?.TimeSlot
  if (!ts) return row?.time_slot_id ? `节次${row.time_slot_id}` : '—'
  const s = ts.start_time || ''
  const e = ts.end_time || ''
  if (!s && !e) return row?.time_slot_id ? `节次${row.time_slot_id}` : '—'
  return `${s} - ${e}`
}

async function refresh() {
  isLoading.value = true
  try {
    const resp = await adminService.getPendingReservations({
      page: page.value,
      pageSize: pageSize.value,
      date: filters.value.date || undefined,
      buildingId: filters.value.buildingId || undefined,
      roomTypeId: filters.value.roomTypeId || undefined,
      keyword: filters.value.keyword || undefined
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

const dialogVisible = ref(false)
const dialogRow = ref(null)
const dialogAction = ref('approve')
const dialogForm = ref({ reason: '' })
const dialogTitle = computed(() => (dialogAction.value === 'approve' ? '通过预约' : '驳回预约'))

function openAudit(row, action) {
  dialogRow.value = row
  dialogAction.value = action
  dialogForm.value.reason = ''
  dialogVisible.value = true
}

async function submitAudit() {
  if (!dialogRow.value?.id) return
  isSubmitting.value = true
  submittingId.value = dialogRow.value.id
  try {
    const resp = await adminService.auditReservation(dialogRow.value.id, {
      action: dialogAction.value,
      reason: dialogForm.value.reason || undefined
    })
    if (resp?.code === 0) {
      dialogVisible.value = false
      await refresh()
    }
  } finally {
    isSubmitting.value = false
    submittingId.value = null
  }
}

watch(
  () => [filters.value.date, filters.value.buildingId, filters.value.roomTypeId, filters.value.keyword],
  () => {
    page.value = 1
    refresh()
  }
)

onMounted(async () => {
  await initOptions()
  await refresh()
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
.dialog-summary {
  display: flex;
  flex-direction: column;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
