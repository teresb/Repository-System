import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  HomeIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-sky-600">
              ProjectRepo
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                href="/"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <HomeIcon className="h-4 w-4 mr-1" /> Home
              </Link>

              {isLoading ? (
                <div className="px-3 py-2 text-sm">Loading...</div>
              ) : session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center p-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    <UserCircleIcon className="h-4 w-4 mr-1" /> Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center p-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    <ArrowRightStartOnRectangleIcon className="h-4 w-4 mr-1" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex items-center p-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" /> Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex items-center bg-sky-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-sky-700"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-1" /> Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-gray-100 text-gray-500 text-center py-4 text-sm">
        <p>&copy; {new Date().getFullYear()} Computer Engineering Department</p>
      </footer>
    </div>
  );
};

export default Layout;
