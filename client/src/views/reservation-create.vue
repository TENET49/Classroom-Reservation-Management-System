<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>发起预约申请</span>
          <div class="header-actions">
            <el-button @click="goSearch">返回查询</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="24" :md="14">
          <el-form :model="form" label-width="110px">
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="日期">
                  <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="节次">
                  <el-select v-model="form.timeSlotId" placeholder="请选择节次" style="width: 100%">
                    <el-option v-for="opt in timeSlotOptions" :key="opt.id" :label="opt.label" :value="opt.id" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="使用人数">
                  <el-input-number v-model="form.peopleCount" :min="1" :max="500" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="教室类型">
                  <el-select v-model="filters.roomTypeId" clearable placeholder="全部类型" style="width: 100%">
                    <el-option v-for="t in roomTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="楼栋">
                  <el-select v-model="filters.buildingId" clearable placeholder="全部楼栋" style="width: 100%">
                    <el-option v-for="b in buildingOptions" :key="b.id" :label="b.name" :value="b.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="必须设备">
                  <el-select
                    v-model="filters.equipmentRequired"
                    multiple
                    clearable
                    placeholder="不限制"
                    style="width: 100%"
                  >
                    <el-option v-for="e in equipmentOptions" :key="e" :label="e" :value="e" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="isTeacher" :gutter="16">
              <el-col :span="24">
                <el-alert
                  v-if="teacherConflict === true"
                  title="⚠ 您在该时间段已有授课安排，提交预约会被后端拒绝"
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

            <el-divider />

            <el-row :gutter="16" class="room-row">
              <el-col :xs="24" :sm="16">
                <el-form-item label="选择教室">
                  <el-select
                    v-model="form.roomId"
                    filterable
                    clearable
                    placeholder="请先点击“查询可用教室”"
                    style="width: 100%"
                  >
                    <el-option v-for="r in roomOptions" :key="r.id" :label="r.label" :value="r.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="8" class="room-actions">
                <el-button type="primary" :loading="isLoadingRooms" @click="loadAvailableRooms">查询可用教室</el-button>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :span="24" class="submit-actions">
                <el-button type="primary" :loading="isSubmitting" :disabled="!canSubmit" @click="submitReservation">
                  提交预约
                </el-button>
                <el-button @click="prefillFromQuery">重新读取携带参数</el-button>
              </el-col>
            </el-row>

            <el-alert
              v-if="submitResult"
              :title="submitResult"
              type="success"
              show-icon
              :closable="false"
              class="result-alert"
            />
            <el-alert
              v-if="submitError"
              :title="submitError"
              type="error"
              show-icon
              :closable="false"
              class="result-alert"
            />
          </el-form>
        </el-col>

        <el-col :xs="24" :md="10">
          <el-card shadow="never" class="side-card">
            <template #header>
              <div class="side-header">教室信息</div>
            </template>

            <template v-if="roomDetailLoading">
              <el-skeleton :rows="6" animated />
            </template>
            <template v-else-if="roomDetail">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="教室">{{ roomDetail.room_number }}</el-descriptions-item>
                <el-descriptions-item label="楼栋">{{ roomDetail.Building?.name || '—' }}</el-descriptions-item>
                <el-descriptions-item label="类型">{{ roomDetail.RoomType?.name || '—' }}</el-descriptions-item>
                <el-descriptions-item label="容量">{{ roomDetail.capacity }}</el-descriptions-item>
                <el-descriptions-item label="设备">{{ roomDetail.equipment || '—' }}</el-descriptions-item>
                <el-descriptions-item label="状态">{{
                  roomDetail.is_active ? '可用' : '禁用/维修'
                }}</el-descriptions-item>
              </el-descriptions>
            </template>
            <template v-else>
              <el-empty description="请选择教室" />
            </template>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/useAuthStore'
import roomService from '@/service/roomService'
import scheduleService from '@/service/scheduleService'
import reservationService from '@/service/reservationService'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const timeSlotOptions = [
  { id: 1, label: '第1–2节（08:00-09:35）' },
  { id: 2, label: '第3–4节（09:55-11:30）' },
  { id: 3, label: '第5–6节（14:00-15:35）' },
  { id: 4, label: '第7–8节（15:55-17:30）' },
  { id: 5, label: '晚自习（19:00-21:00）' },
]

const equipmentOptions = ['投影', '空调', '音响', '电脑']

const form = ref({
  date: dayjs().format('YYYY-MM-DD'),
  timeSlotId: 1,
  peopleCount: 30,
  roomId: null,
})

const filters = ref({
  roomTypeId: null,
  buildingId: null,
  equipmentRequired: [],
})

const isTeacher = computed(() => user.value?.role === 'teacher')
const teacherConflict = ref(null)

const buildingOptions = ref([])
const roomTypeOptions = ref([])
const roomOptions = ref([])
const isLoadingRooms = ref(false)

const roomDetail = ref(null)
const roomDetailLoading = ref(false)

