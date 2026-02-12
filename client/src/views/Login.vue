<template>
  <div class="box">
    <div class="forms">
      <div class="tips">
        <span class="login-btn" :class="{ active: currentForm === 'login' }" @click="switchForm('login')">登录</span>
        <span class="register-btn" :class="{ active: currentForm === 'register' }" @click="switchForm('register')"
          >注册</span
        >
      </div>

      <!-- Login Form -->
      <div class="login" :class="{ show: currentForm === 'login' }">
        <div class="form-title">
          <h1>你好</h1>
          <h4>欢迎来到教室预约管理系统，请先登录</h4>
        </div>
        <div class="form">
          <div class="username input-item">
            <input type="text" class="ipts" v-model="loginEmail" placeholder="Email" />
          </div>
          <div class="password input-item">
            <input type="password" class="ipts" v-model="loginPassword" placeholder="Password" />
          </div>
          <div class="other-select">
            <div class="rem-pwd">
              <input type="checkbox" id="check" />
              <label for="check" class="rem-pwd-tips">记住密码</label>
            </div>
            <span class="fogot-pwd-btn" @click="switchForm('forgot')">忘记密码</span>
          </div>
          <button class="btn" @click="handleLogin" :disabled="authStore.isLoading">
            {{ authStore.isLoading ? '登录中...' : '登录' }}
          </button>
          <div class="other-login">
            <span>其他登录方式</span>
            <div class="login-img">
              <img src="@/assets/login/QQ.png" alt="" />
              <img src="@/assets/login/wechat-fill.png" alt="" />
            </div>
          </div>
        </div>
      </div>

      <!-- Register Form -->
      <div class="register" :class="{ show: currentForm === 'register' }">
        <div class="form-title">
          <h1>注册</h1>
          <h4>请填写以下信息以注册账号</h4>
        </div>
        <div class="form">
          <div class="name input-item">
            <input type="text" class="ipts" v-model="regName" placeholder="Name" />
          </div>
          <div class="email input-item">
            <input type="text" class="ipts" v-model="regEmail" placeholder="Email" />
          </div>
          <div class="password input-item">
            <input type="password" class="ipts" v-model="regPassword" placeholder="Password" />
          </div>
          <div class="conform-password input-item">
            <input type="password" class="ipts" v-model="regConfirmPassword" placeholder="Confirm Password" />
          </div>
          <button class="btn" @click="handleRegister">注册</button>
        </div>
      </div>

      <!-- Forgot Password Form -->
      <div class="fogot-pwd" :class="{ show: currentForm === 'forgot' }">
        <div class="form-title">
          <h1>Forgot Password</h1>
          <h4>One click triple connection</h4>
        </div>
        <div class="form">
          <div class="username input-item">
            <input type="text" class="ipts" placeholder="Email" />
          </div>
          <div class="password input-item">
            <input type="password" class="ipts" placeholder="New Password" />
          </div>
          <div class="code input-item">
            <input type="text" class="ipts" placeholder="Code" />
            <span class="veri-code-tips" @click="handleSendCode">{{ codeBtnText }}</span>
          </div>
          <button class="btn">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import authService from '@/service/authService' // 导入 authService 以便调用注册接口

const authStore = useAuthStore()
const router = useRouter()

// Form switching
const currentForm = ref('login')
const switchForm = (type) => {
  currentForm.value = type
}

// Login logic
const loginEmail = ref('student1@test.com')
const loginPassword = ref('123456')

const handleLogin = async () => {
  if (!loginEmail.value || !loginPassword.value) {
    alert('Please enter email and password')
    return
  }

  const success = await authStore.login({
    email: loginEmail.value,
    password: loginPassword.value,
  })

  if (success) {
    router.push('/')
  } else {
    alert('账号或密码错误')
  }
}

// Register logic
const regName = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')

const handleRegister = async () => {
  if (!regName.value || !regEmail.value || !regPassword.value || !regConfirmPassword.value) {
    alert('Please fill all fields')
    return
  }
  if (regPassword.value !== regConfirmPassword.value) {
    alert('Passwords do not match')
    return
  }

  // 调用注册接口
  try {
    const res = await authService.register({
      name: regName.value,
      email: regEmail.value,
      password: regPassword.value,
      role: 'student', // 默认注册为学生
    })
    if (res.code === 0) {
      alert('Registration successful! Please login.')
      switchForm('login')
    } else {
      alert('Registration failed: ' + res.msg)
    }
  } catch (error) {
    console.error(error)
    alert('Registration error')
  }
}

// Verification code logic
const codeBtnText = ref('Click To Get')
let timer = null
let timeLeft = 5

const handleSendCode = () => {
  if (timer) return

  codeBtnText.value = `RESEND(${timeLeft})`
  timer = setInterval(() => {
    timeLeft--
    if (timeLeft < 0) {
      clearInterval(timer)
      timer = null
      timeLeft = 5
      codeBtnText.value = 'Click To Get'
    } else {
      codeBtnText.value = `RESEND(${timeLeft})`
    }
  }, 1000)
}
</script>

<style scoped>
@font-face {
  font-family: NeueMachina-Regular;
  font-weight: 400;
  src: url(@/assets/login/font/NeueMachina-Regular.woff2) format('truetype');
}

* {
  padding: 0;
  margin: 0;
}

