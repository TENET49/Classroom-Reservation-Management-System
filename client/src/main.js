import { createApp } from 'vue'
import router from '@/router'
import App from './App.vue'
import { createPinia } from 'pinia'
import './styles/reset.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

// 网站被访问时，需要用token 去换取用户身份
// 注意：必须在 pinia 挂载后才能使用 store
import { useAuthStore } from './stores/useAuthStore'
const authStore = useAuthStore()
authStore.whoAmI()
