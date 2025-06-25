import { useEffect } from 'react';
import { useRouter } from 'next/router';

const HomePage = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/login');
  }, [router]);
  return null;
};

export default HomePage;
