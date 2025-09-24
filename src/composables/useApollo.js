import { inject, ref, watchEffect } from 'vue'
import { useQuery, useMutation, useSubscription } from '@apollo/client'

// Символ для инъекции Apollo Client
const APOLLO_CLIENT = 'apollo-client'

export function useApolloClient() {
  const client = inject(APOLLO_CLIENT)
  if (!client) {
    throw new Error('Apollo Client not provided!')
  }
  return client
}

export function useGraphQLQuery(query, variables = {}) {
  const client = useApolloClient()
  const loading = ref(true)
  const error = ref(null)
  const data = ref(null)

  const executeQuery = async () => {
    try {
      loading.value = true
      error.value = null
      const result = await client.query({
        query,
        variables,
        fetchPolicy: 'network-only'
      })
      data.value = result.data
    } catch (err) {
      error.value = err
      console.error('GraphQL Query Error:', err)
    } finally {
      loading.value = false
    }
  }

  // Выполняем запрос при создании
  executeQuery()

  return {
    loading,
    error,
    data,
    refetch: executeQuery
  }
}

export function useGraphQLMutation(mutation) {
  const client = useApolloClient()
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)

  const mutate = async (variables = {}) => {
    try {
      loading.value = true
      error.value = null
      const result = await client.mutate({
        mutation,
        variables
      })
      data.value = result.data
      return result
    } catch (err) {
      error.value = err
      console.error('GraphQL Mutation Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    data,
    mutate
  }
}

export function useGraphQLSubscription(subscription, variables = {}, onData) {
  const client = useApolloClient()
  const loading = ref(false)
  const error = ref(null)

  const subscribe = () => {
    try {
      loading.value = true
      const subscriptionObservable = client.subscribe({
        query: subscription,
        variables
      })

      const subscriptionHandler = subscriptionObservable.subscribe({
        next: (result) => {
          loading.value = false
          if (onData) {
            onData(result.data)
          }
        },
        error: (err) => {
          loading.value = false
          error.value = err
          console.error('GraphQL Subscription Error:', err)
        }
      })

      return subscriptionHandler
    } catch (err) {
      loading.value = false
      error.value = err
      console.error('Subscription Setup Error:', err)
    }
  }

  return {
    loading,
    error,
    subscribe
  }
}