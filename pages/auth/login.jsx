import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react'; // <-- import useSession
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  matricule: z.string().min(5, "Please enter a valid matricule"),
  password: z.string().min(1, "Password is required"),
});

const LoginPage = () => {
  const router = useRouter();
  const { status } = useSession(); // <-- get session status
  const [serverError, setServerError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (router.query.message) setMessage(router.query.message);
    if (router.query.error) setServerError("Invalid matricule or password.");
  }, [router.query]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    setMessage('');
    const result = await signIn('credentials', {
      redirect: false,
      matricule: data.matricule,
      password: data.password,
    });
    if (result.error) {
      setServerError("Invalid matricule or password. Please try again.");
      setIsLoading(false);
    } else if (result.ok) {
      router.replace('/'); // Use replace to avoid back navigation to login
    }
  };

  // Show loading if session is loading or redirecting
  if (isLoading || status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-sky-700 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <p className="text-lg font-semibold text-sky-800">Logging you in...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-sky-200 relative">
        <div className="absolute inset-0 h-full backdrop-blur-md bg-white/60 -z-0"></div>
        <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-2xl relative z-10 border border-sky-200">
          <div className='flex flex-col bg-sky-700 py-4 -mx-6 -mt-10 mb-6 rounded-t-xl shadow-xl justify-center items-center'>
            <img src="/images/ublogo.png" alt="Logo" className="w-16 h-16" />
            <h1 className='py-2 text-lg text-white font-bold text-center tracking-tight'>Department of Computer Engineering</h1>
            <p className='text-sm px-4 text-center text-sky-100'>Login to your account below</p>
          </div>

          {message && (
            <p className="text-green-700 bg-green-100 p-3 rounded-md text-sm mb-4 font-semibold text-center">{message}</p>
          )}
          {serverError && (
            <p className="text-red-700 bg-red-100 p-3 rounded-md text-sm mb-4 font-semibold text-center">{serverError}</p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label htmlFor="matricule" className="block text-sm font-semibold text-sky-800 mb-1">Matricule</label>
              <input
                id="matricule"
                type="text"
                {...register('matricule')}
                className="mt-1 block w-full px-3 py-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-600 text-base"
              />
              {errors.matricule && (
                <p className="text-red-600 text-xs mt-1">{errors.matricule.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-sky-800 mb-1">Password</label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="mt-1 block w-full px-3 py-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-600 text-base"
              />
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-3 border rounded-md text-base font-bold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-gray-400 border-sky-300 shadow"
            >
              Login
            </button>
          </form>
          <p className="mt-3 text-center text-sm text-sky-700">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-bold text-sky-700 hover:text-sky-900 underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
