import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import {
  HomeIcon,
  DocumentDuplicateIcon,
  BellIcon,
  ArrowLeftOnRectangleIcon,
  PencilSquareIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

// --- This is the new Header Component without the Search Bar ---
const Header = () => {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const notifRef = useRef();

  // Fetch supervisor pending review count
  useEffect(() => {
    let interval;
    async function fetchPending() {
      if (session?.user?.role === "SUPERVISOR") {
        try {
          const res = await fetch("/api/projects/pending-review-count");
          if (res.ok) {
            const data = await res.json();
            setPendingReviewCount(data.count || 0);
          }
        } catch {}
      }
    }
    fetchPending();
    // Refresh every 30 seconds
    if (session?.user?.role === "SUPERVISOR") {
      interval = setInterval(fetchPending, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session?.user?.role]);

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
      className="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 shadow-lg w-full flex items-center justify-between px-6 h-22 fixed top-0 left-0 z-30 border-b-4 border-sky-900"
      style={{ right: 0 }}
    >
      {/* Left Side: Logo and Title */}
      <div className="flex items-center gap-4">
        <img
          src="/images/ublogo.png"
          alt="Logo"
          className="w-14 h-14 rounded bg-white p-1 shadow"
        />
        <div>
          <Link
            href="/"
            className="text-3xl font-extrabold text-white tracking-tight leading-tight"
          >
            Project Repository
          </Link>
          <div className="text-xs text-sky-100 font-medium tracking-wide">
            Department of Computer Engineering
          </div>
        </div>
      </div>

      {/* Right Side: User Actions */}
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="font-semibold text-white text-lg">
            {session?.user?.name}
          </div>
          <div className="text-xs text-sky-200 uppercase tracking-wider">
            {session?.user?.role}
          </div>
        </div>
        {/* Projects Icon for STUDENT */}
        {session?.user?.role === "STUDENT" && (
          <Link href="/my-projects" className="relative group">
            <DocumentDuplicateIcon className="h-8 w-8 text-white hover:text-sky-200 transition-colors" />
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-900 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              My Projects
            </span>
          </Link>
        )}
        {/* Supervisor Review Icon */}
        {session?.user?.role === "SUPERVISOR" && (
          <Link href="/review" className="relative group">
            <ClipboardDocumentCheckIcon className="h-8 w-8 text-white hover:text-sky-200 transition-colors" />
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-900 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              Projects Needing Review
            </span>
            {pendingReviewCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow border-2 border-white">
                {pendingReviewCount}
              </span>
            )}
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
          className="px-5 py-2 bg-white text-sky-700 text-base font-bold rounded-md shadow hover:bg-sky-100 border border-sky-200 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};

// Notifications Dropdown Component
const NotificationsDropdown = ({ onClose }) => {
  const dropdownRef = React.useRef();
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Fetch notifications on mount and every 30 seconds
  React.useEffect(() => {
    let interval;
    async function fetchNotifications() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        setError("Could not load notifications.");
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
    interval = setInterval(fetchNotifications, 30000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Focus trap and ESC to close
  React.useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
      // Trap focus inside dropdown
      if (e.key === "Tab" && dropdownRef.current) {
        const focusable = dropdownRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-50 border border-sky-100 ring-1 ring-sky-200 focus:outline-none animate-fade-in-slide"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
    >
      <div className="flex justify-between items-center px-5 py-3 border-b border-sky-100 bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 rounded-t-xl">
        <h2 className="text-base font-bold text-white tracking-wide">
          Notifications
        </h2>
        <button
          onClick={onClose}
          className="text-sky-200 hover:text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 rounded"
          aria-label="Close notifications dropdown"
        >
          &times;
        </button>
      </div>
      <div className="p-5 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-sky-700 font-medium text-sm opacity-80 py-6 bg-sky-50 rounded-lg border border-sky-100 text-center">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="text-red-600 font-medium text-sm py-6 bg-red-50 rounded-lg border border-red-100 text-center">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-sky-700 font-medium text-sm opacity-80 py-6 bg-sky-50 rounded-lg border border-sky-100 text-center">
            No notifications
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.slice(0, 8).map((notif) => (
              <li key={notif.id} className={`p-3 ${!notif.isRead ? 'bg-sky-50' : ''}`}>
                <Link href={notif.link || '#'} className="block hover:bg-gray-50 rounded transition">
                  <div className="flex items-center">
                    {!notif.isRead && <div className="h-2 w-2 bg-sky-500 rounded-full mr-3"></div>}
                    <p className={`flex-1 text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {notif.message}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-right">
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
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
        style={{ paddingTop: "7.5rem", minHeight: "calc(100vh - 7.5rem)" }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
