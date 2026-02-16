<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>导入教师占用事项</span>
          <div class="header-actions">
            <el-button @click="fillExample">填充示例</el-button>
            <el-button @click="clearAll">清空</el-button>
            <el-button type="primary" :loading="isImporting" :disabled="records.length === 0" @click="importData">
              开始导入
            </el-button>
          </div>
        </div>
      </template>

      <el-alert
        title="支持表格录入与 JSON 导入两种方式，最后点击“开始导入”。"
        type="info"
        show-icon
        :closable="false"
        class="tip"
      />

      <el-tabs v-model="activeMode" class="tabs">
        <el-tab-pane label="表格录入" name="table">
          <div class="table-actions">
            <el-button type="primary" plain @click="addRow">新增一行</el-button>
            <el-button plain :disabled="records.length === 0" @click="copyLastRow">复制上一行</el-button>
            <div class="muted">记录数：{{ records.length }}</div>
          </div>

          <el-table
            :data="records"
            stripe
            style="width: 100%"
            :height="560"
            table-layout="auto"
            scrollbar-always-on
          >
            <el-table-column label="教师" min-width="240">
              <template #default="{ row }">
                <el-select v-model="row.teacher_id" filterable placeholder="选择教师" style="width: 100%">
                  <el-option v-for="t in teacherOptions" :key="t.id" :label="t.label" :value="t.id" />
                </el-select>
              </template>
            </el-table-column>

            <el-table-column label="日期" width="140">
              <template #default="{ row }">
                <el-date-picker v-model="row.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
              </template>
            </el-table-column>

            <el-table-column label="节次" width="180">
              <template #default="{ row }">
                <el-select v-model="row.time_slot_id" placeholder="选择节次" style="width: 100%">
                  <el-option v-for="ts in timeSlotOptions" :key="ts.id" :label="ts.label" :value="ts.id" />
                </el-select>
              </template>
            </el-table-column>

            <el-table-column label="事项名" min-width="220">
              <template #default="{ row }">
                <el-input v-model="row.course_name" placeholder="例如：监考/会议" />
              </template>
            </el-table-column>

            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ $index }">
                <el-button type="danger" link @click="removeRow($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="records.length === 0" description="暂无导入数据" />
        </el-tab-pane>

        <el-tab-pane label="JSON 导入" name="json">
          <el-alert
            title="可粘贴 JSON 数组解析后，再“追加/替换”到表格里。字段支持 teacher_id/date/time_slot_id/course_name。"
            type="warning"
            show-icon
            :closable="false"
            class="tip"
          />

          <el-row :gutter="12" class="json-area">
            <el-col :xs="24" :md="12">
              <el-input
                v-model="rawText"
                type="textarea"
                :rows="18"
                placeholder='例如：[{"teacher_id":3,"date":"2026-02-15","time_slot_id":1,"course_name":"监考"}]'
              />
              <div class="json-actions">
                <el-button type="primary" @click="parseJson">解析预览</el-button>
              </div>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-card shadow="never" class="preview-card">
                <template #header>
                  <div class="sub-header">
                    <span>预览</span>
                    <span class="muted">记录数：{{ parsedRecords.length }}</span>
                  </div>
                </template>

                <el-table :data="parsedRecords" stripe style="width: 100%" :height="380" table-layout="auto">
                  <el-table-column prop="teacher_id" label="teacher_id" width="100" />
                  <el-table-column prop="date" label="date" width="120" />
                  <el-table-column prop="time_slot_id" label="time_slot_id" width="110" />
                  <el-table-column prop="course_name" label="course_name" min-width="160" />
                </el-table>

                <el-empty v-if="parsedRecords.length === 0" description="暂无预览数据" />
              </el-card>

              <div class="json-apply">
                <el-button :disabled="parsedRecords.length === 0" @click="appendParsed">追加到表格</el-button>
                <el-button type="danger" plain :disabled="parsedRecords.length === 0" @click="replaceWithParsed">
                  替换表格
                </el-button>
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>

      <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon class="tip" />
      <el-alert v-if="successMsg" :title="successMsg" type="success" show-icon class="tip" />
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import adminService from '@/service/adminService'

const activeMode = ref('table')

const rawText = ref('')
const records = ref([])
const parsedRecords = ref([])
const errorMsg = ref('')
const successMsg = ref('')
const isImporting = ref(false)

