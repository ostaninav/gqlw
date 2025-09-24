import { inject, ref } from 'vue'

const APOLLO_CLIENT = 'apollo-client'

export function useApolloClient() {
  const client = inject(APOLLO_CLIENT)
  if (!client) {
    throw new Error('Apollo Client not provided!')
  }
  return client
}

export function useQuery(query, variables = {}) {
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

  executeQuery()

  return {
    loading,
    error,
    data,
    refetch: executeQuery
  }
}

export function useMutation(mutation) {
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