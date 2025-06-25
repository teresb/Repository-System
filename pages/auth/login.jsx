import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const LoginPage = () => {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (router.query.message) setMessage(router.query.message);
    if (router.query.error) setServerError("Invalid email or password.");
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
      email: data.email,
      password: data.password,
    });
    setIsLoading(false);

    if (result.error) {
      setServerError("Invalid email or password. Please try again.");
    } else if (result.ok) {
      router.push('/dashboard');
    }
  };

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-sky-200 relative">
        <div className="absolute inset-0 w-full h-full backdrop-blur-md bg-white/60 -z-0"></div>
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md relative z-10">
          <div className='flex flex-col bg-sky-600 py-8 -mx-8 -mt-8 mb-8 rounded-t-lg shadow-xl justify-center items-center'>
            <img src="/images/ublogo.png" alt="Logo" className="w-20 h-20" />
            <h1 className='py-3 text-xl text-white font-bold text-center'>Department of Computer Engineering</h1>
            <p className='text-xs px-6 text-center text-white'>Login to your account below</p>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login to Your Account</h1>

          {message && (
            <p className="text-green-600 bg-green-100 p-3 rounded-md text-sm mb-4">{message}</p>
          )}
          {serverError && (
            <p className="text-red-500 bg-red-100 p-3 rounded-md text-sm mb-4">{serverError}</p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border rounded-md text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-sky-600 hover:text-sky-500">
              Register
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
