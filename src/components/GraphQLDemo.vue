<template>
  <div class="graphql-demo">
    <h2>GraphQL Demo с WebSockets</h2>
    
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

    <!-- Статус подключения WebSocket -->
    <div class="connection-status" :class="{ connected: isConnected }">
      Статус WebSocket: 
      <span v-if="isConnected" class="status-connected">Подключен ✅</span>
      <span v-else class="status-disconnected">Отключен ❌</span>
    </div>
    
    <!-- Отладочная информация -->
    <div v-if="debugInfo" class="debug-info">
      <h4>Отладочная информация:</h4>
      <pre>{{ debugInfo }}</pre>
    </div>

    <!-- Список сообщений -->
    <div class="messages">
      <h3>Сообщения ({{ messages.length }})</h3>
      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="error" class="error">Ошибка: {{ error.message }}</div>
      <div v-else class="message-list">
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message-item"
        >
          <strong>{{ message.author }}:</strong> {{ message.content }}
          <small>{{ new Date(message.createdAt).toLocaleTimeString() }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import gql from 'graphql-tag'
import { useQuery, useMutation } from '../composables/useGraphQL'

const GET_MESSAGES = gql`
  query GetMessages {
    messages {
      id
      content
      author
      createdAt
    }
  }
`

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
  name: 'GraphQLDemo',
  setup() {
    const newMessage = ref('')
    const isConnected = ref(true) 

    const { loading, error, data, refetch } = useQuery(GET_MESSAGES)
    const { loading: mutationLoading, mutate: createMessageMutation } = useMutation(CREATE_MESSAGE)

    const messages = ref([])

    const createMessage = async () => {
      if (!newMessage.value.trim()) return

      try {
        await createMessageMutation({
          content: newMessage.value.trim(),
          author: 'User' + Math.floor(Math.random() * 1000)
        })
        newMessage.value = ''
        // Обновляем список сообщений
        refetch()
      } catch (error) {
        console.error('Error creating message:', error)
      }
    }

    onMounted(() => {
      if (data.value?.messages) {
        messages.value = [...data.value.messages].reverse()
      }
    })

    // Следим за изменениями данных
    if (data.value?.messages) {
      messages.value = [...data.value.messages].reverse()
    }

    return {
      newMessage,
      messages,
      loading,
      error,
      isConnected,
      createMessage,
      mutationLoading
    }
  }
}
</script>

<style scoped>
.graphql-demo {
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
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.message-form button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.message-form button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.connection-status {
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
}

.status-connected {
  color: #28a745;
}

.status-disconnected {
  color: #dc3545;
}

.debug-info {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-family: monospace;
  font-size: 12px;
}

.messages {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 20px;
}

.message-list {
  max-height: 400px;
  overflow-y: auto;
}

.message-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.message-item:last-child {
  border-bottom: none;
}

.message-item small {
  float: right;
  color: #666;
}

.loading {
  text-align: center;
  color: #666;
}

.error {
  color: #dc3545;
  padding: 10px;
}
</style>