<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>楼栋管理</span>
          <div class="header-actions">
            <el-button :loading="isLoading" @click="refresh">刷新</el-button>
            <el-button type="primary" @click="openCreate">新增楼栋</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="16" class="filters">
        <el-col :xs="24" :sm="12" :md="10">
          <el-input v-model="keyword" clearable placeholder="搜索：名称/描述" />
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
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm
              title="确认删除该楼栋？（楼栋下存在教室将无法删除）"
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

      <el-empty v-if="!isLoading && list.length === 0" description="暂无楼栋" />

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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="例如：1号楼/图书馆" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
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
import dayjs from 'dayjs'
import roomService from '@/service/roomService'

const isLoading = ref(false)
const isSaving = ref(false)
const deletingId = ref(null)

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const keyword = ref('')

function formatDateTime(v) {
  if (!v) return ''
  return dayjs(v).format('YYYY-MM-DD HH:mm')
}

async function refresh() {
  isLoading.value = true
  try {
    const resp = await roomService.getBuildings({
      page: page.value,
      pageSize: pageSize.value,
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
  description: ''
})
const dialogTitle = computed(() => (editingId.value ? '编辑楼栋' : '新增楼栋'))

function openCreate() {
  editingId.value = null
  form.value = { name: '', description: '' }
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row?.id || null
  form.value = { name: row?.name || '', description: row?.description || '' }
  dialogVisible.value = true
}

async function save() {
  const name = String(form.value.name || '').trim()
  if (!name) return
  isSaving.value = true
  try {
    if (editingId.value) {
      const resp = await roomService.updateBuilding(editingId.value, { name, description: form.value.description || '' })
      if (resp?.code === 0) dialogVisible.value = false
    } else {
      const resp = await roomService.createBuilding({ name, description: form.value.description || '' })
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
    await roomService.deleteBuilding(row.id)
    await refresh()
  } finally {
    deletingId.value = null
  }
}

watch(
  () => keyword.value,
  () => {
    page.value = 1
    refresh()
  }
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

.muted {
  color: #909399;
}

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>

