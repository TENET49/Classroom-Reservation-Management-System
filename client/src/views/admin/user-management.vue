<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>用户管理</span>
          <div class="header-actions">
            <el-button :loading="isLoading" @click="refresh">刷新</el-button>
            <el-button v-if="isSystemAdmin" type="primary" @click="openCreate">新增用户</el-button>
          </div>
        </div>
      </template>

      <el-empty v-if="!isSystemAdmin" description="仅系统管理员可访问" />

      <template v-else>
        <el-row :gutter="16" class="filters">
          <el-col :xs="24" :sm="12" :md="5">
            <el-select v-model="role" clearable placeholder="全部角色" style="width: 100%">
              <el-option label="学生" value="student" />
              <el-option label="教师" value="teacher" />
              <el-option label="管理员" value="admin" />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-input v-model="keyword" clearable placeholder="搜索：姓名/邮箱" />
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
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="用户" min-width="220">
            <template #default="{ row }">
              <div class="user-cell">
                <div class="user-name">{{ row?.name || '—' }}</div>
                <div class="user-sub">{{ row?.email || '—' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="角色" width="110">
            <template #default="{ row }">
              <el-tag :type="roleTagType(row?.role)" effect="plain">{{ roleText(row?.role) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="管理员类型" width="140">
            <template #default="{ row }">
              <template v-if="row?.role === 'admin'">
                <el-tag :type="row?.Admin?.is_system ? 'success' : 'warning'" effect="plain">
                  {{ row?.Admin?.is_system ? '系统管理员' : '楼栋管理员' }}
                </el-tag>
              </template>
              <span v-else class="muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="楼栋范围" min-width="260">
            <template #default="{ row }">
              <template v-if="row?.role === 'admin' && !row?.Admin?.is_system">
                <template v-if="buildingScopeNames(row).length > 0">
                  <el-tag v-for="n in buildingScopeNames(row)" :key="n" class="scope-tag" effect="plain">
                    {{ n }}
                  </el-tag>
                </template>
                <span v-else class="muted">未配置</span>
              </template>
              <span v-else class="muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openEdit(row)">编辑</el-button>
              <el-popconfirm title="确认删除该用户？" confirm-button-text="确认" cancel-button-text="取消" @confirm="remove(row)">
                <template #reference>
                  <el-button size="small" type="danger" :loading="deletingId === row.id">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!isLoading && list.length === 0" description="暂无用户" />

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
      </template>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" placeholder="例如：张三" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="form.email" placeholder="xxx@test.com" />
        </el-form-item>
        <el-form-item label="密码" :required="!editingId">
          <el-input v-model="form.password" placeholder="新增必填，编辑可留空" show-password />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>

        <template v-if="form.role === 'admin'">
          <el-form-item label="系统管理员">
            <el-switch v-model="form.is_system" />
          </el-form-item>
          <el-form-item v-if="!form.is_system" label="楼栋范围">
            <el-select v-model="form.buildingIds" multiple filterable placeholder="选择可管理楼栋" style="width: 100%">
              <el-option v-for="b in buildingOptions" :key="b.id" :label="b.name" :value="b.id" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSaving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import adminService from '@/service/adminService'
import roomService from '@/service/roomService'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()
const isSystemAdmin = computed(() => !!authStore.user?.Admin?.is_system)

const isLoading = ref(false)
const isSaving = ref(false)
const deletingId = ref(null)

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const role = ref(null)

const buildingOptions = ref([])
const buildingNameMap = computed(() => new Map((buildingOptions.value || []).map((b) => [b.id, b.name])))

function roleText(v) {
  if (v === 'student') return '学生'
  if (v === 'teacher') return '教师'
  if (v === 'admin') return '管理员'
  return v || '—'
}

function roleTagType(v) {
  if (v === 'admin') return 'danger'
  if (v === 'teacher') return 'success'
  if (v === 'student') return 'info'
  return 'info'
}

function buildingScopeNames(row) {
  const scopes = row?.Admin?.AdminScopes
  if (!Array.isArray(scopes)) return []
  const ids = scopes.filter((s) => s?.scope_type === 'building').map((s) => s.scope_id)
  const names = ids.map((id) => buildingNameMap.value.get(id) || `楼栋${id}`)
  return Array.from(new Set(names))
}

async function loadBuildings() {
  const resp = await roomService.getBuildings({ page: 1, pageSize: 200 })
  buildingOptions.value = resp?.code === 0 ? resp?.data?.list || [] : []
}

async function refresh() {
  if (!isSystemAdmin.value) return
  isLoading.value = true
  try {
    const resp = await adminService.getManagedUsers({
      page: page.value,
      pageSize: pageSize.value,
      role: role.value || undefined,
      keyword: keyword.value || undefined
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
const editingId = ref(null)
const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'student',
  is_system: false,
  buildingIds: []
})

const dialogTitle = computed(() => (editingId.value ? '编辑用户' : '新增用户'))

function openCreate() {
  editingId.value = null
  form.value = { name: '', email: '', password: '', role: 'student', is_system: false, buildingIds: [] }
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row?.id || null
  const admin = row?.Admin
  const scopes = Array.isArray(admin?.AdminScopes) ? admin.AdminScopes : []
  const buildingIds = scopes.filter((s) => s?.scope_type === 'building').map((s) => s.scope_id)
  form.value = {
    name: row?.name || '',
    email: row?.email || '',
    password: '',
    role: row?.role || 'student',
    is_system: !!admin?.is_system,
    buildingIds: Array.from(new Set(buildingIds))
  }
  dialogVisible.value = true
}

async function save() {
  const name = String(form.value.name || '').trim()
  const email = String(form.value.email || '').trim()
  const roleValue = form.value.role
  if (!name || !email || !roleValue) return
  if (!editingId.value && !form.value.password) return

  isSaving.value = true
  try {
    const payload = {
      name,
      email,
      role: roleValue
    }
    if (form.value.password) payload.password = form.value.password
    if (roleValue === 'admin') {
      payload.is_system = !!form.value.is_system
      payload.buildingIds = Array.isArray(form.value.buildingIds) ? form.value.buildingIds : []
    }

    if (editingId.value) {
      const resp = await adminService.updateManagedUser(editingId.value, payload)
      if (resp?.code === 0) dialogVisible.value = false
    } else {
      const resp = await adminService.createManagedUser(payload)
      if (resp?.code === 0) dialogVisible.value = false
    }
    await refresh()
  } finally {
    isSaving.value = false
  }
}

async function remove(row) {
  if (!row?.id) return
  deletingId.value = row.id
  try {
    await adminService.deleteManagedUser(row.id)
    await refresh()
  } finally {
    deletingId.value = null
  }
}

watch(
  () => [keyword.value, role.value],
  () => {
    page.value = 1
    refresh()
  }
)

onMounted(async () => {
  if (!isSystemAdmin.value) return
  await loadBuildings()
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
  font-size: 12px;
  color: #909399;
}

.scope-tag {
  margin-right: 6px;
  margin-bottom: 6px;
}
</style>

