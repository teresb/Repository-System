import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import Layout from '../components/Layout';

function MyApp({ Component, pageProps: { session, ...pageProps }, router }) {
  // Only wrap with Layout if not an admin page
  const isAdminPage = router.pathname.startsWith('/admin/');
  // No login form or authentication logic here, just layout wrapping
  const content = isAdminPage
    ? <Component {...pageProps} />
    : <Layout><Component {...pageProps} /></Layout>;
  return (
    <SessionProvider session={session}>
      {content}
    </SessionProvider>
  );
}

export default MyApp;
