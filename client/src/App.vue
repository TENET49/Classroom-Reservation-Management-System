<script setup>
// App.vue 是根组件，主要职责是提供路由出口
</script>

<template>
  <!-- 路由匹配到的组件将在这里渲染 -->
  <router-view />
</template>

<style>
/* 全局样式可以放这里，或者单独的 CSS 文件 */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
