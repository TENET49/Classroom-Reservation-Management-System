<template>
  <div class="page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="header">
          <span>使用率统计</span>
          <div class="header-actions">
            <el-button :loading="isLoading" @click="refresh">刷新</el-button>
            <el-button
              v-if="activeTab === 'export'"
              type="primary"
              :loading="isExporting"
              :disabled="!canExport"
              @click="exportCsv"
            >
              导出 CSV
            </el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="16" class="filters">
        <el-col :xs="24" :sm="24" :md="10">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-col>
        <el-col :xs="24" :sm="24" :md="14" class="quick">
          <el-button @click="setPreset(7)">近7天</el-button>
          <el-button @click="setPreset(30)">近30天</el-button>
          <el-button @click="setPreset(90)">近90天</el-button>
        </el-col>
      </el-row>

      <el-tabs v-model="activeTab" class="tabs" @tab-change="handleTabChange">
        <el-tab-pane label="使用率报表" name="usage">
          <el-row :gutter="16" class="filters">
            <el-col :xs="24" :sm="12" :md="6">
              <el-select v-model="groupBy" style="width: 100%">
                <el-option label="按教室类型" value="roomType" />
                <el-option label="按楼栋" value="building" />
                <el-option label="按星期" value="weekday" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="12" :md="5">
              <el-select v-model="usageFilters.buildingId" clearable placeholder="全部楼栋" style="width: 100%">
                <el-option v-for="b in buildingOptions" :key="b.id" :label="b.name" :value="b.id" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="12" :md="5">
              <el-select v-model="usageFilters.roomTypeId" clearable placeholder="全部类型" style="width: 100%">
                <el-option v-for="t in roomTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="24" :md="8" class="muted kpi-sub">
              统计口径：已通过预约次数（使用率为简化统计）
            </el-col>
          </el-row>

          <el-row :gutter="16" class="kpis">
            <el-col :xs="24" :sm="8" :md="8">
              <el-card shadow="never" class="kpi-card">
                <div class="kpi-title">今日预约数</div>
                <div class="kpi-value">{{ todayReservationCount }}</div>
                <div class="muted kpi-desc">{{ todayText }}</div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="8" :md="8">
              <el-card shadow="never" class="kpi-card">
                <div class="kpi-title">预约通过率</div>
                <div class="kpi-value">{{ approvalRateText }}</div>
                <div class="muted kpi-desc">近7天（通过 / 总预约）</div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="8" :md="8">
              <el-card shadow="never" class="kpi-card">
                <div class="kpi-title">活跃用户数</div>
                <div class="kpi-value">{{ activeUserCount }}</div>
                <div class="muted kpi-desc">近7天有预约的用户</div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="16" class="trend-row">
            <el-col :xs="24">
              <el-card shadow="never" class="sub-card">
                <template #header>
                  <div class="sub-header">
                    <span>预约趋势（按星期占比）</span>
                    <span class="muted">{{ startDate }} 至 {{ endDate }}</span>
                  </div>
                </template>
                <div ref="trendRef" class="trend"></div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :md="14">
              <el-card shadow="never" class="sub-card">
                <template #header>
                  <div class="sub-header">
                    <span>{{ titleText }}</span>
                    <span class="muted">总计：{{ totalCount }}</span>
                  </div>
                </template>
                <div ref="chartRef" class="chart"></div>
              </el-card>
            </el-col>
            <el-col :xs="24" :md="10">
              <el-card shadow="never" class="sub-card">
                <template #header>
                  <div class="sub-header">
                    <span>明细</span>
                    <span class="muted">{{ startDate }} 至 {{ endDate }}</span>
                  </div>
                </template>
                <el-table :data="tableRows" stripe style="width: 100%" table-layout="auto" :height="420">
                  <el-table-column prop="label" :label="dimensionHeader" min-width="120" />
                  <el-table-column prop="count" label="次数" width="90" />
                  <el-table-column prop="percentText" label="占比" width="90" />
                </el-table>
                <el-empty v-if="!isLoading && tableRows.length === 0" description="暂无数据" />
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="预约记录导出" name="export">
          <el-row :gutter="16" class="filters">
            <el-col :xs="24" :sm="12" :md="4">
              <el-select v-model="exportFilters.status" clearable placeholder="全部状态" style="width: 100%">
                <el-option label="待审核" value="pending" />
                <el-option label="已通过" value="approved" />
                <el-option label="已驳回" value="rejected" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="12" :md="5">
              <el-select v-model="exportFilters.buildingId" clearable placeholder="全部楼栋" style="width: 100%">
                <el-option v-for="b in buildingOptions" :key="b.id" :label="b.name" :value="b.id" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="12" :md="5">
              <el-select v-model="exportFilters.roomTypeId" clearable placeholder="全部类型" style="width: 100%">
                <el-option v-for="t in roomTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="24" :md="10">
              <el-input v-model="exportFilters.keyword" clearable placeholder="搜索：教室号/姓名/邮箱" />
            </el-col>
          </el-row>

          <el-table
            v-loading="isLoading"
            :data="exportList"
            stripe
            style="width: 100%"
            :height="560"
            table-layout="auto"
            scrollbar-always-on
          >
            <el-table-column prop="date" label="日期" width="130" />
            <el-table-column label="节次" width="160">
              <template #default="{ row }">
                <span>{{ formatTimeSlot(row) }}</span>
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
            <el-table-column label="申请人" width="180">
              <template #default="{ row }">
                <div class="user-cell">
                  <div class="user-name">{{ row?.User?.name || '—' }}</div>
                  <div class="user-sub">{{ row?.User?.email || '—' }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="人数" width="90">
              <template #default="{ row }">
                <span>{{ row.people_count ?? '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" effect="plain">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最新审核" min-width="260">
              <template #default="{ row }">
                <template v-if="latestAudit(row)">
                  <el-tag :type="latestAudit(row).action === 'approve' ? 'success' : 'danger'" effect="plain">
                    {{ latestAudit(row).action === 'approve' ? '通过' : '驳回' }}
                  </el-tag>
                  <span class="audit-reason">{{ latestAudit(row).reason || '—' }}</span>
                  <div class="audit-admin muted" v-if="auditAdminName(row)">
                    审核人：{{ auditAdminName(row) }}{{ auditAdminEmail(row) ? `（${auditAdminEmail(row)}）` : '' }}
                  </div>
                </template>
                <template v-else>
                  <span class="muted">—</span>
                </template>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!isLoading && exportList.length === 0" description="暂无数据" />

          <div class="pager">
            <el-pagination
              v-model:current-page="exportPage"
              v-model:page-size="exportPageSize"
              :total="exportTotal"
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
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import adminService from '@/service/adminService'
import roomService from '@/service/roomService'

const isLoading = ref(false)
const isExporting = ref(false)

const router = useRouter()
const route = useRoute()

const activeTab = ref('usage')

const groupBy = ref('roomType')
const chartRef = ref(null)
let chartInstance = null

const trendRef = ref(null)
let trendInstance = null

const dateRange = ref([dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')])
const stats = ref([])
const dashboard = ref({
  todayReservationCount: 0,
  totalReservations: 0,
  approvedReservations: 0,
  activeUserCount: 0,
  weekdayStats: [],
})

const usageFilters = ref({
  buildingId: null,
  roomTypeId: null,
})

const exportFilters = ref({
  status: null,
  buildingId: null,
  roomTypeId: null,
  keyword: '',
})

const exportPage = ref(1)
const exportPageSize = ref(50)
const exportTotal = ref(0)
const exportList = ref([])

const buildingOptions = ref([])
const roomTypeOptions = ref([])

const startDate = computed(() => (Array.isArray(dateRange.value) ? dateRange.value[0] : ''))
const endDate = computed(() => (Array.isArray(dateRange.value) ? dateRange.value[1] : ''))

const canExport = computed(() => !!startDate.value && !!endDate.value)

const todayText = computed(() => dayjs().format('YYYY-MM-DD'))

const todayReservationCount = computed(() => Number(dashboard.value.todayReservationCount || 0))
const activeUserCount = computed(() => Number(dashboard.value.activeUserCount || 0))
const approvalRateText = computed(() => {
  const total = Number(dashboard.value.totalReservations || 0)
  if (!total) return '—'
  const approved = Number(dashboard.value.approvedReservations || 0)
  const p = (approved / total) * 100
  return `${p.toFixed(1)}%`
})

const titleText = computed(() => {
  if (groupBy.value === 'building') return '教室使用分布（按楼栋）'
  if (groupBy.value === 'weekday') return '教室使用分布（按星期）'
  return '教室使用分布（按教室类型）'
})

const dimensionHeader = computed(() => {
  if (groupBy.value === 'building') return '楼栋'
  if (groupBy.value === 'weekday') return '星期'
  return '教室类型'
})

const normalizedStats = computed(() => {
  const arr = Array.isArray(stats.value) ? stats.value : []
  return arr.map((x) => ({
    label: x?.label || x?.roomTypeName || x?.buildingName || x?.weekdayName || '—',
    count: Number(x?.count || 0),
  }))
})

const totalCount = computed(() => normalizedStats.value.reduce((sum, x) => sum + (x.count || 0), 0))

const tableRows = computed(() => {
  const total = totalCount.value || 0
  return normalizedStats.value.map((x) => {
    const p = total > 0 ? (x.count / total) * 100 : 0
    return {
      ...x,
      percentText: `${p.toFixed(1)}%`,
    }
  })
})

function setPreset(days) {
  dateRange.value = [dayjs().subtract(days, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]
}

function ensureChart() {
  if (!chartRef.value) return null
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)
  return chartInstance
}

function ensureTrendChart() {
  if (!trendRef.value) return null
  if (!trendInstance) trendInstance = echarts.init(trendRef.value)
  return trendInstance
}

function renderChart() {
  const chart = ensureChart()
  if (!chart) return

  const data = normalizedStats.value
  if (data.length === 0) {
    chart.clear()
    return
  }

  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}<br/>次数：{c}<br/>占比：{d}%' },
    legend: { top: 0 },
    series: [
      {
        type: 'pie',
        radius: ['35%', '70%'],
        avoidLabelOverlap: true,
        label: { formatter: '{b}: {c} ({d}%)' },
        data: data.map((x) => ({ name: x.label, value: x.count })),
      },
    ],
  })
}

function renderTrend() {
  const chart = ensureTrendChart()
  if (!chart) return
  const series = Array.isArray(dashboard.value.weekdayStats) ? dashboard.value.weekdayStats : []
  const total = series.reduce((sum, x) => sum + (Number(x?.count) || 0), 0)
  const percents = series.map((x) => {
    const c = Number(x?.count) || 0
    return total > 0 ? (c / total) * 100 : 0
  })
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = Array.isArray(params) && params.length > 0 ? params[0] : null
        if (!p) return ''
        const idx = p.dataIndex
        const count = Number(series?.[idx]?.count) || 0
        const percent = Number.isFinite(percents[idx]) ? percents[idx] : 0
        return `${p.axisValue}<br/>预约数：${count}<br/>占比：${percent.toFixed(1)}%`
      },
    },
    grid: { left: 20, right: 20, top: 20, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: series.map((x) => x.weekdayName || x.label || '—'),
      axisLabel: { interval: 0, rotate: 0 },
    },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        type: 'bar',
        data: percents,
        barMaxWidth: 36,
      },
    ],
  })
}

