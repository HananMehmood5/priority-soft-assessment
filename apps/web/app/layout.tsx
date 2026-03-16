import './globals.css';
import type { Metadata } from 'next';
import { ApolloProvider } from '@/lib/apollo/ApolloProvider';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'ShiftSync · Priority Soft',
  icons: {
    icon: 'https://prioritysoft.io/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-ps-bg text-ps-fg">
        <ApolloProvider>
          <AuthProvider>{children}</AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
