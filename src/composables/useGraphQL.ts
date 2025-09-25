import { inject, ref, Ref, onUnmounted } from 'vue'
import { ApolloClient, gql, ApolloQueryResult, FetchResult } from '@apollo/client/core'

export const APOLLO_CLIENT_KEY = Symbol('apollo-client')

export type OperationVariables = Record<string, unknown>

export function useApolloClient(): ApolloClient<unknown> {
  const client = inject<ApolloClient<unknown>>(APOLLO_CLIENT_KEY) || 
                inject<ApolloClient<unknown>>('apollo-client')
  
  if (!client) {
    throw new Error('Apollo Client not provided! Make sure to call app.provide("apollo-client", apolloClient) in your main.ts or App.vue')
  }
  return client
}

interface UseQueryResult<T> {
  loading: Ref<boolean>
  error: Ref<Error | null>
  data: Ref<T | null>
  refetch: () => Promise<void>
}

export function useQuery<T = unknown>(
  query: string,
  variables: OperationVariables = {}
) {
  const client = useApolloClient()
  const loading = ref(true)
  const error = ref<Error | null>(null)
  const data = ref<T | null>(null)
  const isUnmounted = ref(false)

  onUnmounted(() => {
    isUnmounted.value = true
  })

  const executeQuery = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      const result: ApolloQueryResult<T> = await client.query<T>({
        query: gql(query),
        variables,
        fetchPolicy: 'network-only'
      })
      
      if (!isUnmounted.value) {
        data.value = result.data ?? null
      }
    } catch (err) {
      if (!isUnmounted.value) {
        error.value = err as Error
      }
      console.error('GraphQL Query Error:', err)
    } finally {
      if (!isUnmounted.value) {
        loading.value = false
      }
    }
  }

  executeQuery()

  return {
    loading,
    error,
    data,
    refetch: executeQuery
  }
}

interface UseMutationResult<T> {
  loading: Ref<boolean>
  error: Ref<Error | null>
  data: Ref<T | null>
  mutate: (variables: OperationVariables) => Promise<FetchResult<T>>
}

export function useMutation<T = unknown>(
  mutation: string
) {
  const client = useApolloClient()
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const data = ref<T | null>(null)
  const isUnmounted = ref(false)

  onUnmounted(() => {
    isUnmounted.value = true
  })

  const mutate = async (variables: OperationVariables = {}): Promise<FetchResult<T>> => {
    try {
      if (!isUnmounted.value) {
        loading.value = true
        error.value = null
      }
      
      const result: FetchResult<T> = await client.mutate<T>({
        mutation: gql(mutation),
        variables
      })
      
      if (!isUnmounted.value) {
        data.value = result.data ?? null
      }
      
      return result
    } catch (err) {
      if (!isUnmounted.value) {
        error.value = err as Error
      }
      console.error('GraphQL Mutation Error:', err)
      throw err
    } finally {
      if (!isUnmounted.value) {
        loading.value = false
      }
    }
  }

  return {
    loading,
    error,
    data,
    mutate
  }
}