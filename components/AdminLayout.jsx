import Link from "next/link";
import { useRouter } from "next/router";

const adminLinks = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/classlist", label: "Class List" },
  // Add more links as needed
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  // Admin pages should NOT be wrapped with the main Layout/header!
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-sky-800 via-sky-700 to-sky-600">
      {/* Sidebar - z-50 to ensure it's above any other layout, and no header should be present */}
      <aside className="w-64 hidden md:flex flex-col bg-gradient-to-b from-sky-900 via-sky-800 to-sky-700 text-white shadow-2xl border-r border-sky-900 fixed left-0 top-0 bottom-0 z-50 m-0 p-0">
        <div className="flex items-center gap-3 px-6 py-8 border-b border-sky-800">
          <img src="/images/ublogo.png" alt="Logo" className="w-10 h-10 bg-white rounded shadow" />
          <div className="font-extrabold text-lg leading-tight">Admin Panel</div>
        </div>
        <nav className="flex-1 px-2 py-6 space-y-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded-lg font-semibold transition-colors text-base ${
                router.pathname.startsWith(link.href)
                  ? "bg-sky-600 text-white shadow"
                  : "text-sky-100 hover:bg-sky-700 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-6 border-t border-sky-800">
          <button
            onClick={() => {
              // Use NextAuth signOut
              import('next-auth/react').then(({ signOut }) => signOut({ callbackUrl: '/auth/login' }));
            }}
            className="w-full px-4 py-2 bg-white text-sky-800 font-bold rounded-lg shadow hover:bg-sky-100 border border-sky-200 transition-colors text-base"
          >
            Sign Out
          </button>
        </div>
      </aside>
      {/* Main Content - add md:ml-64 so content never appears under the sidebar */}
      <main className="flex-1 min-w-0 bg-gray-100 p-4 md:p-10 md:ml-64" style={{ minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
