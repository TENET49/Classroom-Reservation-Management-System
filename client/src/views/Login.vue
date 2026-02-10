<template>
  <div class="login-container">
    <h2>登录</h2>
    <p>邮箱：<input type="text" v-model="email" placeholder="student1@test.com" /></p>
    <p>密码：<input type="password" v-model="password" placeholder="123456" /></p>
    <p>
      <button @click="handleClick" :disabled="authStore.isLoading">
        {{ authStore.isLoading ? '登录中...' : '登录' }}
      </button>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('student1@test.com') // 默认值方便测试
const password = ref('123456')

const handleClick = async () => {
  if (!email.value || !password.value) {
    alert('请输入邮箱和密码')
    return
  }

  // useAuthStore.login 现在返回 true/false
  const success = await authStore.login({
    email: email.value,
    password: password.value,
  })

  if (success) {
    // 成功跳转到首页
    router.push('/')
  } else {
    // 失败
    alert('登录失败，请检查账号密码')
  }
}
</script>

<style scoped>
.login-container {
  padding: 20px;
}
input {
  margin: 5px;
  padding: 5px;
}
</style>
