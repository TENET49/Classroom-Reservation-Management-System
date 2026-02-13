<template>
  <div class="search-page">
    <div class="page-title">🔍 教室可用性查询</div>

    <el-card shadow="never" class="query-card">
      <el-form label-width="110px" class="query-form">
        <el-tabs v-model="timeMode" class="time-tabs">
          <el-tab-pane label="按节次查询" name="slot">
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="日期">
                  <div class="date-row">
                    <el-date-picker v-model="queryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
                    <el-tag class="weekday-tag" effect="plain">{{ weekdayText }}</el-tag>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="节次">
                  <el-select v-model="timeSlotId" placeholder="请选择节次" style="width: 100%">
                    <el-option v-for="opt in timeSlotOptions" :key="opt.id" :label="opt.label" :value="opt.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="使用人数">
                  <el-input-number v-model="peopleCount" :min="1" :max="500" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="按具体时间段" name="range">
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="日期">
                  <div class="date-row">
                    <el-date-picker v-model="queryDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
                    <el-tag class="weekday-tag" effect="plain">{{ weekdayText }}</el-tag>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="开始时间">
                  <el-time-picker
                    v-model="startTime"
                    value-format="HH:mm:ss"
                    format="HH:mm"
                    placeholder="开始时间"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="结束时间">
                  <el-time-picker
                    v-model="endTime"
                    value-format="HH:mm:ss"
                    format="HH:mm"
                    placeholder="结束时间"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :xs="24" :sm="24" :md="24">
                <el-alert
                  v-if="derivedTimeSlotId === null && startTime && endTime"
                  title="当前版本仅支持在单个节次内查询；请调整时间范围（例如 08:00-09:35）。"
                  type="warning"
                  show-icon
                  :closable="false"
                />
                <el-alert
                  v-else-if="derivedTimeSlotId"
                  :title="`已自动匹配节次：${timeSlotLabelById(derivedTimeSlotId)}`"
                  type="success"
                  show-icon
                  :closable="false"
                />
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>

        <el-divider />

        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="教室类型">
              <el-select v-model="roomTypeId" clearable placeholder="全部类型" style="width: 100%">
                <el-option v-for="t in roomTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="楼栋">
              <el-select v-model="buildingId" clearable placeholder="全部楼栋" style="width: 100%">
                <el-option v-for="b in buildingOptions" :key="b.id" :label="b.name" :value="b.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="最少容量">
              <el-input-number v-model="minCapacity" :min="0" :max="500" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="必须设备">
              <el-select v-model="equipmentRequired" multiple clearable placeholder="不限制" style="width: 100%">
                <el-option v-for="e in equipmentOptions" :key="e" :label="e" :value="e" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="isTeacher" :gutter="16" class="teacher-tip-row">
          <el-col :span="24">
            <el-alert
              v-if="teacherConflict === true"
              title="⚠ 您在该时间段已有授课安排"
              type="warning"
              show-icon
              :closable="false"
            />
            <el-alert
              v-else-if="teacherConflict === false"
              title="✅ 您该时间段无授课冲突"
              type="success"
              show-icon
              :closable="false"
            />
          </el-col>
        </el-row>

        <el-row :gutter="16" class="actions-row">
          <el-col :span="24" class="actions">
            <el-button type="primary" :loading="isSearching" @click="handleSearch">查询</el-button>
            <el-button v-if="isTeacher" type="info" :loading="isTeacherFilling" @click="useMyFreeTimeSearch">
              使用我的空闲时间查询
            </el-button>
            <el-button @click="resetForm">重置</el-button>

            <div class="view-switch">
              <el-radio-group v-model="viewMode" size="small">
                <el-radio-button label="list">列表模式</el-radio-button>
                <el-radio-button label="timeline">时间轴模式</el-radio-button>
              </el-radio-group>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="never" class="result-card">
      <template #header>
        <div class="result-header">
          <div class="result-title">
            查询结果
            <el-tag effect="plain" type="success">可预约 {{ availableCount }} 间</el-tag>
            <el-tag effect="plain" type="info">共 {{ resultList.length }} 间</el-tag>
          </div>
        </div>
      </template>

      <template v-if="viewMode === 'list'">
        <el-table
          ref="listTableRef"
          :data="resultList"
          stripe
          style="width: 100%"
          :height="460"
          v-loading="isSearching"
          table-layout="auto"
          scrollbar-always-on
        >
          <el-table-column prop="roomNumber" label="教室" width="120">
            <template #default="{ row }">
              <el-link type="primary" @click="openRoomDetail(row.room)">{{ row.roomNumber }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="buildingName" label="楼栋" width="140" />
          <el-table-column prop="roomTypeName" label="类型" width="140" />
          <el-table-column prop="capacity" label="容量" width="100" />
          <el-table-column prop="statusText" label="当前状态" width="140">
            <template #default="{ row }">
              <el-tag :type="row.statusType" effect="plain">{{ row.statusText }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" size="small" :disabled="!row.canReserve" @click="goReserve(row.room)">
                预约
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template v-else>
        <el-table
          ref="timelineTableRef"
          :data="timelineRows"
          stripe
          style="width: 100%"
          :height="460"
          v-loading="isTimelineLoading"
          table-layout="auto"
          scrollbar-always-on
        >
          <el-table-column prop="roomNumber" label="教室" width="120">
            <template #default="{ row }">
              <el-link type="primary" @click="openRoomDetail(row.room)">{{ row.roomNumber }}</el-link>
            </template>
          </el-table-column>
          <el-table-column v-for="opt in timeSlotOptions" :key="opt.id" :label="opt.short" :min-width="120">
            <template #default="{ row }">
              <el-tag :type="row.slots[opt.id].type" effect="plain">{{ row.slots[opt.id].text }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>

    <el-drawer v-model="roomDrawerVisible" size="40%" :title="drawerTitle">
      <template v-if="roomDetailLoading">
        <el-skeleton :rows="6" animated />
      </template>
      <template v-else-if="roomDetail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="教室">{{ roomDetail.room_number }}</el-descriptions-item>
          <el-descriptions-item label="楼栋">{{ roomDetail.Building?.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ roomDetail.RoomType?.name }}</el-descriptions-item>
          <el-descriptions-item label="容量">{{ roomDetail.capacity }}</el-descriptions-item>
          <el-descriptions-item label="设备">{{ roomDetail.equipment || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ roomDetail.is_active ? '可用' : '禁用/维修' }}</el-descriptions-item>
        </el-descriptions>

        <div class="drawer-section-title">今日占用</div>
        <el-table :data="drawerScheduleRows" stripe style="width: 100%">
          <el-table-column prop="slot" label="节次" width="140" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="name" label="内容" />
        </el-table>
      </template>
      <template v-else>
        <el-empty description="暂无数据" />
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import roomService from '@/service/roomService'
import scheduleService from '@/service/scheduleService'
import { useAuthStore } from '@/stores/useAuthStore'

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const timeMode = ref('slot')
const queryDate = ref(dayjs().format('YYYY-MM-DD'))
const timeSlotId = ref(1)
const startTime = ref(null)
const endTime = ref(null)
const peopleCount = ref(30)

const roomTypeId = ref(null)
const buildingId = ref(null)
const minCapacity = ref(0)
const equipmentRequired = ref([])

const isSearching = ref(false)
const isTeacherFilling = ref(false)
const teacherConflict = ref(null)

const listTableRef = ref()
const timelineTableRef = ref()

const viewModeOptions = [
  { label: '列表模式', value: 'list' },
  { label: '时间轴模式', value: 'timeline' },
]
const viewMode = ref('list')

const resultList = ref([])
const scheduleCache = ref(new Map())

const roomTypeOptions = ref([])
const buildingOptions = ref([])

const equipmentOptions = ['投影', '空调', '音响', '电脑']

const timeSlotOptions = [
  { id: 1, label: '第1–2节（08:00-09:35）', short: '1-2节', start: '08:00:00', end: '09:35:00' },
  { id: 2, label: '第3–4节（09:55-11:30）', short: '3-4节', start: '09:55:00', end: '11:30:00' },
  { id: 3, label: '第5–6节（14:00-15:35）', short: '5-6节', start: '14:00:00', end: '15:35:00' },
  { id: 4, label: '第7–8节（15:55-17:30）', short: '7-8节', start: '15:55:00', end: '17:30:00' },
  { id: 5, label: '晚自习（19:00-21:00）', short: '晚自习', start: '19:00:00', end: '21:00:00' },
]

const weekdayText = computed(() => {
  if (!queryDate.value) return ''
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[dayjs(queryDate.value).day()]
})

const isTeacher = computed(() => user.value?.role === 'teacher')

const derivedTimeSlotId = computed(() => {
  if (timeMode.value !== 'range') return null
  if (!startTime.value || !endTime.value) return null
  const start = startTime.value
  const end = endTime.value
  const matched = timeSlotOptions.find((s) => s.start <= start && s.end >= end)
  return matched ? matched.id : null
})

function timeSlotLabelById(id) {
  const found = timeSlotOptions.find((s) => s.id === id)
  return found ? found.label : ''
}

const effectiveTimeSlotId = computed(() => {
  if (timeMode.value === 'slot') return timeSlotId.value
  return derivedTimeSlotId.value
})

const availableCount = computed(() => resultList.value.filter((r) => r.statusText === '可预约').length)

async function initOptions() {
  try {
    const resp = await roomService.getAllRooms({ page: 1, pageSize: 500 })
    const list = resp?.data?.list || []

    const buildingMap = new Map()
    const typeMap = new Map()
    for (const room of list) {
      if (room?.Building?.id) buildingMap.set(room.Building.id, { id: room.Building.id, name: room.Building.name })
      if (room?.RoomType?.id) typeMap.set(room.RoomType.id, { id: room.RoomType.id, name: room.RoomType.name })
    }
    buildingOptions.value = Array.from(buildingMap.values()).sort((a, b) => a.id - b.id)
    roomTypeOptions.value = Array.from(typeMap.values()).sort((a, b) => a.id - b.id)
  } catch (e) {
    buildingOptions.value = []
    roomTypeOptions.value = []
  }
}

async function checkTeacherConflict() {
  if (!isTeacher.value) {
    teacherConflict.value = null
    return
  }
  if (!queryDate.value || !effectiveTimeSlotId.value) {
    teacherConflict.value = null
    return
  }
  try {
    const resp = await scheduleService.checkTeacherConflict({
      date: queryDate.value,
      timeSlotId: effectiveTimeSlotId.value,
    })
    if (resp?.code === 0) {
      teacherConflict.value = !!resp?.data?.conflict
    } else {
      teacherConflict.value = null
    }
  } catch (e) {
    teacherConflict.value = null
  }
}

watch([queryDate, effectiveTimeSlotId, isTeacher], () => {
  checkTeacherConflict()
})

function resetForm() {
  timeMode.value = 'slot'
  queryDate.value = dayjs().format('YYYY-MM-DD')
  timeSlotId.value = 1
  startTime.value = null
  endTime.value = null
  peopleCount.value = 30
  roomTypeId.value = null
  buildingId.value = null
  minCapacity.value = 0
  equipmentRequired.value = []
  teacherConflict.value = null
  resultList.value = []
  scheduleCache.value = new Map()
}

function filterByEquipment(room) {
  const required = equipmentRequired.value
  if (!required || required.length === 0) return true
  const eq = (room?.equipment || '').toLowerCase()
  return required.every((r) => eq.includes(String(r).toLowerCase()))
}

function mapStatusType(statusText) {
  if (statusText === '可预约') return 'success'
  if (statusText === '容量不足') return 'info'
  if (statusText === '上课中') return 'danger'
  if (statusText === '已预约') return 'warning'
  if (statusText === '维修/禁用') return 'danger'
  return 'info'
}

async function mapLimit(list, limit, mapper) {
  const result = []
  const executing = []
  for (const item of list) {
    const p = Promise.resolve().then(() => mapper(item))
    result.push(p)
    if (limit <= list.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)
      if (executing.length >= limit) await Promise.race(executing)
    }
  }
  return Promise.all(result)
}

async function handleSearch() {
  if (!queryDate.value) return
  if (!effectiveTimeSlotId.value) return

  isSearching.value = true
  scheduleCache.value = new Map()
  try {
    const minCap = Math.max(minCapacity.value || 0, peopleCount.value || 0)
    const [allResp, availResp] = await Promise.all([
      roomService.getAllRooms({ page: 1, pageSize: 500 }),
      roomService.getAvailableRooms({
        date: queryDate.value,
        timeSlotId: effectiveTimeSlotId.value,
        roomTypeId: roomTypeId.value || undefined,
        capacity: minCap || undefined,
      }),
    ])

    const allRooms = allResp?.data?.list || []
    const availableRooms = availResp?.data || []
    const availableSet = new Set(availableRooms.map((r) => r.id))

    const filtered = allRooms
      .filter((r) => (roomTypeId.value ? r?.RoomType?.id === roomTypeId.value : true))
      .filter((r) => (buildingId.value ? r?.Building?.id === buildingId.value : true))
      .filter(filterByEquipment)

    const rows = await mapLimit(filtered, 6, async (room) => {
      const roomNumber = room.room_number
      const buildingName = room?.Building?.name || '—'
      const roomTypeName = room?.RoomType?.name || '—'

      let statusText = '不可用'
      let canReserve = false

      if (!room.is_active) {
        statusText = '维修/禁用'
      } else if ((peopleCount.value || 0) > (room.capacity || 0)) {
        statusText = '容量不足'
      } else if (availableSet.has(room.id)) {
        statusText = '可预约'
        canReserve = true
      } else {
        try {
          const schResp = await roomService.getRoomSchedule(room.id, { date: queryDate.value })
          const sch = schResp?.data || { courses: [], reservations: [], unavailables: [] }
          scheduleCache.value.set(room.id, sch)
          const ts = effectiveTimeSlotId.value

          const hasUnavailable = (sch.unavailables || []).some((u) => u.time_slot_id === null || u.time_slot_id === ts)
          if (hasUnavailable) {
            statusText = '维修/禁用'
          } else {
            const hasReservation = (sch.reservations || []).some((r) => r.time_slot_id === ts)
            const hasCourse = (sch.courses || []).some((c) => c.time_slot_id === ts)
            if (hasCourse) statusText = '上课中'
            else if (hasReservation) statusText = '已预约'
            else statusText = '不可用'
          }
        } catch (e) {
          statusText = '不可用'
        }
      }

      const statusType = mapStatusType(statusText)
      const score = (statusText === '可预约' ? 0 : 100000) + Math.abs((room.capacity || 0) - (peopleCount.value || 0))

      return {
        room,
        roomNumber,
        buildingName,
        roomTypeName,
        capacity: room.capacity,
        statusText,
        statusType,
        canReserve,
        score,
      }
    })

    rows.sort((a, b) => a.score - b.score)
    resultList.value = rows

    if (viewMode.value === 'timeline') await loadTimeline()
  } finally {
    isSearching.value = false
  }
}

function goReserve(room) {
  router.push({
    path: '/reservation/create',
    query: {
      roomId: room.id,
      date: queryDate.value,
      timeSlotId: effectiveTimeSlotId.value,
      peopleCount: peopleCount.value,
    },
  })
}

const roomDrawerVisible = ref(false)
const roomDetailLoading = ref(false)
const roomDetail = ref(null)
const drawerScheduleRows = ref([])

const drawerTitle = computed(() => {
  if (!roomDetail.value) return '教室详情'
  return `教室详情 - ${roomDetail.value.room_number}`
})

function buildScheduleRows(schedule) {
  const rows = []
  const tsMap = new Map(timeSlotOptions.map((t) => [t.id, t.short]))

  for (const c of schedule?.courses || []) {
    rows.push({ slot: tsMap.get(c.time_slot_id) || c.time_slot_id, type: '课程占用', name: c.course_name || '—' })
  }
  for (const r of schedule?.reservations || []) {
    rows.push({
      slot: tsMap.get(r.time_slot_id) || r.time_slot_id,
      type: '已预约',
      name: r.purpose || '预约',
    })
  }
  for (const u of schedule?.unavailables || []) {
    rows.push({
      slot: u.time_slot_id ? tsMap.get(u.time_slot_id) || u.time_slot_id : '全天',
      type: '维修/禁用',
      name: u.reason || '—',
    })
  }
  rows.sort((a, b) => String(a.slot).localeCompare(String(b.slot)))
  return rows
}

async function openRoomDetail(room) {
  roomDrawerVisible.value = true
  roomDetailLoading.value = true
  roomDetail.value = null
  drawerScheduleRows.value = []
  try {
    const [detailResp, scheduleResp] = await Promise.all([
      roomService.getRoomDetails(room.id),
      roomService.getRoomSchedule(room.id, { date: queryDate.value }),
    ])
    roomDetail.value = detailResp?.data || null
    const sch = scheduleResp?.data || null
    drawerScheduleRows.value = buildScheduleRows(sch)
  } finally {
    roomDetailLoading.value = false
  }
}

const isTimelineLoading = ref(false)
const timelineRows = ref([])

function resolveSlotText(sch, tsId) {
  const hasUnavailable = (sch.unavailables || []).some((u) => u.time_slot_id === null || u.time_slot_id === tsId)
  if (hasUnavailable) return { text: '维修', type: 'danger' }
  const hasCourse = (sch.courses || []).some((c) => c.time_slot_id === tsId)
  if (hasCourse) return { text: '课程', type: 'danger' }
  const hasRes = (sch.reservations || []).some((r) => r.time_slot_id === tsId)
  if (hasRes) return { text: '预约', type: 'warning' }
  return { text: '空闲', type: 'success' }
}

async function loadTimeline() {
  isTimelineLoading.value = true
  try {
    const rooms = resultList.value.slice(0, 30).map((r) => r.room)
    const rows = await mapLimit(rooms, 6, async (room) => {
      let sch = scheduleCache.value.get(room.id)
      if (!sch) {
        try {
          const resp = await roomService.getRoomSchedule(room.id, { date: queryDate.value })
          sch = resp?.data || { courses: [], reservations: [], unavailables: [] }
          scheduleCache.value.set(room.id, sch)
        } catch (e) {
          sch = { courses: [], reservations: [], unavailables: [] }
        }
      }
      const slots = {}
      for (const ts of timeSlotOptions) {
        slots[ts.id] = resolveSlotText(sch, ts.id)
      }
      return {
        room,
        roomNumber: room.room_number,
        slots,
      }
    })
    timelineRows.value = rows
  } finally {
    isTimelineLoading.value = false
  }
}

watch(viewMode, async (val) => {
  if (val === 'timeline' && resultList.value.length > 0) await loadTimeline()
})

async function relayoutTables() {
  await nextTick()
  listTableRef.value?.doLayout?.()
  timelineTableRef.value?.doLayout?.()
}

watch([resultList, viewMode, isSearching, isTimelineLoading], () => {
  relayoutTables()
})

let resizeTimer = null
const handleResize = () => {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    relayoutTables()
  }, 100)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeTimer) clearTimeout(resizeTimer)
})

