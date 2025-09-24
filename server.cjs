const express = require('express')
const { createServer } = require('http')
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const { useServer } = require('graphql-ws/lib/use/ws')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const { WebSocketServer } = require('ws')
const { PubSub } = require('graphql-subscriptions')

const pubsub = new PubSub()

const typeDefs = `
  type Message {
    id: ID!
    content: String!
    author: String!
    createdAt: String!
  }

  type Query {
    messages: [Message!]!
  }

  type Mutation {
    createMessage(content: String!, author: String!): Message!
  }

  type Subscription {
    messageAdded: Message!
  }
`

let messages = [
  {
    id: '1',
    content: 'Добро пожаловать в демонстрацию GraphQL с WebSockets!',
    author: 'System',
    createdAt: new Date().toISOString()
  }
]

let nextId = 2

const resolvers = {
  Query: {
    messages: () => messages
  },
  Mutation: {
    createMessage: (_, { content, author }) => {
      console.log('Received mutation:', { content, author })
      
      if (!content || !author) {
        throw new Error('Content and author are required')
      }
      
      const newMessage = {
        id: String(nextId++),
        content: String(content),
        author: String(author),
        createdAt: new Date().toISOString()
      }
      
      messages.push(newMessage)
      pubsub.publish('MESSAGE_ADDED', { messageAdded: newMessage })
      
      console.log('Created message:', newMessage)
      return newMessage
    }
  },
  Subscription: {
    messageAdded: {
      subscribe: () => pubsub.asyncIterator(['MESSAGE_ADDED'])
    }
  }
}

async function startServer() {
  const app = express()
  const httpServer = createServer(app)

  const schema = makeExecutableSchema({ typeDefs, resolvers })

  // Создаем WebSocket сервер
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  })

  const serverCleanup = useServer({ schema, execute, subscribe }, wsServer)

  const server = new ApolloServer({
    schema,
  })

  await server.start()

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    }),
  )

  const PORT = 4000
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}/graphql`)
  })

  process.on('SIGTERM', async () => {
    serverCleanup()
    await server.stop()
    process.exit(0)
  })
}

startServer().catch(error => {
  console.error('Error starting server:', error)
})