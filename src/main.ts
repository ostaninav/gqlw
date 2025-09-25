import { createApp } from 'vue'
import App from './App.vue'
import apolloClient from './apollo'
import { APOLLO_CLIENT_KEY } from './composables/useGraphQL'

const app = createApp(App)

// Используем Symbol для безопасного provide/inject
app.provide(APOLLO_CLIENT_KEY, apolloClient)

app.mount('#app')