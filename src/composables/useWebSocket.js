import { ref, onUnmounted } from 'vue'

export function useWebSocket(url) {
  const ws = ref(null)
  const isConnected = ref(false)
  const messages = ref([])
  const error = ref(null)

  const connect = () => {
    try {
      ws.value = new WebSocket(url)
      
      ws.value.onopen = () => {
        console.log('✅ WebSocket connected')
        isConnected.value = true
        error.value = null
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'data') {
            // Если пришли все сообщения (инициализация)
            if (data.data.messages) {
              messages.value = [...data.data.messages].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
              )
            }
            // Если пришло новое сообщение
            else if (data.data.messageAdded) {
              messages.value.unshift(data.data.messageAdded)
            }
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err)
        }
      }

      ws.value.onclose = () => {
        console.log('❌ WebSocket disconnected')
        isConnected.value = false
        // Попробуем переподключиться через 3 секунды
        setTimeout(() => {
          if (!isConnected.value) {
            connect()
          }
        }, 3000)
      }

      ws.value.onerror = (err) => {
        console.error('WebSocket error:', err)
        error.value = err
        isConnected.value = false
      }

    } catch (err) {
      console.error('WebSocket connection error:', err)
      error.value = err
    }
  }

  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
      isConnected.value = false
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    ws,
    isConnected,
    messages,
    error,
    connect,
    disconnect
  }
}