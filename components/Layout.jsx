import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import {
  HomeIcon,
  DocumentDuplicateIcon,
  BellIcon,
  ArrowLeftOnRectangleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

// --- This is the new Header Component without the Search Bar ---
const Header = () => {
  const { data: session } = useSession();
  return (
    <header
      className="bg-sky-700 shadow-sm w-full flex items-center justify-between px-6 h-16 fixed top-0 left-0 z-30"
      style={{ right: 0 }}
    >
      {/* Left Side: Title */}
      <div>
        <Link href="/dashboard" className="text-2xl font-bold text-white">
          ProjectRepo
        </Link>
      </div>

      {/* Right Side: User Actions */}
      <div className="flex items-center space-x-4">
        {session?.user?.role === 'STUDENT' && (
          <Link
            href="/projects/new"
            className="px-4 py-2 bg-white text-sky-600 text-sm font-semibold rounded-md hover:bg-white transition-colors hidden sm:block"
          >
            + Add New Project
          </Link>
        )}
        <div>
          <div className="font-medium text-white text-right">
            {session?.user?.name}
          </div>
          <div className="text-xs text-gray-300 text-centeru">
            {session?.user?.role}
          </div>
        </div>
      </div>
    </header>
  );
};

const Sidebar = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const navLinks = [
    { href: "/dashboard", label: "Home & Search", icon: HomeIcon },
    { href: "/my-projects", label: "My Projects", icon: DocumentDuplicateIcon },
    { href: "/notifications", label: "Notifications", icon: BellIcon },
  ];

  const supervisorLinks = [
    { href: "/dashboard", label: "Home & Search", icon: HomeIcon },
    { href: "/review", label: "Review", icon: HomeIcon },
    {
      href: "/my-supervised",
      label: "Supervised",
      icon: DocumentDuplicateIcon,
    },
    { href: "/notifications", label: "Notifications", icon: BellIcon },
  ];

  const adminLinks = [
    { href: "/admin/users", label: "Users", icon: HomeIcon },
    { href: "/admin/classlist", label: "Classlist", icon: DocumentDuplicateIcon },
    { href: "/admin/projects", label: "Projects", icon: BellIcon },
    
  ];

  // Use role-based links
  let linksToShow = navLinks;
  if (session?.user?.role === 'SUPERVISOR') {
    linksToShow = supervisorLinks;
  } else if (session?.user?.role === 'ADMIN') {
    linksToShow = adminLinks;
  }

  return (
    <div className="w-64 bg-sky-700 text-white flex flex-col  md:flex">
      {/* Hide sidebar on small screens */}
      <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
        Menu
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {linksToShow.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={`flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              router.pathname === link.href || (link.href.startsWith('/dashboard') && router.pathname === '/dashboard')
                ? "bg-white text-black"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <link.icon className="h-6 w-6 mr-3" />
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="px-2 py-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full flex items-center px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
          Sign Out
        </button>
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

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ paddingTop: "4rem" }}
      >
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