async function refresh() {
  if (activeTab.value === 'export') return refreshExport()
  return refreshUsage()
}

async function refreshDashboard() {
  const resp = await adminService.getDashboardStats({
    startDate: startDate.value,
    endDate: endDate.value,
    buildingId: usageFilters.value.buildingId || undefined,
    roomTypeId: usageFilters.value.roomTypeId || undefined,
    today: dayjs().format('YYYY-MM-DD'),
  })
  dashboard.value =
    resp?.code === 0
      ? resp?.data || {
          todayReservationCount: 0,
          totalReservations: 0,
          approvedReservations: 0,
          activeUserCount: 0,
          weekdayStats: [],
        }
      : {
          todayReservationCount: 0,
          totalReservations: 0,
          approvedReservations: 0,
          activeUserCount: 0,
          weekdayStats: [],
        }
}

async function refreshUsage() {
  if (!startDate.value || !endDate.value) return
  isLoading.value = true
  try {
    const [usageResp] = await Promise.all([
      adminService.getUsageStats({
        startDate: startDate.value,
        endDate: endDate.value,
        groupBy: groupBy.value,
        buildingId: usageFilters.value.buildingId || undefined,
        roomTypeId: usageFilters.value.roomTypeId || undefined,
      }),
      refreshDashboard(),
    ])
    stats.value = usageResp?.code === 0 ? usageResp?.data || [] : []
  } catch (e) {
    stats.value = []
    dashboard.value = {
      todayReservationCount: 0,
      totalReservations: 0,
      approvedReservations: 0,
      activeUserCount: 0,
      weekdayStats: [],
    }
  } finally {
    isLoading.value = false
    renderChart()
    renderTrend()
  }
}

