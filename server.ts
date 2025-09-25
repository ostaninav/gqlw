import { createServer, IncomingMessage, ServerResponse } from 'http'
import { WebSocket, WebSocketServer } from 'ws'

// Типы
interface Message {
  id: string
  content: string
  author: string
  createdAt: string
}

interface GraphQLRequest {
  query: string
  variables?: Record<string, unknown>
  operationName?: string
}

interface GraphQLError {
  message: string
}

interface GraphQLResponse {
  data?: Record<string, unknown>
  errors?: GraphQLError[]
}

interface WebSocketMessage {
  type: 'data'
  payload: Record<string, unknown>
}

// Хранилище сообщений
let messages: Message[] = [
  {
    id: '1',
    content: 'Добро пожаловать! Это первое сообщение.',
    author: 'System',
    createdAt: new Date().toISOString()
  }
]

let nextId = 2

// Простой парсер тела запроса
function parseBody(body: string): GraphQLRequest | null {
  try {
    return JSON.parse(body) as GraphQLRequest
  } catch (e) {
    return null
  }
}

// Выполнение GraphQL операций
function executeOperation(request: GraphQLRequest): GraphQLResponse {
  const { query, variables } = request
  const cleanQuery = query.replace(/\s+/g, ' ').trim()

  // Запрос messages
  if (cleanQuery.includes('query') && cleanQuery.includes('messages')) {
    return {
      data: {
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          author: msg.author,
          createdAt: msg.createdAt
        }))
      }
    }
  }

  // Мутация createMessage
  if (cleanQuery.includes('mutation') && cleanQuery.includes('createMessage')) {
    const { content, author } = variables || {}
    if (!content || !author) {
      return {
        errors: [{ message: 'Content and author are required' }]
      }
    }

    const newMessage: Message = {
      id: String(nextId++),
      content: String(content),
      author: String(author),
      createdAt: new Date().toISOString()
    }

    messages.push(newMessage)

    // Отправляем новое сообщение всем подключенным WebSocket клиентам
    broadcastNewMessage(newMessage)

    return {
      data: {
        createMessage: newMessage
      }
    }
  }

  return {
    errors: [{ message: 'Unknown operation' }]
  }
}

// Храним подключенных WebSocket клиентов
const wsClients = new Set<WebSocket>()

// Отправка нового сообщения всем клиентам
function broadcastNewMessage(message: Message): void {
  const payload: WebSocketMessage = {
    type: 'data',
    payload: {
      messageAdded: message
    }
  }

  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload))
    }
  })
}

// Создаем HTTP сервер
const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')

  // Preflight запросы
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // Только POST запросы к /graphql
  if (req.method === 'POST' && req.url === '/graphql') {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    
    req.on('end', () => {
      try {
        const graphqlRequest = parseBody(body)
        
        if (!graphqlRequest || !graphqlRequest.query) {
          throw new Error('Invalid GraphQL request: missing query')
        }

        const result = executeOperation(graphqlRequest)
        
        res.writeHead(200)
        res.end(JSON.stringify(result))
      } catch (error) {
        console.error('Server error:', error)
        res.writeHead(400)
        res.end(JSON.stringify({
          errors: [{ message: (error as Error).message }]
        }))
      }
    })
    return
  }

  // Все остальные запросы - 404
  res.writeHead(404)
  res.end(JSON.stringify({
    errors: [{ message: 'Not found' }]
  }))
})

// Создаем WebSocket сервер
const wss = new WebSocketServer({ server, path: '/graphql' })

wss.on('connection', (ws: WebSocket) => {
  console.log('✅ WebSocket client connected')
  wsClients.add(ws)

  // Отправляем текущие сообщения новому клиенту
  const initialPayload: WebSocketMessage = {
    type: 'data',
    payload: {
      messages: messages
    }
  }
  ws.send(JSON.stringify(initialPayload))

  ws.on('close', () => {
    console.log('❌ WebSocket client disconnected')
    wsClients.delete(ws)
  })

  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error)
    wsClients.delete(ws)
  })
})

const PORT = 4000
server.listen(PORT, () => {
  console.log(`🚀 HTTP Server ready at http://localhost:${PORT}/graphql`)
  console.log(`🚀 WebSocket Server ready at ws://localhost:${PORT}/graphql`)
  console.log('Initial messages:', messages)
})