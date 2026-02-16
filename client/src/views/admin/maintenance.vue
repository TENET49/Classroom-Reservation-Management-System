<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>教室状态维护</span>
          <div class="header-actions">
            <el-button :loading="isLoading" @click="refresh">刷新</el-button>
            <el-button type="primary" @click="openCreate">新增不可用</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="12" class="filters">
        <el-col :xs="24" :sm="12" :md="8">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-col>

        <el-col :xs="24" :sm="12" :md="5">
          <el-select v-model="filters.buildingId" clearable filterable placeholder="楼栋" style="width: 100%">
            <el-option v-for="b in buildingOptions" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="5">
          <el-select v-model="filters.roomId" clearable filterable placeholder="教室" style="width: 100%">
            <el-option v-for="r in filteredRoomOptions" :key="r.id" :label="r.label" :value="r.id" />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="3">
          <el-select v-model="filters.timeSlotId" clearable placeholder="节次" style="width: 100%">
            <el-option label="全天" :value="0" />
            <el-option v-for="t in timeSlotOptions" :key="t.id" :label="t.label" :value="t.id" />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="24" :md="3">
          <el-input v-model="filters.keyword" clearable placeholder="原因" />
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
        <el-table-column label="教室" min-width="180">
          <template #default="{ row }">
            <div class="room-cell">
              <div class="room-no">{{ row?.Room?.room_number || '—' }}</div>
              <div class="room-sub muted">
                {{ row?.Room?.Building?.name || '—' }} · {{ row?.Room?.RoomType?.name || '—' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="date" label="日期" width="120" />

        <el-table-column label="节次" width="170">
          <template #default="{ row }">
            <template v-if="row?.time_slot_id">
              {{ timeSlotLabel(row.time_slot_id, row?.TimeSlot) }}
            </template>
            <template v-else>全天</template>
          </template>
        </el-table-column>

        <el-table-column prop="reason" label="原因" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="muted">{{ row?.reason || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.createdAt || row.created_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
              title="确认删除该不可用记录？"
              confirm-button-text="确认"
              cancel-button-text="取消"
              @confirm="remove(row)"
            >
              <template #reference>
                <el-button size="small" type="danger" :loading="deletingId === row.id">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!isLoading && list.length === 0" description="暂无不可用记录" />

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          background
          layout="total, prev, pager, next, sizes"
          :page-sizes="[10, 20, 50, 100, 200]"
          @current-change="refresh"
          @size-change="refresh"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="教室" required>
          <el-select v-model="form.room_id" filterable placeholder="请选择教室" style="width: 100%">
            <el-option v-for="r in roomOptions" :key="r.id" :label="r.label" :value="r.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="日期" required>
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>

        <el-form-item label="节次">
          <el-select v-model="form.time_slot_id" clearable placeholder="不选=全天" style="width: 100%">
            <el-option v-for="t in timeSlotOptions" :key="t.id" :label="t.label" :value="t.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="原因">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="例如：投影仪维修" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSaving" :disabled="!canSave" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import roomService from '@/service/roomService'

const timeSlotOptions = [
  { id: 1, label: '第1-2节' },
  { id: 2, label: '第3-4节' },
  { id: 3, label: '第5-6节' },
  { id: 4, label: '第7-8节' },
  { id: 5, label: '晚自习' },
]

function timeSlotLabel(id, ts) {
  if (ts?.start_time || ts?.end_time) return `${ts?.start_time || ''} - ${ts?.end_time || ''}`.trim()
  return timeSlotOptions.find((x) => x.id === id)?.label || `节次${id}`
}

const isLoading = ref(false)
const isSaving = ref(false)
const deletingId = ref(null)

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const buildingOptions = ref([])
const roomOptions = ref([])

const filters = ref({
  dateRange: null,
  buildingId: null,
  roomId: null,
  timeSlotId: null,
  keyword: '',
})

const filteredRoomOptions = computed(() => {
  if (!filters.value.buildingId) return roomOptions.value
  return roomOptions.value.filter((r) => r.buildingId === filters.value.buildingId)
})

function formatDateTime(v) {
  if (!v) return ''
  return dayjs(v).format('YYYY-MM-DD HH:mm')
}

async function initRoomOptions() {
  const resp = await roomService.getAllRooms({ page: 1, pageSize: 500 })
  const rows = resp?.data?.list || []
  const buildingMap = new Map()
  const roomOpts = []
  for (const r of rows) {
    if (r?.Building?.id) buildingMap.set(r.Building.id, { id: r.Building.id, name: r.Building.name })
    roomOpts.push({
      id: r.id,
      label: `${r?.Building?.name || '—'}-${r?.room_number || '—'}（${r?.RoomType?.name || '—'}）`,
      buildingId: r?.Building?.id || null,
    })
  }
  buildingOptions.value = Array.from(buildingMap.values()).sort((a, b) => a.id - b.id)
  roomOptions.value = roomOpts.sort((a, b) => String(a.label).localeCompare(String(b.label)))
}

async function refresh() {
  isLoading.value = true
  try {
    const range = Array.isArray(filters.value.dateRange) ? filters.value.dateRange : null
    const startDate = range?.[0] || undefined
    const endDate = range?.[1] || undefined

    const resp = await roomService.getRoomUnavailables({
      page: page.value,
      pageSize: pageSize.value,
      startDate,
      endDate,
      buildingId: filters.value.buildingId || undefined,
      roomId: filters.value.roomId || undefined,
      timeSlotId: filters.value.timeSlotId ?? undefined,
      keyword: (filters.value.keyword || '').trim() || undefined,
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

async function remove(row) {
  if (!row?.id) return
  deletingId.value = row.id
  try {
    await roomService.deleteRoomUnavailable(row.id)
    await refresh()
  } finally {
    deletingId.value = null
  }
}

const dialogVisible = ref(false)
const form = ref({
  room_id: null,
  date: dayjs().format('YYYY-MM-DD'),
  time_slot_id: null,
  reason: '',
})
const dialogTitle = computed(() => '新增不可用')
const canSave = computed(() => !!form.value.room_id && !!form.value.date)

function openCreate() {
  form.value = {
    room_id: null,
    date: dayjs().format('YYYY-MM-DD'),
    time_slot_id: null,
    reason: '',
  }
  dialogVisible.value = true
}

async function save() {
  if (!canSave.value) return
  isSaving.value = true
  try {
    const payload = {
      room_id: form.value.room_id,
      date: form.value.date,
      time_slot_id: form.value.time_slot_id ?? null,
      reason: form.value.reason || '',
    }
    const resp = await roomService.setRoomUnavailable(payload)
    if (resp?.code === 0) {
      dialogVisible.value = false
      await refresh()
    }
  } finally {
    isSaving.value = false
  }
}

watch(
  () => [
    filters.value.dateRange,
    filters.value.buildingId,
    filters.value.roomId,
    filters.value.timeSlotId,
    filters.value.keyword,
  ],
  () => {
    page.value = 1
    refresh()
  },
)

watch(
  () => [page.value, pageSize.value],
  () => refresh(),
)

watch(
  () => filters.value.buildingId,
  () => {
    if (filters.value.roomId && !filteredRoomOptions.value.some((r) => r.id === filters.value.roomId)) {
      filters.value.roomId = null
    }
  },
)

onMounted(async () => {
  await initRoomOptions()
  await refresh()
})
</script>

<style scoped>
.page {
  padding: 20px;
}

.card {
  max-width: 1500px;
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

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
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