async function refreshExport() {
  if (!startDate.value || !endDate.value) return
  isLoading.value = true
  try {
    const resp = await adminService.exportReservationRecords({
      startDate: startDate.value,
      endDate: endDate.value,
      status: exportFilters.value.status || undefined,
      buildingId: exportFilters.value.buildingId || undefined,
      roomTypeId: exportFilters.value.roomTypeId || undefined,
      keyword: exportFilters.value.keyword || undefined,
      page: exportPage.value,
      pageSize: exportPageSize.value,
      exportAll: false,
    })
    if (resp?.code === 0) {
      exportList.value = resp?.data?.list || []
      exportTotal.value = resp?.data?.total || 0
    } else {
      exportList.value = []
      exportTotal.value = 0
    }
  } catch (e) {
    exportList.value = []
    exportTotal.value = 0
  } finally {
    isLoading.value = false
  }
}

function latestAudit(row) {
  const a1 = row?.ReservationAudits
  if (Array.isArray(a1) && a1.length > 0) return a1[0]
  const a2 = row?.ReservationAudit
  if (Array.isArray(a2) && a2.length > 0) return a2[0]
  return null
}

function auditAdminName(row) {
  const a = latestAudit(row)
  return a?.Admin?.User?.name || ''
}

function auditAdminEmail(row) {
  const a = latestAudit(row)
  return a?.Admin?.User?.email || ''
}