function clearAll() {
  rawText.value = ''
  records.value = []
  parsedRecords.value = []
  errorMsg.value = ''
  successMsg.value = ''
}

function fillExample() {
  records.value = [
    { teacher_id: null, date: '2026-02-15', time_slot_id: 1, course_name: '监考' },
    { teacher_id: null, date: '2026-02-16', time_slot_id: 2, course_name: '会议（示例）' }
  ]
}

function normalizeRecord(x) {
  return {
    teacher_id: x?.teacher_id ?? x?.teacherId ?? null,
    date: x?.date ?? '',
    time_slot_id: x?.time_slot_id ?? x?.timeSlotId ?? null,
    course_name: x?.course_name ?? x?.courseName ?? ''
  }
}

function validateRecord(x, idx) {
  if (!x.teacher_id) return `第 ${idx + 1} 条缺少 teacher_id`
  if (!x.date) return `第 ${idx + 1} 条缺少 date`
  if (!x.time_slot_id) return `第 ${idx + 1} 条缺少 time_slot_id`
  if (!x.course_name) return `第 ${idx + 1} 条缺少 course_name`
  return ''
}

function parseJson() {
  errorMsg.value = ''
  successMsg.value = ''
  parsedRecords.value = []
  try {
    const parsed = JSON.parse(rawText.value || '[]')
    if (!Array.isArray(parsed)) {
      errorMsg.value = '请输入 JSON 数组'
      return
    }
    const normalized = parsed.map(normalizeRecord)
    for (let i = 0; i < normalized.length; i++) {
      const err = validateRecord(normalized[i], i)
      if (err) {
        errorMsg.value = err
        return
      }
    }
    parsedRecords.value = normalized
  } catch (e) {
    errorMsg.value = 'JSON 解析失败，请检查格式'
  }
}

function appendParsed() {
  if (parsedRecords.value.length === 0) return
  records.value.push(...parsedRecords.value.map((x) => ({ ...x })))
  activeMode.value = 'table'
}

function replaceWithParsed() {
  if (parsedRecords.value.length === 0) return
  records.value = parsedRecords.value.map((x) => ({ ...x }))
  activeMode.value = 'table'
}

function addRow() {
  records.value.push({ teacher_id: null, date: '', time_slot_id: null, course_name: '' })
}

function copyLastRow() {
  if (records.value.length === 0) return
  const last = records.value[records.value.length - 1]
  records.value.push({
    teacher_id: last.teacher_id ?? null,
    date: last.date ?? '',
    time_slot_id: last.time_slot_id ?? null,
    course_name: last.course_name ?? ''
  })
}

function removeRow(idx) {
  records.value.splice(idx, 1)
}

const timeSlotOptions = [
  { id: 1, label: '第1–2节（08:00-09:35）' },
  { id: 2, label: '第3–4节（09:55-11:30）' },
  { id: 3, label: '第5–6节（14:00-15:35）' },
  { id: 4, label: '第7–8节（15:55-17:30）' },
  { id: 5, label: '晚自习（19:00-21:00）' },
]

const teacherOptions = ref([])

async function loadTeacherOptions() {
  const resp = await adminService.getUsers({ role: 'teacher' })
  const teachers = resp?.code === 0 ? resp?.data?.list || [] : []
  teacherOptions.value = teachers.map((u) => ({
    id: u.id,
    label: `${u.name}${u.email ? `（${u.email}）` : ''}`
  }))
}

async function importData() {
  if (records.value.length === 0) return
  isImporting.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    for (let i = 0; i < records.value.length; i++) {
      const err = validateRecord(records.value[i], i)
      if (err) {
        errorMsg.value = err
        return
      }
    }
    const resp = await adminService.importTeacherSchedules(records.value)
    if (resp?.code === 0) {
      successMsg.value = `导入成功：${records.value.length} 条`
    } else {
      errorMsg.value = resp?.msg || '导入失败'
    }
  } catch (e) {
    errorMsg.value = '导入失败'
  } finally {
    isImporting.value = false
  }
}

onMounted(async () => {
  await loadTeacherOptions()
  addRow()
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

.tip {
  margin-bottom: 12px;
}

.tabs {
  margin-top: 4px;
}

.table-actions {
  margin-bottom: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.table-actions .muted {
  margin-left: auto;
}

.json-area {
  margin-bottom: 12px;
}

.json-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.preview-card {
  height: 100%;
}

.json-apply {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.sub-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.muted {
  color: #909399;
  font-weight: normal;
}
</style>
