import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import {
  HomeIcon,
  DocumentDuplicateIcon,
  BellIcon,
  ArrowLeftOnRectangleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

// --- This is the new Header Component without the Search Bar ---
const Header = () => {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClick);
    } else {
      document.removeEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotifications]);

  return (
    <header
      className="bg-sky-700 shadow-sm w-full flex items-center justify-between px-6 h-24 fixed top-0 left-0 z-30"
      style={{ right: 0 }}
    >
      {/* Left Side: Title */}
      <div>
        <Link href="/dashboard" className="text-4xl font-bold text-white">
          ProjectRepo
        </Link>
      </div>

      {/* Right Side: User Actions */}
      <div className="flex items-center space-x-4">
        <div>
          <div className="font-medium text-white text-right">
            {session?.user?.name}
          </div>
          <div className="text-xs text-gray-300 text-centeru">
            {session?.user?.role}
          </div>
        </div>
        {/* Add New Project Icon for STUDENT */}
        {session?.user?.role === "STUDENT" && (
          <Link href="/projects/new" className="relative group">
            <PencilSquareIcon className="h-8 w-8 text-white hover:text-sky-200 transition-colors" />
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-900 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              Add New Project
            </span>
          </Link>
        )}
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="group focus:outline-none"
          >
            <BellIcon className="h-7 w-7 text-white hover:text-sky-200 transition-colors" />
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-900 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              Notifications
            </span>
          </button>
          {showNotifications && (
            <NotificationsDropdown
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="px-4 py-2 bg-white text-sky-600 text-sm font-semibold rounded-md hover:bg-gray-100 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};

// Notifications Dropdown Component
const NotificationsDropdown = ({ onClose }) => {
  // You can fetch notifications here or pass them as props
  // For demo, just show a placeholder
  return (
    <div className="absolute right-0 mt-2 w-120 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100">
        <h2 className="text-base font-semibold text-sky-700">Notifications</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-lg font-bold"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      {/* Replace below with actual notifications list */}
      <div className="p-4 text-gray-600">no notifications</div>
    </div>
  );
};

const Layout = ({ children }) => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <main className="w-full max-w-md">{children}</main>
      </div>
    );
  }

  // No sidebar, just header and main content
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main
        className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6"
        style={{ paddingTop: "6rem" }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