const isSubmitting = ref(false)
const submitResult = ref('')
const submitError = ref('')

const canSubmit = computed(() => {
  return (
    !!user.value?.id && !!form.value.date && !!form.value.timeSlotId && !!form.value.peopleCount && !!form.value.roomId
  )
})

function goSearch() {
  router.push('/search')
}

function parseIntMaybe(v) {
  if (v === null || v === undefined || v === '') return null
  const n = parseInt(String(v))
  return Number.isFinite(n) ? n : null
}

function prefillFromQuery() {
  const q = route.query || {}
  const date = typeof q.date === 'string' ? q.date : null
  const timeSlotId = parseIntMaybe(q.timeSlotId)
  const peopleCount = parseIntMaybe(q.peopleCount)
  const roomId = parseIntMaybe(q.roomId)

  if (date) form.value.date = date
  if (timeSlotId) form.value.timeSlotId = timeSlotId
  if (peopleCount) form.value.peopleCount = peopleCount
  if (roomId) form.value.roomId = roomId
}

function buildRoomLabel(room) {
  const b = room?.Building?.name || '—'
  const t = room?.RoomType?.name || '—'
  return `${room.room_number}｜${b}｜${t}｜容量${room.capacity}`
}

function filterByEquipment(room) {
  const required = filters.value.equipmentRequired
  if (!required || required.length === 0) return true
  const eq = (room?.equipment || '').toLowerCase()
  return required.every((r) => eq.includes(String(r).toLowerCase()))
}

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

async function checkConflict() {
  if (!isTeacher.value) {
    teacherConflict.value = null
    return
  }
  if (!form.value.date || !form.value.timeSlotId) {
    teacherConflict.value = null
    return
  }
  try {
    const resp = await scheduleService.checkTeacherConflict({
      date: form.value.date,
      timeSlotId: form.value.timeSlotId,
    })
    if (resp?.code === 0) teacherConflict.value = !!resp?.data?.conflict
    else teacherConflict.value = null
  } catch (e) {
    teacherConflict.value = null
  }
}

watch([() => form.value.date, () => form.value.timeSlotId, isTeacher], () => {
  checkConflict()
})

async function loadAvailableRooms() {
  if (!form.value.date || !form.value.timeSlotId) return
  isLoadingRooms.value = true
  submitResult.value = ''
  submitError.value = ''
  try {
    const minCap = Math.max(parseIntMaybe(form.value.peopleCount) || 0, 0)
    const resp = await roomService.getAvailableRooms({
      date: form.value.date,
      timeSlotId: form.value.timeSlotId,
      roomTypeId: filters.value.roomTypeId || undefined,
      capacity: minCap || undefined,
    })
    const list = resp?.data || []
    const filtered = list
      .filter((r) => (filters.value.buildingId ? r?.Building?.id === filters.value.buildingId : true))
      .filter(filterByEquipment)
    roomOptions.value = filtered.map((r) => ({ id: r.id, label: buildRoomLabel(r), raw: r }))
    if (roomOptions.value.length > 0 && !form.value.roomId) {
      form.value.roomId = roomOptions.value[0].id
    }
  } catch (e) {
    roomOptions.value = []
  } finally {
    isLoadingRooms.value = false
  }
}

async function loadRoomDetail(roomId) {
  if (!roomId) {
    roomDetail.value = null
    return
  }
  roomDetailLoading.value = true
  try {
    const resp = await roomService.getRoomDetails(roomId)
    roomDetail.value = resp?.data || null
  } catch (e) {
    roomDetail.value = null
  } finally {
    roomDetailLoading.value = false
  }
}

watch(
  () => form.value.roomId,
  (id) => {
    loadRoomDetail(id)
  },
)

async function submitReservation() {
  if (!canSubmit.value) return
  isSubmitting.value = true
  submitResult.value = ''
  submitError.value = ''
  try {
    const payload = {
      userId: user.value.id,
      roomId: form.value.roomId,
      date: form.value.date,
      timeSlotId: form.value.timeSlotId,
      peopleCount: form.value.peopleCount,
    }
    const resp = await reservationService.createReservation(payload)
    if (resp?.code === 0) {
      const id = resp?.data?.id
      const status = resp?.data?.status
      submitResult.value = id ? `提交成功，预约编号：${id}（状态：${status || 'pending'}）` : '提交成功'
    } else {
      submitError.value = resp?.msg || '提交失败'
    }
  } catch (e) {
    submitError.value = e?.response?.data?.msg || e?.message || '提交失败'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await initOptions()
  prefillFromQuery()
  await checkConflict()
  if (form.value.roomId) {
    await loadRoomDetail(form.value.roomId)
  }
})
</script>

<style scoped>
.page {
  padding: 20px;
}

.card {
  max-width: 1100px;
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

.room-row {
  align-items: flex-end;
}

.room-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-actions {
  display: flex;
  gap: 10px;
}

.result-alert {
  margin-top: 12px;
}
</style>
