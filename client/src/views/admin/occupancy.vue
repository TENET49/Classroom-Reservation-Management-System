<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>占用状态总览</span>
          <div class="header-actions">
            <el-button :loading="isLoading" @click="refresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="12" class="filters">
        <el-col :xs="24" :sm="12" :md="6">
          <el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
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
        <el-col :xs="24" :sm="12" :md="6" class="legend">
          <el-tag type="success" effect="plain">空闲</el-tag>
          <el-tag type="primary" effect="plain">课程</el-tag>
          <el-tag type="warning" effect="plain">预约</el-tag>
          <el-tag type="danger" effect="plain">不可用</el-tag>
          <el-tag type="info" effect="plain">停用</el-tag>
        </el-col>
      </el-row>

      <el-table
        v-loading="isLoading"
        :data="rows"
        stripe
        style="width: 100%"
        :height="620"
        table-layout="auto"
        scrollbar-always-on
      >
        <el-table-column label="教室" width="150" fixed="left">
          <template #default="{ row }">
            <div class="room-cell">
              <div class="room-no">{{ row.room_number }}</div>
              <div class="room-sub muted">{{ row?.Building?.name || '—' }} · {{ row?.RoomType?.name || '—' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column v-for="ts in timeSlots" :key="ts.id" :label="timeSlotLabel(ts)" min-width="120">
          <template #default="{ row }">
            <el-popover
              v-if="cellReason(row, ts.id)"
              placement="top"
              trigger="hover"
              :width="260"
              :content="cellReason(row, ts.id)"
            >
              <template #reference>
                <el-tag :type="statusTagType(cellStatus(row, ts.id))" effect="plain">
                  {{ statusText(cellStatus(row, ts.id)) }}
                </el-tag>
              </template>
            </el-popover>

            <el-tag v-else :type="statusTagType(cellStatus(row, ts.id))" effect="plain">
              {{ statusText(cellStatus(row, ts.id)) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!isLoading && rows.length === 0" description="暂无数据" />
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import adminService from '@/service/adminService'
import roomService from '@/service/roomService'

const isLoading = ref(false)
const date = ref(dayjs().format('YYYY-MM-DD'))

const filters = ref({
  buildingId: null,
  roomTypeId: null
})

const buildingOptions = ref([])
const roomTypeOptions = ref([])

const timeSlots = ref([])
const rows = ref([])

function timeSlotLabel(ts) {
  const s = ts?.start_time || ''
  const e = ts?.end_time || ''
  if (s || e) return `${s}-${e}`
  return `节次${ts?.id}`
}

function statusText(v) {
  if (v === 'free') return '空闲'
  if (v === 'course') return '课程'
  if (v === 'reservation') return '预约'
  if (v === 'unavailable') return '不可用'
  if (v === 'disabled') return '停用'
  return '—'
}

function statusTagType(v) {
  if (v === 'free') return 'success'
  if (v === 'course') return 'primary'
  if (v === 'reservation') return 'warning'
  if (v === 'unavailable') return 'danger'
  if (v === 'disabled') return 'info'
  return 'info'
}

function cellStatus(row, timeSlotId) {
  return row?.occupancy?.[timeSlotId]?.status || 'free'
}

function cellReason(row, timeSlotId) {
  const s = row?.occupancy?.[timeSlotId]
  if (s?.status === 'unavailable') return s?.reason || ''
  if (s?.status === 'course' && s?.course_name) return s.course_name
  if (s?.status === 'reservation' && s?.people_count != null) return `人数：${s.people_count}`
  return ''
}

async function loadOptions() {
  try {
    const [bResp, tResp] = await Promise.all([
      roomService.getBuildings({ page: 1, pageSize: 200 }),
      roomService.getRoomTypes({ page: 1, pageSize: 200 })
    ])
    buildingOptions.value = bResp?.code === 0 ? bResp?.data?.list || [] : []
    roomTypeOptions.value = tResp?.code === 0 ? tResp?.data?.list || [] : []
  } catch (e) {
    buildingOptions.value = []
    roomTypeOptions.value = []
  }
}

async function refresh() {
  if (!date.value) return
  isLoading.value = true
  try {
    const resp = await adminService.getOccupancy({
      date: date.value,
      buildingId: filters.value.buildingId || undefined,
      roomTypeId: filters.value.roomTypeId || undefined
    })
    if (resp?.code === 0) {
      timeSlots.value = resp?.data?.timeSlots || []
      rows.value = resp?.data?.rooms || []
    } else {
      timeSlots.value = []
      rows.value = []
    }
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [date.value, filters.value.buildingId, filters.value.roomTypeId],
  () => refresh()
)

onMounted(async () => {
  await loadOptions()
  await refresh()
})
</script>

<style scoped>
.page {
  padding: 20px;
}

.card {
  max-width: 1700px;
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

.legend {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.muted {
  color: #909399;
}

.room-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.room-no {
  font-weight: 600;
}

.room-sub {
  margin-top: 6px;
  font-size: 12px;
}
</style>