async function useMyFreeTimeSearch() {
  if (!isTeacher.value) return
  if (!queryDate.value) return
  isTeacherFilling.value = true
  try {
    const resp = await scheduleService.getTeacherFreeSlots({ date: queryDate.value })
    const ids = resp?.data?.freeTimeSlotIds || []
    if (ids.length === 0) return
    timeMode.value = 'slot'
    timeSlotId.value = ids[0]
    await handleSearch()
  } finally {
    isTeacherFilling.value = false
  }
}

onMounted(async () => {
  await initOptions()
  await checkTeacherConflict()
})
</script>

<style scoped>
.search-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100%;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.query-card {
  margin-bottom: 16px;
}

.date-row {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.weekday-tag {
  white-space: nowrap;
}

.teacher-tip-row {
  margin-top: 8px;
}

.actions-row {
  margin-top: 8px;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.view-switch {
  margin-left: auto;
}

.result-card {
  margin-bottom: 16px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 强制对齐表头和单元格 */
:deep(.el-table .cell) {
  text-align: center !important;
}
:deep(.el-table th.el-table__cell) {
  text-align: center !important;
}
:deep(.el-table td.el-table__cell) {
  text-align: center !important;
}

:deep(.result-card .el-table__header-wrapper table),
:deep(.result-card .el-table__body-wrapper table) {
  width: 100% !important;
}

:deep(.result-card .el-scrollbar__view) {
  width: 100% !important;
  display: block;
}

:deep(.result-card .el-table__body-wrapper) {
  text-align: left;
}
.drawer-section-title {
  margin: 16px 0 8px;
  font-weight: 600;
}
</style>
