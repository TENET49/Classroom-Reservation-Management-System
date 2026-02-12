<template>
  <div class="dashboard-container">
    <!-- 第一屏：核心卡片区 -->
    <el-row :gutter="20" class="card-section">
      <!-- 普通用户视图 -->
      <template v-if="!isAdmin">
        <el-col :xs="24" :sm="12" :md="6" v-for="(card, index) in userCards" :key="index">
          <el-card class="dashboard-card" shadow="hover" @click="handleCardClick(card.action)">
            <template #header>
              <div class="card-header">
                <span class="card-title">{{ card.title }}</span>
                <el-icon class="card-icon" :size="20"><component :is="card.icon" /></el-icon>
              </div>
            </template>
            <template v-if="card.items?.length">
              <p v-for="(item, i) in card.items" :key="i" class="card-item">{{ item }}</p>
            </template>
            <p v-else class="card-content">{{ card.content }}</p>
            <template v-if="card.footer" #footer>{{ card.footer }}</template>
          </el-card>
        </el-col>
      </template>

      <!-- 管理员视图 -->
      <template v-else>
        <el-col :xs="24" :sm="12" :md="6" v-for="(card, index) in adminCards" :key="index">
          <el-card class="dashboard-card" shadow="hover" @click="handleCardClick(card.action)">
            <template #header>
              <div class="card-header">
                <span class="card-title">{{ card.title }}</span>
                <el-tag v-if="card.badge" type="danger" effect="dark" round size="small">{{ card.badge }}</el-tag>
              </div>
            </template>
            <template v-if="card.items?.length">
              <p v-for="(item, i) in card.items" :key="i" class="card-item">{{ item }}</p>
            </template>
            <p v-else class="card-content">{{ card.content }}</p>
            <template v-if="card.footer" #footer>{{ card.footer }}</template>
          </el-card>
        </el-col>
      </template>
    </el-row>

    <!-- 第二屏：可视化概览 -->
    <el-row :gutter="20" class="chart-section">
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="chart-header">
              <span>本周教室占用概览</span>
              <el-radio-group v-model="chartView" size="small">
                <el-radio-button label="week">周视图</el-radio-button>
                <el-radio-button label="day">日视图</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="heatmapChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <span>预约状态分布</span>
          </template>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第三屏：快捷功能 + 最近操作 -->
    <el-row :gutter="20" class="action-log-section">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>快捷功能</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" icon="Search" size="large" @click="router.push('/classroom/search')"
              >查询可用教室</el-button
            >
            <el-button type="success" icon="Plus" size="large" @click="router.push('/reservation/create')"
              >发起预约</el-button
            >
            <el-button type="warning" icon="Printer" size="large">打印预约单</el-button>
            <el-button v-if="isAdmin" type="info" icon="Upload" size="large">导入课表</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>最近操作记录</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in activities"
              :key="index"
              :timestamp="activity.timestamp"
              :type="activity.type"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部 -->
    <div class="footer-section">
      <el-alert
        title="系统通知：本周六图书馆三楼机房进行系统维护，暂停预约。"
        type="warning"
        show-icon
        :closable="false"
        class="system-notice"
      />
      <div class="copyright"> © 2026 教室预约管理系统 v1.0.0 | <el-link type="primary">联系管理员</el-link> </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import * as echarts from 'echarts'
