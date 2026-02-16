<template>
  <el-menu
    :default-active="activeMenu"
    class="el-menu-vertical-demo"
    :collapse="isCollapse"
    router
    @open="handleOpen"
    @close="handleClose"
  >
    <div class="title-container">
      <h1>教室预约系统</h1>
    </div>

    <el-menu-item index="/">
      <el-icon><icon-menu /></el-icon>
      <span>系统首页</span>
    </el-menu-item>

    <el-sub-menu index="2">
      <template #title>
        <el-icon><Calendar /></el-icon>
        <span>教室预约</span>
      </template>
      <el-menu-item-group>
        <el-menu-item index="/search">查询可用教室</el-menu-item>
        <el-menu-item index="/reservation/create">发起预约申请</el-menu-item>
        <el-menu-item index="/my-reservation">我的预约记录</el-menu-item>
      </el-menu-item-group>
    </el-sub-menu>

    <!-- 2. 个人中心 -->
    <el-sub-menu index="3">
      <template #title>
        <el-icon><User /></el-icon>
        <span>个人中心</span>
      </template>
      <el-menu-item-group>
        <el-menu-item index="/profile">个人信息</el-menu-item>
        <el-menu-item index="/notifications">
          <el-badge :value="notificationStore.unreadCount" :hidden="notificationStore.unreadCount === 0" :max="99">
            <span>消息通知</span>
          </el-badge>
        </el-menu-item>
      </el-menu-item-group>
    </el-sub-menu>

    <!-- 3. 管理员专区 (需要权限控制 v-if) -->
    <template v-if="authStore.user?.role === 'admin'">
      <el-sub-menu index="4">
        <template #title>
          <el-icon><Management /></el-icon>
          <span>教室资源管理</span>
        </template>
        <el-menu-item-group>
          <el-menu-item index="/admin/buildings">楼栋管理</el-menu-item>
          <el-menu-item index="/admin/resources?tab=room-types">教室类型管理</el-menu-item>
          <el-menu-item index="/admin/resources?tab=rooms">教室信息管理</el-menu-item>
          <el-menu-item index="/admin/maintenance">教室状态维护</el-menu-item>
        </el-menu-item-group>
      </el-sub-menu>

      <el-sub-menu index="5">
        <template #title>
          <el-icon><List /></el-icon>
          <span>课表与占用</span>
        </template>
        <el-menu-item-group>
          <el-menu-item index="/admin/import/teacher-schedules">导入教师占用事项</el-menu-item>
          <el-menu-item index="/admin/import/courses">导入教室课表</el-menu-item>
          <el-menu-item index="/admin/occupancy">占用状态总览</el-menu-item>
        </el-menu-item-group>
      </el-sub-menu>

      <el-sub-menu index="6">
        <template #title>
          <el-icon><Stamp /></el-icon>
          <span>预约审核</span>
        </template>
        <el-menu-item-group>
          <el-menu-item index="/admin/audit">待审核列表</el-menu-item>
          <el-menu-item index="/admin/audit-history">历史审核记录</el-menu-item>
        </el-menu-item-group>
      </el-sub-menu>

      <el-sub-menu index="7">
        <template #title>
          <el-icon><TrendCharts /></el-icon>
          <span>数据统计</span>
        </template>
        <el-menu-item-group>
          <el-menu-item index="/admin/statistics?tab=usage">使用率报表</el-menu-item>
          <el-menu-item index="/admin/system-logs">系统日志</el-menu-item>
        </el-menu-item-group>
      </el-sub-menu>
    </template>
  </el-menu>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Document,
  Menu as IconMenu,
  Location,
  Setting,
  Calendar,
  User,
  Management,
  List,
  Stamp,
  TrendCharts,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNotificationStore } from '@/stores/useNotificationStore'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const isCollapse = ref(false)
const route = useRoute()

// 自动高亮当前路由对应的菜单项
const activeMenu = computed(() => route.fullPath)

const handleOpen = (key, keyPath) => {
  console.log(key, keyPath)
}
const handleClose = (key, keyPath) => {
  console.log(key, keyPath)
}

watch(
  () => authStore.user?.id,
  (id) => {
    if (id) notificationStore.refresh()
  },
  { immediate: true },
)
</script>

<style scoped>
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  height: 100%;
  background-color: #2d3250;
}

/* 覆盖 el-menu 本身的背景色，防止被 Element Plus 默认样式覆盖 */
.el-menu {
  background-color: #2d3250;
  border-right: none; /* 去掉默认的右边框 */
}

/* 设置菜单项的文字颜色 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: #ffffff;
  background-color: #2d3250; /* 确保背景色也是绿色 */
}

/* 鼠标悬停时的样式 */
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #5e6692 !important; /* 稍微深一点的绿色 */
}

/* 选中项高亮样式 */
:deep(.el-menu-item.is-active) {
  background-color: #409eff !important; /* Element Plus 默认蓝 */
  color: #fff;
}
:deep(.el-menu-item-group__title) {
  background-color: #5e6692;
  display: none; /* 通常不需要显示 group title，如果需要显示可以去掉这行并调整颜色 */
}

.title-container {
  height: 70px;
  justify-content: center;
  align-items: center;
  display: flex;
  font-size: 12px;
  color: #ffffff;
}
</style>
