export interface Message {
  id: string
  content: string
  author: string
  createdAt: string
}

export interface GraphQLRequest {
  query: string
  variables?: Record<string, any>
  operationName?: string
}

export interface GraphQLResponse {
  data?: Record<string, any>
  errors?: Array<{ message: string }>
}

export interface WebSocketMessage {
  type: 'data'
  data: Record<string, any>
}