function statusText(v) {
  if (v === 'pending') return '待审核'
  if (v === 'approved') return '已通过'
  if (v === 'rejected') return '已驳回'
  if (v === 'cancelled') return '已取消'
  return v || '—'
}

function statusTagType(v) {
  if (v === 'pending') return 'warning'
  if (v === 'approved') return 'success'
  if (v === 'rejected') return 'danger'
  if (v === 'cancelled') return 'info'
  return 'info'
}

function formatTimeSlot(row) {
  const ts = row?.TimeSlot
  if (!ts) return row?.time_slot_id ? `节次${row.time_slot_id}` : '—'
  const s = ts.start_time || ''
  const e = ts.end_time || ''
  if (!s && !e) return row?.time_slot_id ? `节次${row.time_slot_id}` : '—'
  return `${s} - ${e}`
}

function escapeCsv(v) {
  const s = String(v ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`
  return s
}

function buildCsv(rows) {
  const headers = [
    '预约ID',
    '日期',
    '节次',
    '楼栋',
    '教室',
    '教室类型',
    '人数',
    '状态',
    '申请人姓名',
    '申请人邮箱',
    '审核结果',
    '审核理由',
    '审核人姓名',
    '审核人邮箱',
    '审核时间',
  ]
  const lines = [headers.map(escapeCsv).join(',')]
  for (const r of rows) {
    const a = latestAudit(r)
    const auditResult = a?.action ? (a.action === 'approve' ? '通过' : '驳回') : ''
    const auditTime = a?.createdAt || a?.created_at || ''
    lines.push(
      [
        r?.id ?? '',
        r?.date ?? '',
        formatTimeSlot(r),
        r?.Room?.Building?.name ?? '',
        r?.Room?.room_number ?? '',
        r?.Room?.RoomType?.name ?? '',
        r?.people_count ?? '',
        statusText(r?.status),
        r?.User?.name ?? '',
        r?.User?.email ?? '',
        auditResult,
        a?.reason ?? '',
        a?.Admin?.User?.name ?? '',
        a?.Admin?.User?.email ?? '',
        auditTime ? dayjs(auditTime).format('YYYY-MM-DD HH:mm') : '',
      ]
        .map(escapeCsv)
        .join(','),
    )
  }
  return '\uFEFF' + lines.join('\n')
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function exportCsv() {
  if (!canExport.value) return
  isExporting.value = true
  try {
    const resp = await adminService.exportReservationRecords({
      startDate: startDate.value,
      endDate: endDate.value,
      status: exportFilters.value.status || undefined,
      buildingId: exportFilters.value.buildingId || undefined,
      roomTypeId: exportFilters.value.roomTypeId || undefined,
      keyword: exportFilters.value.keyword || undefined,
      exportAll: true,
      page: 1,
      pageSize: 200,
    })
    const rows = resp?.code === 0 ? resp?.data?.list || [] : []
    const csv = buildCsv(rows)
    downloadText(`预约记录_${startDate.value}_${endDate.value}.csv`, csv)
  } finally {
    isExporting.value = false
  }
}

function handleResize() {
  if (chartInstance) chartInstance.resize()
  if (trendInstance) trendInstance.resize()
}

watch([normalizedStats], () => renderChart())

watch(
  () => [dateRange.value, groupBy.value, usageFilters.value.buildingId, usageFilters.value.roomTypeId],
  () => {
    if (activeTab.value === 'usage') refreshUsage()
  },
)

watch(
  () => [
    exportFilters.value.status,
    exportFilters.value.buildingId,
    exportFilters.value.roomTypeId,
    exportFilters.value.keyword,
  ],
  () => {
    exportPage.value = 1
    if (activeTab.value === 'export') refreshExport()
  },
)

watch(
  () => [exportPage.value, exportPageSize.value],
  () => {
    if (activeTab.value === 'export') refreshExport()
  },
)

function handleTabChange(name) {
  const tab = String(name || 'usage')
  router.replace({ path: '/admin/statistics', query: { tab } })
  activeTab.value = tab
  refresh()
}

onMounted(async () => {
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

  const tab = String(route.query?.tab || 'usage')
  activeTab.value = tab === 'export' ? 'export' : 'usage'
  if (!route.query?.tab) {
    router.replace({ path: '/admin/statistics', query: { tab: activeTab.value } })
  }

  await refresh()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  if (trendInstance) {
    trendInstance.dispose()
    trendInstance = null
  }
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

.quick {
  display: flex;
  gap: 10px;
  align-items: center;
}

.sub-card {
  height: 100%;
}

.sub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.muted {
  color: #909399;
  font-weight: normal;
}

.tabs {
  margin-top: 4px;
}

.kpi-sub {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.kpis {
  margin-bottom: 12px;
}

.kpi-card {
  height: 100%;
}

.kpi-title {
  font-weight: 600;
  color: #303133;
}

.kpi-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
}

.kpi-desc {
  margin-top: 6px;
  font-size: 12px;
}

.trend-row {
  margin-bottom: 12px;
}

.trend {
  height: 260px;
}

.chart {
  height: 420px;
}

.chart {
  width: 100%;
  height: 420px;
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
