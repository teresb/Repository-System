import { getSession } from "next-auth/react";
import Head from "next/head";
import prisma from "../../lib/prisma";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../components/AdminLayout";

const AdminUsersPage = ({ initialUsers }) => {
  const [users, setUsers] = useState(initialUsers);
  const [editingUserId, setEditingUserId] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", matricule: "", role: "STUDENT", password: "" });
  const [editForm, setEditForm] = useState({ name: "", matricule: "", role: "" });
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
      if (user) setEditForm({ name: user.name, matricule: user.matricule, role: user.role });
    }
  }, [editingUserId, users]);

  const filteredUsers = users.filter((user) => {
    const lower = debouncedSearch.toLowerCase();
    return (
      (user.name?.toLowerCase() || "").includes(lower) ||
      (user.matricule?.toLowerCase() || "").includes(lower) ||
      (user.role?.toLowerCase() || "").includes(lower)
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
        credentials: "same-origin"
      });
      if (!response.ok) throw new Error("Failed to create user.");
      const newUser = await response.json();
      setUsers(users => [...users, newUser]);
      setShowCreate(false);
      setCreateForm({ name: "", matricule: "", role: "STUDENT", password: "" });
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
      setEditForm({ name: "", matricule: "", role: "" });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Admin: Manage Users</title>
      </Head>
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-8 sm:p-12 border border-sky-100">
        <div className="flex flex-col items-center justify-center bg-sky-100 py-8 -mx-12 -mt-12 mb-10 rounded-t-2xl shadow-xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sky-700 mb-1 tracking-tight">Admin: Manage Users</h1>
          <p className="text-xs sm:text-sm px-6 text-center text-sky-700 font-medium">View, add, edit, or remove users. Use the search to filter by name, matricule, or role.</p>
        </div>
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, matricule, or role..."
            className="w-full md:w-96 px-4 py-2 border border-sky-200 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-500 transition placeholder-sky-400 text-gray-00 bg-sky-50"
          />
          <button
            onClick={() => setShowCreate(v => !v)}
            className="px-5 py-2 bg-gradient-to-r from-sky-700 to-sky-600 text-white rounded-lg shadow hover:from-sky-800 hover:to-sky-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
          >
            {showCreate ? 'Cancel' : 'Add User'}
          </button>
        </div>
        {showCreate && (
          <form onSubmit={handleCreateUser} className="mb-8 flex flex-col md:flex-row gap-2 items-center bg-sky-50 border border-sky-100 rounded-lg p-4">
            <input
              type="text"
              required
              placeholder="Name"
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              className="text-gray-400 px-2 py-2 border border-sky-200 rounded-lg bg-white w-46 focus:ring-2 focus:ring-sky-400 focus:border-sky-500"
            />
            <input
              type="text"
              required
              placeholder="Matricule"
              value={createForm.matricule}
              onChange={e => setCreateForm(f => ({ ...f, matricule: e.target.value }))}
              className="text-gray-400 px-2 py-2 border border-sky-200 rounded-lg bg-white w-46 focus:ring-2 focus:ring-sky-400 focus:border-sky-500"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={createForm.password}
              onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
              className="text-gray-400 px-2 py-2 border border-sky-200 rounded-lg bg-white w-46 focus:ring-2 focus:ring-sky-400 focus:border-sky-500"
            />
            <select
              value={createForm.role}
              onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
              className="text-gray-400 px-2 py-2 border border-sky-200 rounded-lg bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-500"
            >
              <option value="STUDENT">Student</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="px-5 py-2 bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 transition">Create</button>
          </form>
        )}
        <div className="overflow-x-auto rounded-lg border border-sky-100 bg-sky-50">
          <table className="min-w-full divide-y divide-sky-100">
            <thead className="bg-sky-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase tracking-wider">Matricule</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-sky-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-sky-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-sky-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-sky-900">
                    {editingUserId === user.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="border border-sky-200 rounded-lg px-2 py-1 text-sm bg-white text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    ) : (
                      user.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-700">
                    {editingUserId === user.id ? (
                      <input
                        type="text"
                        value={editForm.matricule}
                        onChange={e => setEditForm(f => ({ ...f, matricule: e.target.value }))}
                        className="border border-sky-200 rounded-lg px-2 py-1 text-sm bg-white text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    ) : (
                      user.matricule
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-700">
                    {editingUserId === user.id ? (
                      <select
                        value={editForm.role}
                        onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                        className="border border-sky-200 rounded-lg px-2 py-1 text-sm bg-white text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {editingUserId === user.id ? (
                        <>
                          <button
                            onClick={() => handleEditUser(user.id)}
                            className="px-3 py-1 bg-sky-700 text-white rounded-lg shadow hover:bg-sky-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingUserId(null); setEditForm({ name: '', matricule: '', role: '' }); }}
                            className="px-2 py-1 bg-gray-200 text-sky-800 rounded-lg shadow hover:bg-gray-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-200 transition"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingUserId(user.id); setEditForm({ name: user.name, matricule: user.matricule, role: user.role }); }}
                            className="px-3 py-1 bg-sky-700 text-white rounded-lg shadow hover:bg-sky-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-400 transition"
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
    </AdminLayout>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== "ADMIN") {
    return { redirect: { destination: "/", permanent: false } };
  }

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, matricule: true, role: true },
  });

  return { props: { initialUsers: users } };
}

export default AdminUsersPage;
