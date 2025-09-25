<template>
  <div class="message-app">
    <h2>Список сообщений</h2>
    
    <!-- Форма для создания сообщения -->
    <div class="message-form">
      <input 
        v-model="newMessage" 
        @keyup.enter="createMessage"
        placeholder="Введите сообщение..."
        :disabled="mutationLoading"
      />
      <button @click="createMessage" :disabled="!newMessage || mutationLoading">
        Отправить
      </button>
    </div>

    <!-- Статус WebSocket -->
    <div class="connection-status" :class="{ connected: isConnected }">
      WebSocket: {{ isConnected ? 'Подключен ✅' : 'Отключен ❌' }}
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loading && messages.length === 0" class="loading">Загрузка сообщений...</div>
    
    <!-- Ошибка -->
    <div v-else-if="error" class="error">
      Ошибка: {{ error.message }}
    </div>
    
    <!-- Список сообщений -->
    <div v-else class="messages-list">
      <div v-if="messages.length === 0" class="no-messages">
        Нет сообщений
      </div>
      <div v-else>
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message-item"
        >
          <div class="message-header">
            <strong>{{ message.author }}</strong>
            <small>{{ formatDate(message.createdAt) }}</small>
          </div>
          <div class="message-content">
            {{ message.content }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMutation } from '../composables/useGraphQL'
import { useWebSocket } from '../composables/useWebSocket'
import { Message } from '../types'

const newMessage = ref('')
const loading = ref(false)
const error = ref<Error | null>(null)

const CREATE_MESSAGE = `
  mutation CreateMessage($content: String!, $author: String!) {
    createMessage(content: $content, author: $author) {
      id
      content
      author
      createdAt
    }
  }
`

const { loading: mutationLoading, mutate: createMessageMutation } = useMutation(CREATE_MESSAGE)

// WebSocket подключение
const { 
  isConnected, 
  messages: wsMessages, 
  error: wsError, 
  connect 
} = useWebSocket('ws://localhost:4000/graphql')

const messages = wsMessages

const createMessage = async (): Promise<void> => {
  if (!newMessage.value.trim()) return
  
  try {
    await createMessageMutation({
      content: newMessage.value.trim(),
      author: 'User' + Math.floor(Math.random() * 1000)
    })
    newMessage.value = ''
    // Сообщения будут автоматически обновлены через WebSocket
  } catch (err) {
    console.error('Error creating message:', err)
  }
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  connect()
})
</script>

<style scoped>
.message-app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.message-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.message-form input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.message-form button {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.message-form button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.connection-status {
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
}

.connection-status.connected {
  background: #d4edda;
  color: #155724;
}

.connection-status:not(.connected) {
  background: #f8d7da;
  color: #721c24;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.error {
  padding: 20px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 6px;
  margin-bottom: 20px;
}

.no-messages {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.messages-list {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.message-item {
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
}

.message-item:last-child {
  border-bottom: none;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-header strong {
  color: #007bff;
}

.message-header small {
  color: #6c757d;
  font-size: 14px;
}

.message-content {
  line-height: 1.5;
  color: #212529;
}
</style>