import { ref, onUnmounted, Ref } from 'vue'
import { Message } from '../types'

interface UseWebSocketResult {
  ws: Ref<WebSocket | null>
  isConnected: Ref<boolean>
  messages: Ref<Message[]>
  error: Ref<Error | null>
  connect: () => void
  disconnect: () => void
}

interface WebSocketMessage {
  type: 'data'
  payload: {
    messages?: Message[]
    messageAdded?: Message
  }
}

export function useWebSocket(url: string): UseWebSocketResult {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const messages = ref<Message[]>([])
  const error = ref<Error | null>(null)

  const connect = (): void => {
    try {
      ws.value = new WebSocket(url)
      
      ws.value.onopen = () => {
        console.log('✅ WebSocket connected')
        isConnected.value = true
        error.value = null
      }

      ws.value.onmessage = (event: MessageEvent) => {
        try {
          const parsed: WebSocketMessage = JSON.parse(event.data as string)
          
          if (parsed.type === 'data' && parsed.payload) {
            const { messages: initialMessages, messageAdded } = parsed.payload

            if (initialMessages && Array.isArray(initialMessages)) {
              // Сортируем от новых к старым
              messages.value = [...initialMessages].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
            } else if (messageAdded) {
              messages.value.unshift(messageAdded)
            } else {
              console.log('Received WebSocket message with empty payload:', parsed)
            }
          } else {
            console.log('Unexpected WebSocket message format:', parsed)
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err)
        }
      }

      ws.value.onclose = () => {
        console.log('❌ WebSocket disconnected')
        isConnected.value = false
        // Автоповтор через 3 секунды
        setTimeout(() => {
          if (!isConnected.value) {
            connect()
          }
        }, 3000)
      }

      ws.value.onerror = (err: Event) => {
        console.error('WebSocket error:', err)
        error.value = new Error('WebSocket connection error')
        isConnected.value = false
      }
    } catch (err) {
      console.error('WebSocket connection error:', err)
      error.value = err as Error
    }
  }

  const disconnect = (): void => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
      isConnected.value = false
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  // Подключаемся сразу при вызове хука
  connect()

  return {
    ws,
    isConnected,
    messages,
    error,
    connect,
    disconnect
  }
}