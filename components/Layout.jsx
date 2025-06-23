import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import {
  HomeIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowLeftStartOnRectangleIcon,
  UserPlusIcon,
  BookOpenIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

const Layout = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch("/api/notifications/unread-count");
          if (response.ok) {
            const data = await response.json();
            setUnreadCount(data.count);
          }
        } catch (error) {
          console.error("Failed to fetch unread notifications count", error);
        }
      };
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const navLinks = [
    { href: "/dashboard", icon: UserCircleIcon, label: "Dashboard" },
    { href: "/repository", icon: BookOpenIcon, label: "Repository" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-sky-600">
              ProjectRepo
            </Link>
            <div className="flex items-center space-x-1">
              <Link
                href="/"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  router.pathname === "/"
                    ? "bg-gray-100 text-sky-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <HomeIcon className="h-5 w-5" />
                <span className="ml-2 hidden sm:inline">Home</span>
              </Link>

              {status === "loading" ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Loading...
                </div>
              ) : session ? (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        router.pathname.startsWith(link.href)
                          ? "bg-gray-100 text-sky-600"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <link.icon className="h-5 w-5" />
                      <span className="ml-2 hidden sm:inline">
                        {link.label}
                      </span>
                    </Link>
                  ))}
                  <Link
                    href="/notifications"
                    className="relative flex items-center p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <BellIcon className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center p-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Sign Out"
                  >
                    <ArrowRightStartOnRectangleIcon className="h-6 w-6" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex items-center bg-sky-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-sky-700 transition-colors shadow-sm"
                  >
                    Register
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

      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Computer Engineering Department.
            All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