import {
  Calendar,
  Search,
  Trophy,
  Bell,
  List,
  DataAnalysis,
  Warning,
  TrendCharts,
  Plus,
  Printer,
  Upload,
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

// 判断是否为管理员
const isAdmin = computed(() => authStore.user?.role === 'admin')

// --- 数据 Mock ---
// 模拟的数据

// 普通用户卡片
const userCards = [
  {
    title: '今日/本周我的预约',
    icon: Calendar,
    items: ['今天：暂无预约', '未来7天：3条预约', '最近一条：3号楼-201（已通过）'],
    footer: '查看我的预约',
    action: '/my-reservation',
  },
  {
    title: '快速查找可用教室',
    icon: Search,
    items: ['日期：今天', '节次：第三大节', '类型：多媒体', '人数：30'],
    footer: '进入查询页面',
    action: '/classroom/search',
  },
  {
    title: '当前推荐教室',
    icon: Trophy,
    items: ['3号楼-302（空闲）', '1号楼-105（容量60）', '图书馆-4F 机房（空闲）'],
    footer: '查看教室详情',
    action: '/classroom/detail/1',
  },
  {
    title: '系统通知 / 我的待办',
    icon: Bell,
    items: ['预约已通过：3号楼-201', '驳回原因：时间冲突（示例）', '临时通知：周六维护暂停预约'],
    footer: '查看通知中心',
    action: '/notifications',
  },
]

// 管理员卡片
const adminCards = [
  {
    title: '待审核预约',
    badge: '12',
    items: ['最新：3号楼-201（教师）', '最新：1号楼-105（学生）', '最新：图书馆-4F（社团）', '更多请进入列表查看'],
    footer: '全部待办',
    action: '/admin/audit',
  },
  {
    title: '教室占用总览（今日/本周）',
    items: ['已占用：68%', '课程：40% / 预约：28%', '空闲：32%'],
    footer: '查看占用总览',
    action: '/admin/occupancy',
  },
  {
    title: '异常教室（维修/禁用）',
    items: ['1号楼-205（维修至周五）', '3号楼-102（禁用至周四）'],
    footer: '进入状态维护',
    action: '/admin/maintenance',
  },
  {
    title: '本周利用率 Top/最低',
    items: ['Top1：1号楼机房', 'Top2：3号楼多媒体', '最低：7号楼-101'],
    footer: '查看使用率统计',
    action: '/admin/statistics',
  },
]

// 最近操作日志
const activities = [
  { content: '您提交了 3号楼-201 的预约申请', timestamp: '2026-02-12 10:00', type: 'primary' },
  { content: '管理员通过了您的预约申请', timestamp: '2026-02-11 15:30', type: 'success' },
  { content: '您取消了 5号楼-101 的预约', timestamp: '2026-02-10 09:15', type: 'warning' },
]

// --- 图表相关 ---
const heatmapChartRef = ref(null)
const pieChartRef = ref(null)
const chartView = ref('week')

const initCharts = () => {
  if (!heatmapChartRef.value || !pieChartRef.value) return

  // 1. 初始化热力图 (模拟课表/占用视图)
  const heatmapChart = echarts.init(heatmapChartRef.value)

  // 模拟数据：周一到周日，每天5大节课
  const hours = ['第一大节', '第二大节', '第三大节', '第四大节', '晚自习']
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  // 0:空闲, 1:课程, 2:预约, 3:维修
  const data = [
    [0, 0, 1],
    [0, 1, 0],
    [0, 2, 0],
    [0, 3, 0],
    [0, 4, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 2, 0],
    [1, 3, 0],
    [1, 4, 0],
    [2, 0, 1],
    [2, 1, 1],
    [2, 2, 0],
    [2, 3, 1],
    [2, 4, 1],
    [3, 0, 1],
    [3, 1, 2],
    [3, 2, 0],
    [3, 3, 2],
    [3, 4, 1],
    [4, 0, 1],
    [4, 1, 1],
    [4, 2, 0],
    [4, 3, 1],
    [4, 4, 1],
    [5, 0, 0],
    [5, 1, 0],
    [5, 2, 0],
    [5, 3, 0],
    [5, 4, 0],
    [6, 0, 0],
    [6, 1, 0],
    [6, 2, 0],
    [6, 3, 0],
    [6, 4, 0],
  ]

  data.forEach(function (item) {
    // 随机生成一些状态用于演示
    item[2] = Math.floor(Math.random() * 4)
  })

  const optionHeatmap = {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const statusMap = ['空闲', '课程占用', '已预约', '维修中']
        return `${days[params.value[0]]} ${hours[params.value[1]]}<br/>状态：${statusMap[params.value[2]]}`
      },
    },
    grid: { height: '70%', top: '10%' },
    xAxis: { type: 'category', data: days, splitArea: { show: true } },
    yAxis: { type: 'category', data: hours, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: 3,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      categories: ['空闲', '课程', '预约', '维修'],
      inRange: {
        color: ['#e1f3d8', '#409eff', '#e6a23c', '#f56c6c'], // 浅绿, 深蓝, 橙, 红
      },
    },
    series: [
      {
        name: 'Classroom Usage',
        type: 'heatmap',
        data: data.map(function (item) {
          return [item[0], item[1], item[2] || 0]
        }),
        label: { show: false },
        itemStyle: {
          borderWidth: 1,
          borderColor: '#fff',
          borderRadius: 4,
        },
      },
    ],
  }
  heatmapChart.setOption(optionHeatmap)

  // 2. 初始化饼图 (预约状态分布)
  const pieChart = echarts.init(pieChartRef.value)
  const optionPie = {
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [
      {
        name: '预约状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold' },
        },
        data: [
          { value: 12, name: '待审核' },
          { value: 28, name: '已通过' },
          { value: 5, name: '已驳回' },
          { value: 3, name: '已取消' },
        ],
      },
    ],
  }
  pieChart.setOption(optionPie)

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    heatmapChart.resize()
    pieChart.resize()
  })
}

const handleCardClick = (path) => {
  if (path) router.push(path)
}

onMounted(() => {
  nextTick(() => {
    initCharts()
  })
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100%;
}

.card-section {
  margin-bottom: 20px;
}

.dashboard-card {
  min-height: 160px;
  cursor: pointer;
  transition: all 0.3s;
}

.dashboard-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

:deep(.dashboard-card .el-card__body) {
  padding: 16px 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
}

.card-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-item {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
}

.card-footer {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
  text-align: right;
}

.chart-section {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 350px;
}

.quick-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  flex: 1;
  height: 80px;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.footer-section {
  margin-top: 30px;
  text-align: center;
}

.system-notice {
  margin-bottom: 15px;
}

.copyright {
  font-size: 12px;
  color: #909399;
}
</style>
