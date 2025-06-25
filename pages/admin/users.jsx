import { getSession } from "next-auth/react";
import Head from "next/head";
import prisma from "../../lib/prisma";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";

const AdminUsersPage = ({ initialUsers }) => {
  const [users, setUsers] = useState(initialUsers);
  const [editingUserId, setEditingUserId] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", role: "STUDENT" });
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });
  const router = useRouter();
  const debounceRef = useRef();
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  // Only set edit form when entering edit mode
  useEffect(() => {
    if (editingUserId) {
      const user = users.find(u => u.id === editingUserId);
      if (user) setEditForm({ name: user.name, email: user.email, role: user.role });
    }
  }, [editingUserId, users]);

  const filteredUsers = users.filter((user) => {
    const lower = debouncedSearch.toLowerCase();
    return (
      user.name.toLowerCase().includes(lower) ||
      user.email.toLowerCase().includes(lower) ||
      user.role.toLowerCase().includes(lower)
    );
  });

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) throw new Error("Failed to update role.");
      setUsers(users => users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete user.");
      setUsers(users => users.filter(u => u.id !== userId));
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!response.ok) throw new Error("Failed to create user.");
      const newUser = await response.json();
      setUsers(users => [...users, newUser]);
      setShowCreate(false);
      setCreateForm({ name: "", email: "", role: "STUDENT" });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleEditUser = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!response.ok) throw new Error("Failed to update user.");
      setUsers(users => users.map(u => u.id === userId ? { ...u, ...editForm } : u));
      setEditingUserId(null);
      setEditForm({ name: "", email: "", role: "" });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <Head>
        <title>Admin: Manage Users</title>
      </Head>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Users</h1>
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, email, or role..."
            className="w-full md:w-96 px-4 py-2 border border-sky-300 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition placeholder-gray-400 text-gray-800"
          />
          <button
            onClick={() => setShowCreate(v => !v)}
            className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 text-sm font-semibold"
          >
            {showCreate ? 'Cancel' : 'Add User'}
          </button>
        </div>
        {showCreate && (
          <form onSubmit={handleCreateUser} className="mb-6 flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              required
              placeholder="Name"
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded w-48"
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded w-64"
            />
            <select
              value={createForm.role}
              onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
              className="px-2 py-2 border border-gray-300 rounded"
            >
              <option value="STUDENT">Student</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold">Create</button>
          </form>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editingUserId === user.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    ) : (
                      user.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingUserId === user.id ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    ) : (
                      user.email
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingUserId === user.id ? (
                      <select
                        value={editForm.role}
                        onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <div className="flex items-center space-x-2">
                      {editingUserId === user.id ? (
                        <>
                          <button
                            onClick={() => handleEditUser(user.id)}
                            className="px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingUserId(null); setEditForm({ name: "", email: "", role: "" }); }}
                            className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingUserId(user.id); setEditForm({ name: user.name, email: user.email, role: user.role }); }}
                            className="px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "ADMIN") {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });

  return { props: { initialUsers: users } };
}

export default AdminUsersPage;