/* 使用 :deep 或全局样式来覆盖 body 背景色，因为 scoped 样式不会作用于 body */
/* 或者直接给最外层 div 设置全屏背景 */
.box {
  width: 100vw;
  height: 100vh;
  background: url(@/assets/login/bg.jpg);
  background-attachment: fixed;
  background-size: cover;
  position: relative; /* 覆盖原来的 absolute 居中，因为外层已经是全屏 */
  font-family: NeueMachina-Regular, sans-serif;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.box .forms {
  width: 50vw; /* 调整为响应式单位 */
  height: 80vh; /* 调整高度 */
  background-color: rgb(45, 50, 80);
  border-radius: 30px; /* 两边都圆角好看点，或者保持原样 */
  color: rgb(255, 255, 255);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  position: relative;
  /* 增加一些阴影 */
  box-shadow: 0 15px 25px rgba(0, 0, 0, 0.6);
}

.box .forms .tips {
  width: 70%;
  height: 10%;
  box-sizing: border-box;
  font-size: 25px;
  margin: 4vh;
  z-index: 20; /* 确保在最上层 */
}

.box .forms .tips span {
  margin: 0 10px 0 0;
  cursor: pointer;
  padding-bottom: 5px;
  transition: 0.1s;
  color: rgb(100, 108, 154);
}

.box .forms .tips span:hover,
.box .forms .tips span.active {
  border-bottom: 4px solid rgb(249, 177, 122);
  color: #fff;
}

.box .forms .login,
.box .forms .register,
.box .forms .fogot-pwd {
  width: 70%;
  position: absolute;
  top: 20%;
  opacity: 0;
  z-index: -1;
  transition: all 0.5s ease;
  transform: translateY(5vh);
}

/* 控制显示状态 */
.box .forms .login.show,
.box .forms .register.show,
.box .forms .fogot-pwd.show {
  opacity: 1;
  z-index: 10;
  transform: translateY(0);
}

.box .forms .form-title h1 {
  margin-bottom: 10px;
}

.box .forms .form {
  margin-top: 3vw;
}

/* 输入框标签伪类模拟 */
.input-item {
  width: 100%;
  height: 70px;
  margin: 10px 0;
  transition: 0.5s;
  position: relative;
}

.input-item::before {
  display: block;
  position: absolute;
  color: rgb(100, 108, 154);
  padding: 10px 5px 1px 20px;
  font-size: 14px;
  z-index: 1;
}

/* 简单的标签映射，实际项目中可以用 v-bind 或 props */
.username.input-item::before {
  content: '用户名/邮箱';
}
.name.input-item::before {
  content: '姓名';
}
.email.input-item::before {
  content: '邮箱';
}
.password.input-item::before {
  content: '密码';
}
.conform-password.input-item::before {
  content: '确认密码';
}
.code.input-item::before {
  content: '验证码';
}

.input-item input {
  width: 100%;
  height: 100%;
  background-color: rgb(66, 71, 105);
  outline: none;
  border: 0;
  padding: 20px 5px 1px 20px;
  box-sizing: border-box;
  color: #fff;
  font-size: 20px;
  border-radius: 5px;
}

.input-item input:focus {
  border-left: 3px solid rgb(255, 187, 124);
}

.other-select {
  display: flex;
  justify-content: space-between;
  color: rgb(100, 108, 154);
  margin-top: 1vw;
}

.rem-pwd {
  display: flex;
  align-items: center;
}

.other-select input[type='checkbox'] {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  position: relative;
  appearance: none; /* 去除默认样式 */
  background-color: rgb(66, 71, 105);
  border-radius: 3px;
  cursor: pointer;
}

.other-select input[type='checkbox']:checked {
  background-color: rgb(249, 177, 122);
}

.other-select input[type='checkbox']:checked::after {
  content: '✔';
  color: rgb(45, 50, 80);
  position: absolute;
  left: 4px;
  top: 0;
  font-size: 16px;
}

.fogot-pwd-btn {
  cursor: pointer;
  color: rgb(100, 108, 154);
}

.btn {
  width: 40%;
  height: 50px;
  cursor: pointer;
  border: 0;
  background-color: rgb(249, 177, 122);
  color: rgb(45, 50, 80);
  margin: 3vw 0 10px 0;
  border-radius: 5px;
  font-size: 20px;
  box-shadow: 0px 0px 10px rgb(249, 177, 122);
  transition: 0.3s;
  font-family: NeueMachina-Regular, sans-serif;
}

.btn:hover {
  box-shadow: 0px 0px 15px rgb(249, 177, 122);
  transform: scale(1.02);
}

.btn:disabled {
  background-color: #ccc;
  box-shadow: none;
  cursor: not-allowed;
}

.other-login {
  color: rgb(100, 108, 154);
  margin-top: 5vw;
  font-weight: 900;
  display: flex;
  align-items: center;
}

.other-login .login-img img {
  display: inline-block;
  width: 40px;
  height: 40px;
  margin-left: 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: 0.3s;
}

.other-login .login-img img:hover {
  transform: scale(1.1);
}

.veri-code-tips {
  position: absolute;
  right: 20px;
  top: 25px; /* 调整位置 */
  color: rgb(113, 123, 185);
  cursor: pointer;
  z-index: 2;
}

@media (max-width: 1024px) {
  .box .forms {
    width: 90vw;
  }
}
</style>
