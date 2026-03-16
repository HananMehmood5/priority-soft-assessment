import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const TOKEN_KEY = 'shiftsync_token';

const uri =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3001/graphql'
    : 'http://localhost:3001/graphql';

const httpLink = new HttpLink({ uri });

const authLink = setContext((_, { headers }) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

export function getApolloClient(): ApolloClient<unknown> {
  return apolloClient;
}
