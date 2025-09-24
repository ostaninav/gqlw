import { 
  ApolloClient, 
  InMemoryCache, 
  HttpLink 
} from '@apollo/client'

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include'
})

const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
})

export default apolloClient