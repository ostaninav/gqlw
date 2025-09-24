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

<script>
import { ref, computed, onMounted } from 'vue'
import gql from 'graphql-tag'
import { useMutation } from '../composables/useGraphQL'
import { useWebSocket } from '../composables/useWebSocket'

const CREATE_MESSAGE = gql`
  mutation CreateMessage($content: String!, $author: String!) {
    createMessage(content: $content, author: $author) {
      id
      content
      author
      createdAt
    }
  }
`

export default {
  name: 'MessageList',
  setup() {
    const newMessage = ref('')
    const loading = ref(false)
    const error = ref(null)
    
    const { loading: mutationLoading, mutate: createMessageMutation } = useMutation(CREATE_MESSAGE)
    
    // WebSocket подключение
    const { 
      isConnected, 
      messages: wsMessages, 
      error: wsError, 
      connect 
    } = useWebSocket('ws://localhost:4000/graphql')
    
    const messages = wsMessages
    
    const createMessage = async () => {
      if (!newMessage.value.trim()) return
      
      try {
        await createMessageMutation({
          content: newMessage.value.trim(),
          author: 'User' + Math.floor(Math.random() * 1000)
        })
        newMessage.value = ''
        // Сообщения будут автоматически обновлены через WebSocket
      } catch (error) {
        console.error('Error creating message:', error)
      }
    }
    
    const formatDate = (dateString) => {
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
    
    return {
      newMessage,
      messages,
      loading,
      error: error || wsError,
      isConnected,
      mutationLoading,
      createMessage,
      formatDate
    }
  }
}
</script>

<style scoped>
/* ... предыдущие стили ... */

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
</style>