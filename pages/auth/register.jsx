import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Split schemas for each step
const registerStep1Schema = z.object({
  name: z.string().min(2, "Full name is required"),
  matricule: z.string().min(8, "Matricule is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
const registerStep2Schema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const RegisterPage = () => {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [pendingData, setPendingData] = useState({});
  const [showSendOtp, setShowSendOtp] = useState(false);

  // Use correct schema per step
  const form = useForm({
    resolver: zodResolver(step === 1 ? registerStep1Schema : registerStep2Schema),
    defaultValues: { name: '', matricule: '', password: '', otp: '' }
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = form;

  // Step 1: Show OTP info and Send OTP button
  const handleRegisterClick = (data) => {
    setPendingData({ name: data.name, matricule: data.matricule, password: data.password });
    setShowSendOtp(true);
    setServerError('');
  };

  // Step 2: Actually send OTP
  const handleSendOtp = async () => {
    setIsLoading(true);
    setServerError('');
    try {
      const response = await fetch('/api/auth/register/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pendingData.name,
          matricule: pendingData.matricule,
          password: pendingData.password
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'An error occurred');
      setStep(2);
    } catch (error) {
      setServerError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerify = async (data) => {
    setIsLoading(true);
    setServerError('');
    try {
      const response = await fetch('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricule: pendingData.matricule, otp: data.otp })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'An error occurred');
      reset();
      router.push('/auth/login?message=Registration successful! Please log in.');
    } catch (error) {
      setServerError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-sky-200 relative">
        <div className="absolute inset-0 h-full backdrop-blur-md bg-white/60 -z-0"></div>
        <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-2xl relative z-10 border border-sky-200">
          <div className='flex flex-col bg-sky-700 py-4 -mx-6 -mt-10 mb-6 rounded-t-xl shadow-xl justify-center items-center'>
            <img src="/images/ublogo.png" alt="Logo" className="w-16 h-16" />
            <h1 className='py-2 text-lg text-white font-bold text-center tracking-tight'>Department of Computer Engineering</h1>
            <p className='text-sm px-4 text-center text-sky-100'>Create your student account below</p>
          </div>

          {serverError && (
            <p className="text-red-700 bg-red-100 p-3 rounded-md text-sm mb-4 font-semibold text-center">{serverError}</p>
          )}

          {step === 1 && !showSendOtp && (
            <form onSubmit={handleSubmit(handleRegisterClick)} className="space-y-3">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-sky-800 mb-1">Full Name</label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full px-3 py-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-600 text-base"
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
                {errors.name && (
                  <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="matricule" className="block text-sm font-semibold text-sky-800 mb-1">Matricule</label>
                <input
                  id="matricule"
                  type="text"
                  {...register('matricule')}
                  className="mt-1 block w-full px-3 py-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-600 text-base"
                  placeholder="Enter your matricule"
                  autoComplete="off"
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
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-3 border rounded-md text-base font-bold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-gray-400 border-sky-300 shadow"
              >
                {isLoading ? 'Processing...' : 'Register'}
              </button>
            </form>
          )}

          {step === 1 && showSendOtp && (
            <div className="space-y-4">
              <div className="text-center text-sky-800 font-semibold text-sm mb-2">
                An OTP will be sent to your student email address associated with your matricule.<br />
                Please click the button below to receive your OTP.
              </div>
              <button
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-3 border rounded-md text-base font-bold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-gray-400 border-sky-300 shadow"
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
              <button
                onClick={() => setShowSendOtp(false)}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-3 border rounded-md text-base font-semibold text-sky-700 bg-sky-50 border-sky-300 mt-1 hover:bg-sky-100 transition"
              >
                Back
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(handleVerify)} className="space-y-3">
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-sky-800 mb-1">Enter OTP (sent to your email)</label>
                <input
                  id="otp"
                  type="text"
                  {...register('otp')}
                  className="mt-1 block w-full px-3 py-2 border border-sky-300 rounded-md focus:ring-sky-500 focus:border-sky-600 text-base"
                  placeholder="Enter the 6-digit OTP"
                  autoComplete="off"
                  maxLength={6}
                />
                {errors.otp && (
                  <p className="text-red-600 text-xs mt-1">{errors.otp.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-3 border rounded-md text-base font-bold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-gray-400 border-sky-300 shadow"
              >
                {isLoading ? 'Verifying...' : 'Verify & Register'}
              </button>
            </form>
          )}

          <p className="mt-3 text-center text-sm text-sky-700">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-bold text-sky-700 hover:text-sky-900 underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
