import { createApp } from 'vue'
import App from './App.vue'
import apolloClient from './apollo'

const app = createApp(App)

// Делаем Apollo Client доступным глобально
app.config.globalProperties.$apollo = apolloClient

app.mount('#app')