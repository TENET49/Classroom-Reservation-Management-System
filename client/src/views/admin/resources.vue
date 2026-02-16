<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>教室资源管理</span>
          <div class="header-actions">
            <el-button :loading="isLoading" @click="refresh">刷新</el-button>
            <el-button v-if="activeTab === 'room-types'" type="primary" @click="openRoomTypeCreate">新增类型</el-button>
            <el-button v-if="activeTab === 'rooms'" type="primary" @click="openRoomCreate">新增教室</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="tabs" @tab-change="handleTabChange">
        <el-tab-pane label="教室类型管理" name="room-types">
          <el-row :gutter="16" class="filters">
            <el-col :xs="24" :sm="12" :md="10">
              <el-input v-model="roomTypeKeyword" clearable placeholder="搜索：名称/描述" />
            </el-col>
          </el-row>

          <el-table
            v-loading="isLoading"
            :data="roomTypes"
            stripe
            style="width: 100%"
            :height="560"
            table-layout="auto"
            scrollbar-always-on
          >
            <el-table-column prop="name" label="名称" min-width="160" />
            <el-table-column prop="description" label="描述" min-width="260">
              <template #default="{ row }">
                <span class="muted">{{ row.description || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="roomCount" label="教室数" width="90" />
            <el-table-column label="创建时间" width="170">
              <template #default="{ row }">
                <span>{{ formatDateTime(row.createdAt || row.created_at) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="openRoomTypeEdit(row)">编辑</el-button>
                <el-popconfirm
                  title="确认删除该教室类型？（类型下存在教室将无法删除）"
                  confirm-button-text="确认"
                  cancel-button-text="取消"
                  @confirm="removeRoomType(row)"
                >
                  <template #reference>
                    <el-button size="small" type="danger" :loading="deletingId === `roomType:${row.id}`">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!isLoading && roomTypes.length === 0" description="暂无教室类型" />

          <div class="pager">
            <el-pagination
              v-model:current-page="roomTypePage"
              v-model:page-size="roomTypePageSize"
              :total="roomTypeTotal"
              background
              layout="total, prev, pager, next, sizes"
              :page-sizes="[10, 20, 50, 100, 200]"
              @current-change="refresh"
              @size-change="refresh"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="教室信息管理" name="rooms">
          <el-row :gutter="16" class="filters">
            <el-col :xs="24" :sm="12" :md="6">
              <el-select v-model="roomFilters.buildingId" clearable placeholder="全部楼栋" style="width: 100%">
                <el-option v-for="b in buildingOptions" :key="b.id" :label="b.name" :value="b.id" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <el-select v-model="roomFilters.roomTypeId" clearable placeholder="全部类型" style="width: 100%">
                <el-option v-for="t in roomTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12">
              <el-input v-model="roomFilters.keyword" clearable placeholder="搜索：教室号" />
            </el-col>
          </el-row>

          <el-table
            v-loading="isLoading"
            :data="rooms"
            stripe
            style="width: 100%"
            :height="560"
            table-layout="auto"
            scrollbar-always-on
          >
            <el-table-column prop="room_number" label="教室号" width="140" />
            <el-table-column label="楼栋" width="140">
              <template #default="{ row }">
                <span>{{ row?.Building?.name || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="140">
              <template #default="{ row }">
                <span>{{ row?.RoomType?.name || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="capacity" label="容量" width="90" />
            <el-table-column prop="equipment" label="设备" min-width="200">
              <template #default="{ row }">
                <span class="muted">{{ row?.equipment || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="row?.is_active ? 'success' : 'info'" effect="plain">
                  {{ row?.is_active ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="openRoomEdit(row)">编辑</el-button>
                <el-button size="small" :type="row?.is_active ? 'warning' : 'success'" @click="toggleRoomActive(row)">
                  {{ row?.is_active ? '停用' : '启用' }}
                </el-button>
                <el-popconfirm
                  title="确认删除该教室？"
                  confirm-button-text="确认"
                  cancel-button-text="取消"
                  @confirm="removeRoom(row)"
                >
                  <template #reference>
                    <el-button size="small" type="danger" :loading="deletingId === `room:${row.id}`">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!isLoading && rooms.length === 0" description="暂无教室" />

          <div class="pager">
            <el-pagination
              v-model:current-page="roomPage"
              v-model:page-size="roomPageSize"
              :total="roomTotal"
              background
              layout="total, prev, pager, next, sizes"
              :page-sizes="[10, 20, 50, 100, 200]"
              @current-change="refresh"
              @size-change="refresh"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="roomTypeDialogVisible" :title="roomTypeDialogTitle" width="520px">
      <el-form :model="roomTypeForm" label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="roomTypeForm.name" placeholder="例如：多媒体/机房" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="roomTypeForm.description" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roomTypeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSaving" @click="saveRoomType">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="roomDialogVisible" :title="roomDialogTitle" width="560px">
      <el-form :model="roomForm" label-width="90px">
        <el-form-item label="教室号">
          <el-input v-model="roomForm.room_number" placeholder="例如：3-201" />
        </el-form-item>
        <el-form-item label="楼栋">
          <el-select v-model="roomForm.building_id" placeholder="请选择" style="width: 100%">
            <el-option v-for="b in buildingOptions" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="roomForm.room_type_id" placeholder="请选择" style="width: 100%">
            <el-option v-for="t in roomTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="容量">
          <el-input v-model.number="roomForm.capacity" />
        </el-form-item>
        <el-form-item label="设备">
          <el-input v-model="roomForm.equipment" placeholder="可选" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="roomForm.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roomDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSaving" @click="saveRoom">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import roomService from '@/service/roomService'

const router = useRouter()
const route = useRoute()

const activeTab = ref('room-types')
const isLoading = ref(false)
const isSaving = ref(false)
const deletingId = ref(null)

const buildingOptions = ref([])
const roomTypeOptions = ref([])

function formatDateTime(v) {
  if (!v) return ''
  return dayjs(v).format('YYYY-MM-DD HH:mm')
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

const roomTypeKeyword = ref('')
const roomTypePage = ref(1)
const roomTypePageSize = ref(20)
const roomTypeTotal = ref(0)
const roomTypes = ref([])

async function refreshRoomTypes() {
  const resp = await roomService.getRoomTypes({
    page: roomTypePage.value,
    pageSize: roomTypePageSize.value,
    keyword: roomTypeKeyword.value || undefined
  })
  if (resp?.code === 0) {
    roomTypes.value = resp?.data?.list || []
    roomTypeTotal.value = resp?.data?.total || 0
  } else {
    roomTypes.value = []
    roomTypeTotal.value = 0
  }
}

const roomFilters = ref({
  buildingId: null,
  roomTypeId: null,
  keyword: ''
})
const roomPage = ref(1)
const roomPageSize = ref(20)
const roomTotal = ref(0)
const rooms = ref([])

async function refreshRooms() {
  const resp = await roomService.getAllRooms({
    page: roomPage.value,
    pageSize: roomPageSize.value,
    buildingId: roomFilters.value.buildingId || undefined,
    roomTypeId: roomFilters.value.roomTypeId || undefined,
    keyword: roomFilters.value.keyword || undefined
  })
  if (resp?.code === 0) {
    rooms.value = resp?.data?.list || []
    roomTotal.value = resp?.data?.total || 0
  } else {
    rooms.value = []
    roomTotal.value = 0
  }
}

async function refresh() {
  isLoading.value = true
  try {
    await loadOptions()
    if (activeTab.value === 'rooms') await refreshRooms()
    else await refreshRoomTypes()
  } catch (e) {
  } finally {
    isLoading.value = false
  }
}

function handleTabChange(name) {
  const tab = String(name || 'room-types')
  router.replace({ path: '/admin/resources', query: { tab } })
  activeTab.value = tab
  refresh()
}

const roomTypeDialogVisible = ref(false)
const roomTypeEditingId = ref(null)
const roomTypeForm = ref({ name: '', description: '' })
const roomTypeDialogTitle = computed(() => (roomTypeEditingId.value ? '编辑教室类型' : '新增教室类型'))

function openRoomTypeCreate() {
  roomTypeEditingId.value = null
  roomTypeForm.value = { name: '', description: '' }
  roomTypeDialogVisible.value = true
}

function openRoomTypeEdit(row) {
  roomTypeEditingId.value = row?.id || null
  roomTypeForm.value = { name: row?.name || '', description: row?.description || '' }
  roomTypeDialogVisible.value = true
}

async function saveRoomType() {
  const name = String(roomTypeForm.value.name || '').trim()
  if (!name) return
  isSaving.value = true
  try {
    if (roomTypeEditingId.value) {
      const resp = await roomService.updateRoomType(roomTypeEditingId.value, { name, description: roomTypeForm.value.description || '' })
      if (resp?.code === 0) roomTypeDialogVisible.value = false
    } else {
      const resp = await roomService.createRoomType({ name, description: roomTypeForm.value.description || '' })
      if (resp?.code === 0) roomTypeDialogVisible.value = false
    }
    await refresh()
  } finally {
    isSaving.value = false
  }
}

async function removeRoomType(row) {
  if (!row?.id) return
  deletingId.value = `roomType:${row.id}`
  try {
    await roomService.deleteRoomType(row.id)
    await refresh()
  } finally {
    deletingId.value = null
  }
}

const roomDialogVisible = ref(false)
const roomEditingId = ref(null)
const roomForm = ref({
  room_number: '',
  building_id: null,
  room_type_id: null,
  capacity: 1,
  equipment: '',
  is_active: true
})
const roomDialogTitle = computed(() => (roomEditingId.value ? '编辑教室' : '新增教室'))

function openRoomCreate() {
  roomEditingId.value = null
  roomForm.value = { room_number: '', building_id: null, room_type_id: null, capacity: 1, equipment: '', is_active: true }
  roomDialogVisible.value = true
}

function openRoomEdit(row) {
  roomEditingId.value = row?.id || null
  roomForm.value = {
    room_number: row?.room_number || '',
    building_id: row?.building_id ?? row?.Building?.id ?? null,
    room_type_id: row?.room_type_id ?? row?.RoomType?.id ?? null,
    capacity: row?.capacity ?? 1,
    equipment: row?.equipment || '',
    is_active: !!row?.is_active
  }
  roomDialogVisible.value = true
}

async function saveRoom() {
  const roomNumber = String(roomForm.value.room_number || '').trim()
  if (!roomNumber) return
  if (!roomForm.value.building_id || !roomForm.value.room_type_id) return
  const payload = {
    room_number: roomNumber,
    building_id: roomForm.value.building_id,
    room_type_id: roomForm.value.room_type_id,
    capacity: parseInt(roomForm.value.capacity) || 1,
    equipment: roomForm.value.equipment || '',
    is_active: !!roomForm.value.is_active
  }
  isSaving.value = true
  try {
    if (roomEditingId.value) {
      const resp = await roomService.updateRoom(roomEditingId.value, payload)
      if (resp?.code === 0) roomDialogVisible.value = false
    } else {
      const resp = await roomService.createRoom(payload)
      if (resp?.code === 0) roomDialogVisible.value = false
    }
    await refresh()
  } finally {
    isSaving.value = false
  }
}

async function toggleRoomActive(row) {
  if (!row?.id) return
  const next = !row?.is_active
  deletingId.value = `room:${row.id}:toggle`
  try {
    await roomService.updateRoom(row.id, { is_active: next })
    await refreshRooms()
  } finally {
    deletingId.value = null
  }
}

async function removeRoom(row) {
  if (!row?.id) return
  deletingId.value = `room:${row.id}`
  try {
    await roomService.deleteRoom(row.id)
    await refreshRooms()
  } finally {
    deletingId.value = null
  }
}

watch(
  () => roomTypeKeyword.value,
  () => {
    roomTypePage.value = 1
    if (activeTab.value === 'room-types') refresh()
  }
)

watch(
  () => [roomTypePage.value, roomTypePageSize.value],
  () => {
    if (activeTab.value === 'room-types') refresh()
  }
)

watch(
  () => [roomFilters.value.buildingId, roomFilters.value.roomTypeId, roomFilters.value.keyword],
  () => {
    roomPage.value = 1
    if (activeTab.value === 'rooms') refresh()
  }
)

watch(
  () => [roomPage.value, roomPageSize.value],
  () => {
    if (activeTab.value === 'rooms') refresh()
  }
)

onMounted(async () => {
  const tab = String(route.query?.tab || 'room-types')
  activeTab.value = tab === 'rooms' ? 'rooms' : 'room-types'
  if (!route.query?.tab) {
    router.replace({ path: '/admin/resources', query: { tab: activeTab.value } })
  }
  await refresh()
})
</script>

<style scoped>
.page {
  padding: 20px;
}

.card {
  max-width: 1600px;
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

.tabs {
  margin-top: 4px;
}

.filters {
  margin-bottom: 12px;
}

.muted {
  color: #909399;
}

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
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

.audit-reason {
  margin-left: 10px;
  color: #606266;
}

.audit-admin {
  margin-top: 6px;
  font-size: 12px;
}
</style>

